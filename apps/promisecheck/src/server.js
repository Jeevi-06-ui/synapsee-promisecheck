/**
 * Local Web Server & Dashboard for PromiseCheck
 * 
 * Standard library HTTP server binding to 127.0.0.1 by default.
 * Provides same-origin REST APIs and an accessible Navy/Teal/White dashboard.
 */

const http = require('node:http');
const path = require('node:path');
const { getConfig, redact } = require('./config');
const { DEFAULT_OWNER_RULES } = require('./rules');
const { JOURNEYS } = require('./journeys');
const JobRunner = require('./job-runner');
const { buildRetestComparison } = require('./retest');

class PromiseCheckServer {
  constructor({ port, host, evidenceDir } = {}) {
    this.config = getConfig();
    this.port = port || this.config.port;
    this.host = host || this.config.host;
    this.runner = new JobRunner({ evidenceDir });
    this.confirmedRules = { ...DEFAULT_OWNER_RULES };
    this.server = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.on('error', reject);
      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host}:${this.port}`;
        console.log(`\n================================================================`);
        console.log(`🚀 PromiseCheck Local Dashboard running at: ${url}`);
        console.log(`   Owner: Jeevith P | Team: Synapsee | Presidency University`);
        console.log(`================================================================\n`);
        resolve({ port: this.port, host: this.host, url });
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    // CORS & Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-cache');

    try {
      // 1. Dashboard Homepage
      if (pathname === '/' && method === 'GET') {
        return this.sendHtml(res, this.renderDashboardHtml());
      }

      // 2. REST APIs
      if (pathname === '/api/config' && method === 'GET') {
        return this.sendJson(res, {
          cafePublicUrl: this.config.cafePublicUrl,
          hasApiKey: this.config.hasApiKey,
          apiKeyMasked: this.config.apiKeyMasked,
          nodeVersion: this.config.nodeVersion,
          port: this.port,
          host: this.host,
          team: this.config.team
        });
      }

      if (pathname === '/api/rules' && method === 'GET') {
        return this.sendJson(res, this.confirmedRules);
      }

      if (pathname === '/api/rules/confirm' && method === 'POST') {
        const body = await this.readJsonBody(req);
        this.confirmedRules = {
          ...this.confirmedRules,
          ...body,
          confirmedBy: body.confirmedBy || 'Jeevith P (Confirmed)',
          confirmedAt: new Date().toISOString()
        };
        return this.sendJson(res, { success: true, rules: this.confirmedRules });
      }

      if (pathname === '/api/journeys' && method === 'GET') {
        return this.sendJson(res, JOURNEYS.map(j => ({
          id: j.id,
          name: j.name,
          category: j.category,
          description: j.description,
          cart: j.cart,
          couponCode: j.couponCode,
          targetSubtotalPaise: j.targetSubtotalPaise
        })));
      }

      if (pathname === '/api/audit/start' && method === 'POST') {
        const body = await this.readJsonBody(req);
        try {
          const result = this.runner.startJob({
            targetUrl: body.targetUrl,
            mode: body.mode || 'simulated',
            scenario: body.scenario || 'both',
            journeyIds: body.journeyIds || [],
            rules: this.confirmedRules
          });
          return this.sendJson(res, result, 201);
        } catch (err) {
          if (err.code === 'JOB_ACTIVE') {
            return this.sendJson(res, { error: err.message }, 409);
          }
          return this.sendJson(res, { error: err.message }, 400);
        }
      }

      if (pathname === '/api/audit/status' && method === 'GET') {
        const status = this.runner.getActiveJobStatus();
        return this.sendJson(res, status);
      }

      if (pathname === '/api/audit/cancel' && method === 'POST') {
        const result = this.runner.cancelActiveJob();
        return this.sendJson(res, result);
      }

      if (pathname === '/api/history' && method === 'GET') {
        return this.sendJson(res, this.runner.getHistoryList());
      }

      // History detail: /api/history/:id
      const historyMatch = pathname.match(/^\/api\/history\/([^/]+)$/);
      if (historyMatch && method === 'GET') {
        const id = decodeURIComponent(historyMatch[1]);
        const record = this.runner.getHistoryDetails(id);
        if (!record) return this.sendJson(res, { error: 'Record not found' }, 404);
        return this.sendJson(res, record);
      }

      // History export: /api/history/:id/export
      const exportMatch = pathname.match(/^\/api\/history\/([^/]+)\/export$/);
      if (exportMatch && method === 'GET') {
        const id = decodeURIComponent(exportMatch[1]);
        const record = this.runner.getHistoryDetails(id);
        if (!record) return this.sendJson(res, { error: 'Record not found' }, 404);
        res.setHeader('Content-Disposition', `attachment; filename="promisecheck-${id}.json"`);
        return this.sendJson(res, record);
      }

      // History printable report: /api/history/:id/print
      const printMatch = pathname.match(/^\/api\/history\/([^/]+)\/print$/);
      if (printMatch && method === 'GET') {
        const id = decodeURIComponent(printMatch[1]);
        const record = this.runner.getHistoryDetails(id);
        if (!record) return this.sendJson(res, { error: 'Record not found' }, 404);
        return this.sendHtml(res, this.renderPrintableReportHtml(record));
      }

      // Retest comparison: /api/retest-comparison?id=...
      if (pathname === '/api/retest-comparison' && method === 'GET') {
        const id = parsedUrl.searchParams.get('id');
        let findings = [];
        if (id) {
          const record = this.runner.getHistoryDetails(id);
          findings = record?.findings || [];
        } else {
          findings = this.runner.activeJob?.findings || [];
        }
        const comparison = buildRetestComparison(findings);
        return this.sendJson(res, comparison);
      }

      // 404 Fallback
      return this.sendJson(res, { error: 'Not Found' }, 404);
    } catch (err) {
      console.error(`[server error] ${err.message}`);
      return this.sendJson(res, { error: redact(err.message) }, 500);
    }
  }

  sendJson(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(redact(JSON.stringify(data, null, 2)));
  }

  sendHtml(res, html, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1e6) { // 1MB limit
          req.destroy();
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          reject(new Error('Invalid JSON in request body'));
        }
      });
      req.on('error', reject);
    });
  }

  renderPrintableReportHtml(record) {
    const findings = record.findings || [];
    const isSimulated = record.mode === 'simulated';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PromiseCheck Verification Report — ${record.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #0f172a; margin: 40px auto; max-width: 900px; padding: 0 20px; }
    h1 { color: #0f172a; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-sim { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
    .badge-live { background: #dcfce7; color: #166534; border: 1px solid #22c55e; }
    .badge-pass { background: #dcfce7; color: #166534; }
    .badge-mismatch { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; }
    .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .team-meta { font-size: 13px; color: #475569; margin-top: 8px; }
    @media print { .no-print { display: none; } body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
  </div>
  <div class="header-box">
    <h1>🛡️ PromiseCheck Audit Report</h1>
    <div class="team-meta">
      <strong>Team Synapsee</strong> | Department of CSE, Presidency University, Bengaluru<br>
      Jeevith P (Team Leader) • Neha Ashok (Café Website) • Likitha R (QA & Validation)
    </div>
    <div style="margin-top: 12px;">
      <strong>Execution Mode:</strong> <span class="badge ${isSimulated ? 'badge-sim' : 'badge-live'}">${isSimulated ? 'SIMULATED — NOT A LIVE AUDIT' : 'LIVE TINYFISH EXECUTION'}</span><br>
      <strong>Target Café:</strong> ${record.targetUrl}<br>
      <strong>Audit ID:</strong> <code>${record.id}</code><br>
      <strong>Recorded At:</strong> ${record.startedAt || record.requestedAt}
    </div>
  </div>

  <h2>Audit Findings Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Scenario</th>
        <th>Journey</th>
        <th>Expected</th>
        <th>Observed</th>
        <th>Verdict</th>
        <th>Explanation</th>
      </tr>
    </thead>
    <tbody>
      ${findings.map(f => `
        <tr>
          <td><strong>${f.scenario}</strong></td>
          <td>${f.journeyName}</td>
          <td>${f.expected ? `Subtotal: Rs ${f.expected.subtotalRupees}<br>Delivery: Rs ${f.expected.deliveryRupees}<br>Total: Rs ${f.expected.totalRupees}` : 'N/A'}</td>
          <td>${f.observed ? `Subtotal: Rs ${f.observed.subtotal}<br>Delivery: Rs ${f.observed.delivery}<br>Total: Rs ${f.observed.total}` : 'N/A'}</td>
          <td><span class="badge ${f.verdict === 'PASS' ? 'badge-pass' : 'badge-mismatch'}">${f.verdict}</span></td>
          <td><small>${f.explanation}</small></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }

  renderDashboardHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PromiseCheck — Autonomous Commercial Verification</title>
  <style>
    :root {
      --navy-950: #0a0f1d;
      --navy-900: #0f172a;
      --navy-800: #1e293b;
      --navy-700: #334155;
      --teal-600: #0d9488;
      --teal-500: #14b8a6;
      --teal-400: #2dd4bf;
      --teal-50: #f0fdfa;
      --white: #ffffff;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-400: #94a3b8;
      --slate-600: #475569;
      --green-600: #16a34a;
      --green-50: #f0fdf4;
      --red-600: #dc2626;
      --red-50: #fef2f2;
      --amber-600: #d97706;
      --amber-50: #fffbeb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--slate-50);
      color: var(--navy-900);
      line-height: 1.5;
    }
    header {
      background: var(--navy-900);
      color: var(--white);
      border-bottom: 3px solid var(--teal-500);
      padding: 18px 24px;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      font-size: 28px;
      background: var(--navy-800);
      border: 1px solid var(--teal-500);
      border-radius: 8px;
      padding: 6px 10px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 12px;
      color: var(--teal-400);
    }
    .team-badge {
      font-size: 12px;
      background: var(--navy-800);
      border: 1px solid var(--navy-700);
      padding: 8px 14px;
      border-radius: 6px;
      text-align: right;
    }
    main {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .card {
      background: var(--white);
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      padding: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--slate-100);
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--navy-900);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-sim { background: var(--amber-50); color: var(--amber-600); border: 1px solid #fcd34d; }
    .badge-live { background: var(--teal-50); color: var(--teal-600); border: 1px solid var(--teal-400); }
    .badge-pass { background: var(--green-50); color: var(--green-600); border: 1px solid #86efac; }
    .badge-mismatch { background: var(--red-50); color: var(--red-600); border: 1px solid #fca5a5; }
    .badge-inconclusive { background: var(--slate-100); color: var(--slate-600); border: 1px solid var(--slate-200); }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--navy-800); }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      font-size: 14px;
      color: var(--navy-900);
      background: var(--white);
    }
    .form-control:focus { outline: none; border-color: var(--teal-500); ring: 2px var(--teal-50); }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary { background: var(--teal-600); color: var(--white); }
    .btn-primary:hover { background: var(--teal-500); }
    .btn-primary:disabled { background: var(--slate-400); cursor: not-allowed; }
    .btn-secondary { background: var(--navy-800); color: var(--white); }
    .btn-secondary:hover { background: var(--navy-700); }
    .btn-outline { background: var(--white); border: 1px solid var(--slate-200); color: var(--navy-800); }
    .btn-outline:hover { background: var(--slate-100); }

    .journey-selector {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 14px 0;
    }
    .journey-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      background: var(--slate-50);
      cursor: pointer;
    }
    .journey-item:hover { border-color: var(--teal-500); }
    .journey-item input[type="checkbox"] { margin-top: 3px; accent-color: var(--teal-600); }
    .journey-title { font-weight: 600; font-size: 14px; color: var(--navy-900); }
    .journey-desc { font-size: 12px; color: var(--slate-600); margin-top: 2px; }

    /* Progress Banner */
    .progress-box {
      background: var(--navy-950);
      color: var(--white);
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 20px;
      display: none;
    }
    .progress-bar-container {
      background: var(--navy-800);
      border-radius: 20px;
      height: 8px;
      overflow: hidden;
      margin: 12px 0 8px;
    }
    .progress-bar-fill {
      background: var(--teal-400);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    }
    .step-log {
      max-height: 140px;
      overflow-y: auto;
      font-family: ui-monospace, Menlo, Monaco, monospace;
      font-size: 12px;
      color: var(--slate-400);
      margin-top: 10px;
      padding: 8px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
    }
    .step-log-item { margin-bottom: 4px; }
    .step-log-item.active { color: var(--teal-400); }

    /* Findings Table */
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 12px 14px; text-align: left; font-size: 13px; border-bottom: 1px solid var(--slate-200); }
    th { background: var(--slate-100); color: var(--navy-800); font-weight: 600; }
    tr:hover { background: var(--slate-50); }

    .diff-pill {
      display: inline-block;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .diff-overcharge { background: var(--red-50); color: var(--red-600); }
    .diff-discount { background: var(--amber-50); color: var(--amber-600); }
    .diff-zero { background: var(--slate-100); color: var(--slate-600); }

    .evidence-drawer {
      margin-top: 8px;
      padding: 10px 14px;
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      font-size: 12px;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">🛡️</div>
        <div>
          <div class="brand-title">PromiseCheck</div>
          <div class="brand-subtitle">Autonomous Web Agent Verification Engine • Powered by TinyFish</div>
        </div>
      </div>
      <div class="team-badge">
        <strong>Team Synapsee</strong> | Presidency University, Bengaluru<br>
        Jeevith P (Lead) • Neha Ashok (Café) • Likitha R (QA)
      </div>
    </div>
  </header>

  <main>

    <!-- Top Status Bar & System Readiness -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">⚙️ System Readiness & Execution Mode</span>
        <span id="mode-badge" class="badge badge-sim">SIMULATED — NOT A LIVE AUDIT</span>
      </div>
      <div class="grid-2">
        <div>
          <div class="form-group">
            <label for="exec-mode">Select Execution Mode:</label>
            <select id="exec-mode" class="form-control" onchange="handleModeChange()">
              <option value="simulated">Simulated Mode (Fast, Offline Fixtures, No API Key needed)</option>
              <option value="live">Live Mode (Real TinyFish Cloud Browser Automation)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="target-url">Target Café Public URL:</label>
            <input type="text" id="target-url" class="form-control" value="https://synapsee-promisecheck.vercel.app/">
          </div>
        </div>
        <div>
          <div class="form-group">
            <label>API Key Status:</label>
            <div id="api-key-status" style="font-size: 14px; font-weight: 600; color: var(--navy-800); margin-top: 6px;">Checking...</div>
          </div>
          <div class="form-group">
            <label>Environment & Engine:</label>
            <div style="font-size: 13px; color: var(--slate-600);">
              Node.js: <code id="node-ver">...</code> | Dashboard Port: <code id="port-val">...</code><br>
              Zero shared DB • Black-box DOM observation • Pure integer paise math
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Audit Progress (Shown when running) -->
    <div id="progress-box" class="progress-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: var(--teal-400);" id="progress-status-text">Audit in Progress...</span>
        <button class="btn btn-outline" style="padding: 4px 10px; font-size: 12px; color: var(--white); border-color: var(--navy-700);" onclick="cancelAudit()">Cancel Audit</button>
      </div>
      <div class="progress-bar-container">
        <div id="progress-bar" class="progress-bar-fill"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--slate-400);">
        <span id="current-journey-label">Initializing...</span>
        <span id="progress-count-label">0/0 completed</span>
      </div>
      <div id="step-log" class="step-log"></div>
    </div>

    <!-- 1. Offer Review & Owner Confirmation -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📜 1. Offer Review & Owner Confirmation</span>
        <span class="badge" style="background: var(--teal-50); color: var(--teal-600);" id="confirmed-badge">Owner Confirmed</span>
      </div>
      <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 16px;">
        PromiseCheck requires the owner to explicitly review and confirm commercial rules before execution. The engine calculates deterministic expectations directly from these confirmed rules.
      </p>
      <div class="grid-2">
        <div>
          <div class="form-group">
            <label>Free Delivery Threshold (Paise):</label>
            <input type="number" id="rule-delivery-threshold" class="form-control" value="49900">
            <small style="color: var(--slate-400);">49900 paise = ₹499.00 (Inclusive: orders ≥ ₹499 earn free delivery)</small>
          </div>
          <div class="form-group">
            <label>Standard Delivery Fee (Paise):</label>
            <input type="number" id="rule-delivery-fee" class="form-control" value="4000">
            <small style="color: var(--slate-400);">4000 paise = ₹40.00 normal charge</small>
          </div>
        </div>
        <div>
          <div class="form-group">
            <label>Coupon Code & Maximum Cap (Paise):</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="rule-coupon-code" class="form-control" value="WELCOME20" style="width: 40%;">
              <input type="number" id="rule-coupon-cap" class="form-control" value="10000" style="width: 60%;">
            </div>
            <small style="color: var(--slate-400);">Code WELCOME20: 20% discount capped strictly at 10000 paise (₹100.00)</small>
          </div>
          <div class="form-group">
            <label>Minimum Order Checkout Policy:</label>
            <input type="text" id="rule-min-order" class="form-control" value="No minimum order amount. Any non-empty cart is allowed." readonly>
          </div>
        </div>
      </div>
      <button class="btn btn-outline" onclick="saveConfirmedRules()">💾 Confirm & Update Rules</button>
    </div>

    <!-- 2. Test Plan & Journey Selection -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">🧪 2. Select Test Journeys & Scenarios</span>
        <span style="font-size: 13px; color: var(--slate-600);">Planned Calls: <strong id="planned-calls-count">10</strong></span>
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <label>Select Scenario(s) to Audit:</label>
        <div style="display: flex; gap: 16px; margin-top: 6px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="scenario-choice" value="both" checked onchange="updatePlannedCount()"> Both (Buggy + Fixed Comparison)
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="scenario-choice" value="buggy" onchange="updatePlannedCount()"> Buggy Only (Detect Defects)
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="scenario-choice" value="fixed" onchange="updatePlannedCount()"> Fixed Only (Verify Compliance)
          </label>
        </div>
      </div>

      <div class="journey-selector" id="journey-list">
        <!-- Injected via JavaScript -->
      </div>

      <div style="display: flex; gap: 12px; margin-top: 16px;">
        <button id="start-audit-btn" class="btn btn-primary" onclick="startAudit()">🚀 Launch PromiseCheck Audit</button>
        <button class="btn btn-outline" onclick="selectAllJourneys(true)">Select All</button>
        <button class="btn btn-outline" onclick="selectAllJourneys(false)">Clear Selection</button>
      </div>
    </div>

    <!-- 3. Audit Findings & Results -->
    <div class="card" id="results-card">
      <div class="card-header">
        <span class="card-title">📋 3. Audit Findings & Commercial Discrepancies</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="exportCurrentReport()">📥 Export JSON</button>
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="printCurrentReport()">🖨️ Print Report</button>
        </div>
      </div>
      
      <div id="results-summary-banner" style="padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; background: var(--slate-100); font-weight: 600;">
        No active audit executed yet. Choose options above and click Launch.
      </div>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Journey</th>
              <th>Expected (Rules)</th>
              <th>Observed (Browser)</th>
              <th>Discrepancy</th>
              <th>Verdict</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="findings-table-body">
            <tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 24px;">No findings to display yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Before / After Retest Comparison -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">🔄 4. Before & After Retest Comparison (Buggy vs Fixed)</span>
        <button class="btn btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="refreshRetestComparison()">Refresh Retest View</button>
      </div>
      <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 12px;">
        Pairs identical customer carts across Buggy and Fixed scenarios with identical confirmed rules to verify defect resolution.
      </p>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Journey / Cart</th>
              <th>Buggy Scenario Observation</th>
              <th>Fixed Scenario Observation</th>
              <th>Resolution Status</th>
            </tr>
          </thead>
          <tbody id="retest-table-body">
            <tr><td colspan="4" style="text-align: center; color: var(--slate-400); padding: 20px;">Execute an audit covering both scenarios to see side-by-side comparison.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. Audit History & Saved Evidence -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📂 5. Saved Audit Evidence History</span>
        <button class="btn btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="loadHistory()">Refresh History</button>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Audit ID</th>
              <th>Mode</th>
              <th>Findings</th>
              <th>Outcome</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="history-table-body">
            <tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">Loading history...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <script>
    let journeys = [];
    let activePollInterval = null;
    let currentAuditId = null;

    async function init() {
      await loadConfig();
      await loadJourneys();
      await loadRules();
      await loadHistory();
      checkActiveJob();
    }

    async function loadConfig() {
      const res = await fetch('/api/config');
      const data = await res.json();
      document.getElementById('node-ver').textContent = data.nodeVersion;
      document.getElementById('port-val').textContent = data.port;
      document.getElementById('target-url').value = data.cafePublicUrl;
      const keyStatus = document.getElementById('api-key-status');
      if (data.hasApiKey) {
        keyStatus.innerHTML = '<span style="color: var(--green-600)">✓ Configured (' + data.apiKeyMasked + ')</span>';
      } else {
        keyStatus.innerHTML = '<span style="color: var(--amber-600)">⚠️ Not Configured (Live execution unavailable; use Simulated mode)</span>';
      }
    }

    async function loadJourneys() {
      const res = await fetch('/api/journeys');
      journeys = await res.json();
      const container = document.getElementById('journey-list');
      container.innerHTML = journeys.map(j => \`
        <label class="journey-item">
          <input type="checkbox" name="journey-select" value="\${j.id}" checked onchange="updatePlannedCount()">
          <div>
            <div class="journey-title">\${j.name}</div>
            <div class="journey-desc">\${j.description}</div>
          </div>
        </label>
      \`).join('');
      updatePlannedCount();
    }

    async function loadRules() {
      const res = await fetch('/api/rules');
      const rules = await res.json();
      document.getElementById('rule-delivery-threshold').value = rules.delivery.freeDeliveryThresholdPaise;
      document.getElementById('rule-delivery-fee').value = rules.delivery.standardFeePaise;
      document.getElementById('rule-coupon-code').value = rules.coupon.code;
      document.getElementById('rule-coupon-cap').value = rules.coupon.maxDiscountPaise;
    }

    async function saveConfirmedRules() {
      const payload = {
        delivery: {
          freeDeliveryThresholdPaise: Number(document.getElementById('rule-delivery-threshold').value),
          standardFeePaise: Number(document.getElementById('rule-delivery-fee').value),
          thresholdInclusive: true
        },
        coupon: {
          code: document.getElementById('rule-coupon-code').value.trim(),
          maxDiscountPaise: Number(document.getElementById('rule-coupon-cap').value),
          percentage: 20
        }
      };
      const res = await fetch('/api/rules/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert('✓ Owner rules confirmed and saved! Expectations will be calculated from these rules.');
    }

    function handleModeChange() {
      const mode = document.getElementById('exec-mode').value;
      const badge = document.getElementById('mode-badge');
      if (mode === 'live') {
        badge.className = 'badge badge-live';
        badge.textContent = 'LIVE TINYFISH AGENT EXECUTION';
      } else {
        badge.className = 'badge badge-sim';
        badge.textContent = 'SIMULATED — NOT A LIVE AUDIT';
      }
    }

    function selectAllJourneys(checked) {
      document.querySelectorAll('input[name="journey-select"]').forEach(cb => cb.checked = checked);
      updatePlannedCount();
    }

    function updatePlannedCount() {
      const selected = document.querySelectorAll('input[name="journey-select"]:checked').length;
      const scenarioChoice = document.querySelector('input[name="scenario-choice"]:checked').value;
      const multiplier = scenarioChoice === 'both' ? 2 : 1;
      document.getElementById('planned-calls-count').textContent = selected * multiplier;
    }

    async function startAudit() {
      const mode = document.getElementById('exec-mode').value;
      const targetUrl = document.getElementById('target-url').value;
      const scenarioChoice = document.querySelector('input[name="scenario-choice"]:checked').value;
      const selectedJourneys = Array.from(document.querySelectorAll('input[name="journey-select"]:checked')).map(cb => cb.value);

      if (selectedJourneys.length === 0) {
        alert('Please select at least one test journey.');
        return;
      }

      document.getElementById('start-audit-btn').disabled = true;
      document.getElementById('progress-box').style.display = 'block';

      try {
        const res = await fetch('/api/audit/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl,
            mode,
            scenario: scenarioChoice,
            journeyIds: selectedJourneys
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert('Error starting audit: ' + data.error);
          document.getElementById('start-audit-btn').disabled = false;
          return;
        }

        currentAuditId = data.jobId;
        pollProgress();
      } catch (err) {
        alert('Failed to connect to server: ' + err.message);
        document.getElementById('start-audit-btn').disabled = false;
      }
    }

    function pollProgress() {
      if (activePollInterval) clearInterval(activePollInterval);
      activePollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/audit/status');
          const data = await res.json();
          if (data.status === 'RUNNING' || data.status === 'PENDING') {
            updateProgressUi(data);
          } else if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
            clearInterval(activePollInterval);
            updateProgressUi(data);
            document.getElementById('start-audit-btn').disabled = false;
            renderFindings(data.findings || []);
            refreshRetestComparison();
            loadHistory();
          }
        } catch (err) {
          console.error(err);
        }
      }, 500);
    }

    function updateProgressUi(data) {
      document.getElementById('progress-box').style.display = 'block';
      document.getElementById('progress-status-text').textContent = \`Audit \${data.status}: \${data.currentAction || ''}\`;
      const pct = data.plannedCount > 0 ? Math.round((data.completedCount / data.plannedCount) * 100) : 0;
      document.getElementById('progress-bar').style.width = pct + '%';
      document.getElementById('progress-count-label').textContent = \`\${data.completedCount}/\${data.plannedCount} completed (\${pct}%)\`;
      document.getElementById('current-journey-label').textContent = data.currentJourneyId ? \`Executing: \${data.currentJourneyId}\` : 'Preparing...';

      if (data.steps && data.steps.length > 0) {
        const log = document.getElementById('step-log');
        log.innerHTML = data.steps.map(s => \`
          <div class="step-log-item \${s.status === 'RUNNING' ? 'active' : ''}">
            [\${s.timestamp ? s.timestamp.slice(11, 19) : ''}] \${s.action}
          </div>
        \`).join('');
        log.scrollTop = log.scrollHeight;
      }
    }

    async function checkActiveJob() {
      const res = await fetch('/api/audit/status');
      const data = await res.json();
      if (data.status === 'RUNNING') {
        document.getElementById('start-audit-btn').disabled = true;
        pollProgress();
      }
    }

    async function cancelAudit() {
      await fetch('/api/audit/cancel', { method: 'POST' });
      document.getElementById('start-audit-btn').disabled = false;
      document.getElementById('progress-status-text').textContent = 'Audit Cancelled';
    }

    function renderFindings(findings) {
      const banner = document.getElementById('results-summary-banner');
      const tbody = document.getElementById('findings-table-body');

      if (!findings || findings.length === 0) {
        banner.innerHTML = 'No findings recorded.';
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--slate-400); padding: 24px;">No findings to display.</td></tr>';
        return;
      }

      const mismatches = findings.filter(f => f.verdict === 'MISMATCH');
      const passes = findings.filter(f => f.verdict === 'PASS');

      if (mismatches.length > 0) {
        banner.style.background = 'var(--red-50)';
        banner.style.color = 'var(--red-600)';
        banner.innerHTML = \`⚠️ Detected \${mismatches.length} commercial discrepancies across \${findings.length} evaluated journeys. (Honored: \${passes.length}, Mismatched: \${mismatches.length})\`;
      } else {
        banner.style.background = 'var(--green-50)';
        banner.style.color = 'var(--green-600)';
        banner.innerHTML = \`🎉 All \${findings.length} evaluated journeys HONORED commercial commitments perfectly.\`;
      }

      tbody.innerHTML = findings.map((f, idx) => {
        const exp = f.expected;
        const obs = f.observed;
        const badgeClass = f.verdict === 'PASS' ? 'badge-pass' : (f.verdict === 'MISMATCH' ? 'badge-mismatch' : 'badge-inconclusive');

        let diffText = 'None';
        if (obs && exp) {
          if (obs.delivery !== exp.deliveryRupees) {
            const dDiff = obs.delivery - exp.deliveryRupees;
            diffText = \`<span class="diff-pill diff-overcharge">Delivery +₹\${dDiff}</span>\`;
          } else if (obs.discount !== exp.discountRupees) {
            const discDiff = obs.discount - exp.discountRupees;
            diffText = \`<span class="diff-pill diff-discount">Discount +₹\${discDiff} (Uncapped)</span>\`;
          } else if (obs.isCheckoutAllowed !== exp.isCheckoutAllowed) {
            diffText = \`<span class="diff-pill diff-overcharge">Checkout Blocked</span>\`;
          }
        }

        return \`
          <tr>
            <td><strong>\${f.scenario}</strong></td>
            <td><strong>\${f.journeyName}</strong><br><small style="color: var(--slate-600);">\${f.explanation}</small></td>
            <td>
              \${exp ? \`Sub: ₹\${exp.subtotalRupees} | Del: ₹\${exp.deliveryRupees} | Disc: ₹\${exp.discountRupees} | Total: ₹\${exp.totalRupees}\` : 'N/A'}
            </td>
            <td>
              \${obs ? \`Sub: ₹\${obs.subtotal} | Del: ₹\${obs.delivery} | Disc: ₹\${obs.discount} | Total: ₹\${obs.total}\` : 'N/A'}
            </td>
            <td>\${diffText}</td>
            <td><span class="badge \${badgeClass}">\${f.verdict}</span></td>
            <td>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="toggleEvidence(\${idx})">Evidence</button>
            </td>
          </tr>
          <tr id="evidence-row-\${idx}" style="display: none;">
            <td colspan="7">
              <div class="evidence-drawer">
                <strong>Run ID:</strong> <code>\${f.runId || 'N/A'}</code> | <strong>Mode:</strong> \${f.mode || 'simulated'}<br>
                <strong>Assertions Breakdown:</strong>
                <ul style="margin: 6px 0 0 16px;">
                  \${(f.assertions || []).map(a => \`<li><strong>\${a.name}</strong>: \${a.detail} (\${a.verdict})</li>\`).join('')}
                </ul>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function toggleEvidence(idx) {
      const row = document.getElementById('evidence-row-' + idx);
      row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
    }

    async function refreshRetestComparison() {
      const res = await fetch('/api/retest-comparison');
      const list = await res.json();
      const tbody = document.getElementById('retest-table-body');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--slate-400); padding: 20px;">No comparison data available yet.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(item => \`
        <tr>
          <td><strong>\${item.journeyName}</strong></td>
          <td>
            \${item.buggy ? \`
              <span class="badge \${item.buggy.verdict === 'PASS' ? 'badge-pass' : 'badge-mismatch'}">\${item.buggy.verdict}</span>
              <br><small>\${item.buggy.explanation}</small>
            \` : '<span style="color: var(--slate-400)">Not evaluated</span>'}
          </td>
          <td>
            \${item.fixed ? \`
              <span class="badge \${item.fixed.verdict === 'PASS' ? 'badge-pass' : 'badge-mismatch'}">\${item.fixed.verdict}</span>
              <br><small>\${item.fixed.explanation}</small>
            \` : '<span style="color: var(--slate-400)">Not evaluated</span>'}
          </td>
          <td>
            <strong>\${item.statusLabel}</strong>
          </td>
        </tr>
      \`).join('');
    }

    async function loadHistory() {
      const res = await fetch('/api/history');
      const records = await res.json();
      const tbody = document.getElementById('history-table-body');
      if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">No saved history records found.</td></tr>';
        return;
      }

      tbody.innerHTML = records.map(r => \`
        <tr>
          <td>\${r.startedAt ? r.startedAt.slice(0, 19).replace('T', ' ') : 'N/A'}</td>
          <td><code>\${r.id}</code></td>
          <td><span class="badge \${r.mode === 'live' ? 'badge-live' : 'badge-sim'}">\${r.mode.toUpperCase()}</span></td>
          <td>\${r.totalFindings} journeys</td>
          <td>
            \${r.hasViolations 
              ? '<span class="badge badge-mismatch">Discrepancies Detected</span>' 
              : '<span class="badge badge-pass">All Promises Honored</span>'}
          </td>
          <td>
            <a href="/api/history/\${encodeURIComponent(r.fileName)}/export" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">JSON</a>
            <a href="/api/history/\${encodeURIComponent(r.fileName)}/print" target="_blank" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">Print</a>
            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="loadPastRecord('\${encodeURIComponent(r.fileName)}')">View</button>
          </td>
        </tr>
      \`).join('');
    }

    async function loadPastRecord(fileName) {
      const res = await fetch('/api/history/' + fileName);
      const data = await res.json();
      renderFindings(data.findings || []);
      const banner = document.getElementById('results-summary-banner');
      banner.innerHTML = \`📂 Viewing Recorded Audit <code>\${data.id}</code> (\${data.mode.toUpperCase()}) recorded at \${data.startedAt || data.requestedAt}\`;
      document.getElementById('results-card').scrollIntoView({ behavior: 'smooth' });
    }

    function exportCurrentReport() {
      if (!currentAuditId) {
        alert('Please run an audit first to export.');
        return;
      }
      window.location.href = '/api/history/' + currentAuditId + '/export';
    }

    function printCurrentReport() {
      if (!currentAuditId) {
        window.print();
        return;
      }
      window.open('/api/history/' + currentAuditId + '/print', '_blank');
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>

</body>
</html>`;
  }
}

if (require.main === module) {
  const port = process.env.PORT || 4004;
  const server = new PromiseCheckServer({ port });
  server.start().catch(err => {
    console.error('Failed to start PromiseCheck server:', err.message);
    process.exit(1);
  });
}

module.exports = PromiseCheckServer;

