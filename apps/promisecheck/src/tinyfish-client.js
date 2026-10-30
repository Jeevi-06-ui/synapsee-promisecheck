const { setTimeout: delay } = require('node:timers/promises');

// Official Agent API: https://docs.tinyfish.ai/agent-api
const API_ORIGIN = 'https://agent.tinyfish.ai';

class TinyFishClient {
  constructor({ apiKey = process.env.TINYFISH_API_KEY, fetchImpl = fetch,
    pollIntervalMs = 5000, timeoutMs = 15 * 60 * 1000 } = {}) {
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
    this.pollIntervalMs = pollIntervalMs;
    this.timeoutMs = timeoutMs;
  }

  redact(value) {
    const text = String(value);
    return this.apiKey ? text.split(this.apiKey).join('[REDACTED]') : text;
  }

  validateUrlReachability(targetUrl) {
    const url = new URL(targetUrl);
    const host = url.hostname.toLowerCase();
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '0.0.0.0' || host === '[::1]' || /^127\./.test(host) ||
      /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      throw new Error('TinyFish requires a public HTTP(S) URL without embedded credentials.');
    }
    return url.href;
  }

  async request(path, { method = 'GET', body } = {}) {
    if (!this.apiKey?.trim()) {
      throw new Error('TINYFISH_API_KEY is required. Configure apps/promisecheck/.env or the backend process environment. No HTML fallback is available.');
    }
    let response;
    try {
      response = await this.fetch(`${API_ORIGIN}${path}`, {
        method, redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { 'X-API-Key': this.apiKey, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
    } catch {
      throw new Error(`TinyFish ${method} request failed or timed out. Do not start a duplicate run; inspect existing runs at https://agent.tinyfish.ai first.`);
    }
    let data;
    try { data = await response.json(); } catch {
      throw new Error(`TinyFish returned non-JSON (HTTP ${response.status}); no browser result was accepted.`);
    }
    if (!response.ok) {
      const detail = data.error?.message || data.error?.code || 'request rejected';
      throw new Error(this.redact(`TinyFish HTTP ${response.status}: ${detail}`));
    }
    return data;
  }

  async getRun(runId) {
    return this.request(`/v1/runs/${encodeURIComponent(runId)}?screenshots=url`);
  }

  async visitAndAudit(targetUrl, { goal, outputSchema, runId, onUpdate = () => {} }) {
    const url = this.validateUrlReachability(targetUrl);
    // Start once, then await in this process. Never retry an ambiguous POST.
    if (!runId) {
      const started = await this.request('/v1/automation/run-async', {
        method: 'POST', body: {
          url, goal, output_schema: outputSchema, browser_profile: 'lite',
          capture_config: { screenshots: true, recording: true }
        }
      });
      if (started.error) throw new Error(this.redact(`TinyFish rejected run creation: ${started.error.message || started.error.code}`));
      if (!started.run_id) throw new Error('TinyFish did not return a run_id; inspect existing runs before retrying.');
      runId = started.run_id;
      await onUpdate({ run_id: runId, status: 'PENDING' });
    }
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      let run;
      try { run = await this.getRun(runId); } catch (error) {
        throw new Error(`${error.message} Resume this run with --run-id ${runId}.`);
      }
      await onUpdate(run);
      if (run.status === 'COMPLETED') {
        if (!run.result || run.result.error || run.result.status === 'failure') {
          throw new Error(`TinyFish run ${runId} completed without usable observations. Inspect saved evidence.`);
        }
        return run;
      }
      if (['FAILED', 'CANCELLED'].includes(run.status)) throw new Error(`TinyFish run ${runId}: ${run.status}. Inspect saved evidence.`);
      if (!['PENDING', 'RUNNING'].includes(run.status)) throw new Error(`Unexpected TinyFish status for run ${runId}.`);
      await delay(this.pollIntervalMs);
    }
    throw new Error(`TinyFish run ${runId} is still active. Resume with --run-id ${runId}; do not launch a duplicate.`);
  }
}

module.exports = TinyFishClient;
