const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');

const JobRunner = require('../src/job-runner');
const PromiseCheckServer = require('../src/server');
const { buildRetestComparison } = require('../src/retest');
const { DEFAULT_OWNER_RULES } = require('../src/rules');

describe('JobRunner & Local Persistence', () => {
  let tempEvidenceDir;

  before(() => {
    tempEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promisecheck-test-'));
  });

  after(() => {
    try {
      fs.rmSync(tempEvidenceDir, { recursive: true, force: true });
    } catch {}
  });

  test('duplicate submissions are rejected when an audit is active', () => {
    const runner = new JobRunner({ evidenceDir: tempEvidenceDir });
    // Simulate active job
    runner.activeJob = { id: 'active-job-1', status: 'RUNNING' };
    assert.equal(runner.isBusy(), true);

    assert.throws(() => {
      runner.startJob({ mode: 'simulated' });
    }, /already currently running/);
  });

  test('no live-to-simulation fallback: missing key in live mode fails explicitly', () => {
    const runner = new JobRunner({ evidenceDir: tempEvidenceDir });
    // Overwrite config key to empty
    runner.config.hasApiKey = false;
    assert.throws(() => {
      runner.startJob({ mode: 'live', targetUrl: 'https://synapsee-promisecheck.vercel.app' });
    }, /TINYFISH_API_KEY is required for live execution/);
  });

  test('simulated runs are explicitly labelled SIMULATED — NOT A LIVE AUDIT', async () => {
    const runner = new JobRunner({ evidenceDir: tempEvidenceDir });
    const jobInfo = runner.startJob({
      mode: 'simulated',
      journeyIds: ['delivery-498'],
      scenario: 'buggy'
    });
    assert.equal(jobInfo.mode, 'simulated');

    // Wait for execution to finish
    await new Promise(resolve => {
      const interval = setInterval(() => {
        const status = runner.getActiveJobStatus();
        if (['COMPLETED', 'FAILED'].includes(status.status)) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    const details = runner.getHistoryDetails(jobInfo.jobId);
    assert.ok(details);
    assert.equal(details.mode, 'simulated');
    assert.equal(details.simulationNotice, 'SIMULATED — NOT A LIVE AUDIT');
  });

  test('interrupted jobs are reconciled and marked on startup', () => {
    // Write an artificial RUNNING job file to tempEvidenceDir
    const fakeRunningFile = path.join(tempEvidenceDir, 'audit-fake-interrupted.json');
    fs.writeFileSync(fakeRunningFile, JSON.stringify({
      id: 'interrupted-run-123',
      status: 'RUNNING',
      mode: 'simulated'
    }, null, 2));

    // Creating new JobRunner instance runs reconciliation
    const newRunner = new JobRunner({ evidenceDir: tempEvidenceDir });
    const content = JSON.parse(fs.readFileSync(fakeRunningFile, 'utf8'));
    assert.equal(content.status, 'INTERRUPTED');
    assert.match(content.error, /interrupted by server restart/);
  });

  test('evidence-file access protects against path traversal', () => {
    const runner = new JobRunner({ evidenceDir: tempEvidenceDir });
    assert.equal(runner.getHistoryDetails('../../../etc/passwd'), null);
    assert.equal(runner.getHistoryDetails('..'), null);
    assert.equal(runner.getHistoryDetails('/'), null);
  });

  test('before/after retest comparison pairs identical journeys across scenarios', () => {
    const sampleFindings = [
      {
        journeyId: 'delivery-499',
        journeyName: 'Journey B (Rs 499)',
        scenario: 'buggy',
        verdict: 'MISMATCH',
        explanation: 'Delivery fee Rs 40 instead of Rs 0'
      },
      {
        journeyId: 'delivery-499',
        journeyName: 'Journey B (Rs 499)',
        scenario: 'fixed',
        verdict: 'PASS',
        explanation: 'All commercial commitments honored'
      }
    ];

    const comparison = buildRetestComparison(sampleFindings);
    assert.equal(comparison.length, 1);
    assert.equal(comparison[0].journeyId, 'delivery-499');
    assert.equal(comparison[0].hasBoth, true);
    assert.equal(comparison[0].resolved, true);
    assert.equal(comparison[0].statusLabel, 'CORRECTED IN FIXED SCENARIO');
  });
});

describe('PromiseCheckServer Endpoints', () => {
  let server;
  let baseUrl;
  let testEvidenceDir;

  before(async () => {
    testEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promisecheck-server-test-'));
    // Pick random high port to avoid collisions
    const port = 49100 + Math.floor(Math.random() * 500);
    server = new PromiseCheckServer({ port, host: '127.0.0.1', evidenceDir: testEvidenceDir });
    const info = await server.start();
    baseUrl = info.url;
  });

  after(async () => {
    await server.stop();
    try {
      fs.rmSync(testEvidenceDir, { recursive: true, force: true });
    } catch {}
  });

  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });
  }

  function post(urlPath, payload) {
    return new Promise((resolve, reject) => {
      const bodyStr = JSON.stringify(payload);
      const req = http.request(`${baseUrl}${urlPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });
  }

  test('GET / serves accessible dashboard HTML', async () => {
    const res = await get('/');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /PromiseCheck/);
    assert.match(res.body, /Team Synapsee/);
    assert.match(res.body, /Jeevith P/);
    assert.match(res.body, /Neha Ashok/);
    assert.match(res.body, /Likitha R/);
  });

  test('GET /api/config returns system info without leaking credentials', async () => {
    const res = await get('/api/config');
    assert.equal(res.status, 200);
    const json = JSON.parse(res.body);
    assert.ok(json.nodeVersion);
    assert.equal(typeof json.hasApiKey, 'boolean');
    if (process.env.TINYFISH_API_KEY) {
      assert.ok(!res.body.includes(process.env.TINYFISH_API_KEY)); // Full secret key never leaked
    }
    assert.equal(json.team.teamName, 'Synapsee');
  });

  test('GET /api/journeys returns all 5 test journeys', async () => {
    const res = await get('/api/journeys');
    assert.equal(res.status, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.length, 5);
    const ids = json.map(j => j.id);
    assert.ok(ids.includes('delivery-498'));
    assert.ok(ids.includes('delivery-499'));
    assert.ok(ids.includes('delivery-500'));
    assert.ok(ids.includes('coupon-cap-600'));
    assert.ok(ids.includes('min-order-99'));
  });

  test('POST /api/rules/confirm updates and persists confirmed rules', async () => {
    const update = {
      delivery: {
        freeDeliveryThresholdPaise: 49900,
        standardFeePaise: 4000,
        thresholdInclusive: true
      },
      confirmedBy: 'Jeevith P (Automated Test)'
    };
    const res = await post('/api/rules/confirm', update);
    assert.equal(res.status, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.equal(json.rules.confirmedBy, 'Jeevith P (Automated Test)');
  });

  test('POST /api/audit/start initiates simulated audit and provides progress status', async () => {
    const res = await post('/api/audit/start', {
      mode: 'simulated',
      journeyIds: ['delivery-499'],
      scenario: 'buggy'
    });
    assert.equal(res.status, 201);
    const json = JSON.parse(res.body);
    assert.ok(json.jobId);
    assert.equal(json.mode, 'simulated');

    // Poll status until done
    let finished = false;
    for (let i = 0; i < 40; i++) {
      const statusRes = await get('/api/audit/status');
      const statusJson = JSON.parse(statusRes.body);
      if (statusJson.status === 'COMPLETED') {
        finished = true;
        assert.equal(statusJson.findings.length, 1);
        assert.equal(statusJson.findings[0].verdict, 'MISMATCH');
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    assert.ok(finished, 'Job should complete within timeout');
  });

  test('GET /api/history returns recorded audit runs and printable report', async () => {
    const listRes = await get('/api/history');
    assert.equal(listRes.status, 200);
    const records = JSON.parse(listRes.body);
    assert.ok(records.length > 0);

    const first = records[0];
    const printRes = await get(`/api/history/${encodeURIComponent(first.fileName)}/print`);
    assert.equal(printRes.status, 200);
    assert.match(printRes.body, /PromiseCheck Audit Report/);
    assert.match(printRes.body, /SIMULATED/);
  });
});
