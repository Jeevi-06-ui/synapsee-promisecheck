/**
 * Job Runner & Local Persistence Manager
 * 
 * Orchestrates audit executions, enforces single-run concurrency locks,
 * saves tamper-evident reports to apps/promisecheck/evidence/, and manages history.
 */

const fs = require('node:fs');
const path = require('node:path');
const { getConfig, redact, validatePublicUrl } = require('./config');
const { DEFAULT_OWNER_RULES } = require('./rules');
const { JOURNEYS, getJourneyById, journeyOutputSchema } = require('./journeys');
const { evaluateJourney } = require('./evaluator');
const TinyFishClient = require('./tinyfish-client');
const SimulationProvider = require('./simulator');

class JobRunner {
  constructor({ evidenceDir } = {}) {
    this.config = getConfig();
    this.evidenceDir = evidenceDir || this.config.evidenceDir;
    fs.mkdirSync(this.evidenceDir, { recursive: true });

    this.activeJob = null; // Single active audit lock
    this._reconcileInterruptedRuns();
  }

  /**
   * On startup, scans evidence directory for any jobs that were left in 'RUNNING' or 'PENDING'
   * status due to an ungraceful process termination, and marks them 'INTERRUPTED'.
   */
  _reconcileInterruptedRuns() {
    try {
      const files = fs.readdirSync(this.evidenceDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(this.evidenceDir, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (content.status === 'RUNNING' || content.status === 'PENDING') {
            content.status = 'INTERRUPTED';
            content.interruptedAt = new Date().toISOString();
            content.error = 'Audit process was interrupted by server restart or process termination.';
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), { mode: 0o600 });
          }
        } catch {
          // ignore corrupted files during reconciliation
        }
      }
    } catch {
      // directory read failure ignore
    }
  }

  isBusy() {
    return this.activeJob !== null && ['PENDING', 'RUNNING'].includes(this.activeJob.status);
  }

  getActiveJobStatus() {
    if (!this.activeJob) return { status: 'IDLE' };
    return {
      jobId: this.activeJob.id,
      status: this.activeJob.status,
      mode: this.activeJob.mode,
      targetUrl: this.activeJob.targetUrl,
      scenario: this.activeJob.scenario,
      plannedCount: this.activeJob.plannedCount,
      completedCount: this.activeJob.completedCount,
      currentJourneyId: this.activeJob.currentJourneyId,
      currentAction: this.activeJob.currentAction,
      startedAt: this.activeJob.startedAt,
      completedAt: this.activeJob.completedAt,
      findings: this.activeJob.findings || [],
      error: this.activeJob.error || null,
      steps: this.activeJob.currentSteps || []
    };
  }

  /**
   * Safe synchronous atomic-write wrapper
   */
  _saveEvidence(job) {
    if (!job.evidencePath) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      job.evidencePath = path.join(this.evidenceDir, `audit-${ts}-${job.id}.json`);
    }

    const payload = redact(JSON.stringify({
      id: job.id,
      mode: job.mode,
      simulationNotice: job.mode === 'simulated' ? 'SIMULATED — NOT A LIVE AUDIT' : null,
      status: job.status,
      targetUrl: job.targetUrl,
      scenario: job.scenario,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      rules: job.rules,
      plannedJourneys: job.plannedJourneys,
      findings: job.findings,
      runs: job.runs,
      error: job.error || null
    }, null, 2));

    const tempPath = `${job.evidencePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tempPath, payload, { mode: 0o600 });
    fs.renameSync(tempPath, job.evidencePath);
  }

  /**
   * Starts a new audit job asynchronously.
   * Immediately returns the generated Job ID.
   */
  startJob({
    targetUrl,
    mode = 'simulated', // 'live' | 'simulated'
    scenario = 'both',  // 'buggy' | 'fixed' | 'both'
    journeyIds = [],
    rules = DEFAULT_OWNER_RULES
  } = {}) {
    if (this.isBusy()) {
      const err = new Error(`An audit job (${this.activeJob.id}) is already currently running. Please wait for it to complete.`);
      err.code = 'JOB_ACTIVE';
      throw err;
    }

    const cleanedUrl = (targetUrl && targetUrl.trim()) || this.config.cafePublicUrl;
    
    // In live mode, validate URL reachability for cloud agents and verify API key
    if (mode === 'live') {
      validatePublicUrl(cleanedUrl);
      if (!this.config.hasApiKey) {
        throw new Error('TINYFISH_API_KEY is required for live execution. Configure apps/promisecheck/.env or process environment.');
      }
    }

    // Determine journeys to run
    let selectedJourneys = [];
    if (Array.isArray(journeyIds) && journeyIds.length > 0) {
      selectedJourneys = journeyIds.map(id => getJourneyById(id)).filter(Boolean);
    }
    if (selectedJourneys.length === 0) {
      selectedJourneys = [...JOURNEYS]; // Run full suite
    }

    // Determine scenarios to run
    const scenarios = scenario === 'both' ? ['buggy', 'fixed'] : [scenario];

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const job = {
      id: jobId,
      mode,
      status: 'PENDING',
      targetUrl: cleanedUrl,
      scenario,
      scenarios,
      rules: rules || DEFAULT_OWNER_RULES,
      plannedJourneys: selectedJourneys.map(j => ({ id: j.id, name: j.name, category: j.category })),
      plannedCount: selectedJourneys.length * scenarios.length,
      completedCount: 0,
      currentJourneyId: null,
      currentAction: 'Initializing audit run...',
      startedAt: new Date().toISOString(),
      completedAt: null,
      findings: [],
      runs: [],
      currentSteps: [],
      error: null,
      evidencePath: null
    };

    this.activeJob = job;
    this._saveEvidence(job);

    // Kick off asynchronous background execution loop
    setImmediate(() => this._executeJob(job, selectedJourneys, scenarios));

    return {
      jobId,
      status: job.status,
      mode: job.mode,
      plannedCount: job.plannedCount,
      targetUrl: job.targetUrl
    };
  }

  async _executeJob(job, journeys, scenarios) {
    job.status = 'RUNNING';
    this._saveEvidence(job);

    const simulator = new SimulationProvider({ stepDelayMs: 200 });
    const tinyFishClient = job.mode === 'live' ? new TinyFishClient() : null;

    try {
      for (const sc of scenarios) {
        for (const journey of journeys) {
          job.currentJourneyId = `${sc}:${journey.id}`;
          job.currentAction = `Starting ${journey.name} on ${sc} scenario...`;
          job.currentSteps = [];
          this._saveEvidence(job);

          let runData = null;

          if (job.mode === 'simulated') {
            runData = await simulator.simulateJourney({
              targetUrl: job.targetUrl,
              journeyId: journey.id,
              scenario: sc,
              onStep: stepUpdate => {
                job.currentSteps = stepUpdate.steps || [];
                if (stepUpdate.currentAction) {
                  job.currentAction = stepUpdate.currentAction;
                }
              }
            });
          } else {
            // Live execution via TinyFish Agent API
            const goal = journey.buildGoal(job.targetUrl, sc);
            const targetScenarioUrl = new URL(job.targetUrl);
            targetScenarioUrl.searchParams.set('scenario', sc);

            runData = await tinyFishClient.visitAndAudit(targetScenarioUrl.href, {
              goal,
              outputSchema: journeyOutputSchema,
              onUpdate: update => {
                job.currentAction = `TinyFish run ${update.run_id}: ${update.status}`;
                if (update.steps) job.currentSteps = update.steps;
              }
            });
          }

          // Evaluate run against confirmed rules
          const observation = runData.result || runData;
          const evaluation = evaluateJourney({
            observation,
            journey,
            rules: job.rules,
            scenario: sc
          });

          evaluation.runId = runData.run_id || null;
          evaluation.steps = runData.steps || [];
          evaluation.mode = job.mode;

          job.findings.push(evaluation);
          job.runs.push({
            journeyId: journey.id,
            scenario: sc,
            runId: runData.run_id,
            status: runData.status,
            stepsCount: runData.steps?.length || 0,
            recordedAt: new Date().toISOString()
          });

          job.completedCount++;
          this._saveEvidence(job);
        }
      }

      job.status = 'COMPLETED';
      job.currentAction = 'Audit completed successfully.';
      job.completedAt = new Date().toISOString();
      this._saveEvidence(job);
    } catch (err) {
      job.status = 'FAILED';
      job.error = redact(err.message);
      job.currentAction = `Audit failed: ${job.error}`;
      job.completedAt = new Date().toISOString();
      this._saveEvidence(job);
    }
  }

  cancelActiveJob() {
    if (this.isBusy()) {
      this.activeJob.status = 'CANCELLED';
      this.activeJob.error = 'Audit was cancelled by user request.';
      this.activeJob.completedAt = new Date().toISOString();
      this._saveEvidence(this.activeJob);
      const cancelledId = this.activeJob.id;
      this.activeJob = null;
      return { cancelled: true, jobId: cancelledId };
    }
    return { cancelled: false };
  }

  /**
   * Retrieves list of all past audit runs
   */
  getHistoryList() {
    try {
      const files = fs.readdirSync(this.evidenceDir)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Newest first

      const records = [];
      for (const file of files) {
        const filePath = path.join(this.evidenceDir, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          records.push({
            fileName: file,
            id: content.id || file.replace(/\.json$/, ''),
            mode: content.mode || 'live',
            status: content.status || 'COMPLETED',
            targetUrl: content.targetUrl,
            scenario: content.scenario,
            startedAt: content.startedAt || content.requestedAt,
            completedAt: content.completedAt || content.verifiedAt,
            totalFindings: content.findings?.length || content.comparison?.length || 0,
            hasViolations: (content.findings || []).some(f => f.verdict === 'MISMATCH') ||
                           (content.comparison || []).some(c => c.compliant === false)
          });
        } catch {
          // Skip unparseable
        }
      }
      return records;
    } catch {
      return [];
    }
  }

  /**
   * Loads full details of a specific past run by ID or filename.
   * Path traversal protected!
   */
  getHistoryDetails(id) {
    if (!id || typeof id !== 'string') return null;
    const trimmed = id.trim();
    // Reject path traversal characters explicitly
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
      return null;
    }
    const cleanId = path.basename(trimmed);
    if (!cleanId || cleanId === '.' || cleanId === '..') return null;

    let targetFile = null;
    const files = fs.readdirSync(this.evidenceDir).filter(f => f.endsWith('.json'));

    for (const f of files) {
      if (f === cleanId || f === `${cleanId}.json`) {
        targetFile = f;
        break;
      }
      if (cleanId.length >= 5 && f.includes(cleanId)) {
        targetFile = f;
        break;
      }
    }

    if (!targetFile) return null;
    const filePath = path.join(this.evidenceDir, targetFile);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return null;
    }
  }
}

module.exports = JobRunner;
