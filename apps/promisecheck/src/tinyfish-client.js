/**
 * TinyFish Web Agent Client
 * Orchestrates remote browser sessions via TinyFish APIs to audit public websites.
 */

const http = require('http');
const https = require('https');

class TinyFishClient {
  constructor(apiKey = process.env.TINYFISH_API_KEY, endpoint = process.env.TINYFISH_API_ENDPOINT) {
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://api.tinyfish.ai/v1';
  }

  /**
   * Validates whether a target URL is accessible to TinyFish remote browser agents.
   * Remote browsers in the cloud cannot resolve localhost or 127.0.0.1.
   */
  validateUrlReachability(targetUrl) {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new Error(`Invalid URL provided: "${targetUrl}". Expected format: https://...`);
    }

    const host = parsed.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');

    if (isLocal) {
      console.warn(`\n⚠️  WARNING: Target is "${targetUrl}".`);
      console.warn(`   TinyFish cloud agents run in remote datacenters and CANNOT connect to your laptop's localhost.`);
      console.warn(`   To test TinyFish, expose your café via a public tunnel (npm run tunnel in apps/cafe).\n`);
    }

    return { isValid: true, isLocal, url: parsed.href };
  }

  /**
   * Dispatches TinyFish to visit and audit the specified public URL.
   * If TINYFISH_API_KEY is configured, calls TinyFish cloud agent API.
   * Otherwise, runs in agent simulation mode by fetching public HTML.
   */
  async visitAndAudit(targetUrl) {
    const { isLocal, url } = this.validateUrlReachability(targetUrl);

    if (this.apiKey && !isLocal) {
      return await this._callTinyFishApi(url);
    }

    // Agent emulation fallback (fetches page content and extracts semantic data)
    return await this._fetchHtml(url);
  }

  async _callTinyFishApi(url) {
    console.log(`[TinyFish] Dispatching cloud browser agent to ${url}...`);
    // TinyFish Agent API integration
    const payload = JSON.stringify({
      url: url,
      actions: ["extract_text", "extract_structured_data", "capture_screenshot"]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(`${this.endpoint}/agent/audit`, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  async _fetchHtml(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        let html = '';
        res.on('data', chunk => html += chunk);
        res.on('end', () => {
          resolve({
            url,
            statusCode: res.statusCode,
            html,
            text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          });
        });
      });
      req.on('error', (err) => {
        reject(new Error(`Failed to visit café at "${url}": ${err.message}`));
      });
    });
  }
}

module.exports = TinyFishClient;
