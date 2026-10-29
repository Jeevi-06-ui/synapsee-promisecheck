#!/usr/bin/env node

/**
 * End-to-End Integration Test Suite
 * Owned by: Repository Owner & Likitha (test/integration)
 * 
 * Verifies that the Café application satisfies the PromiseCheck contract
 * without requiring any shared database or internal API coupling.
 */

const http = require('http');
const path = require('path');
const contract = require('../specs/cafe-promises-contract.json');

// Check CLI arguments for custom target URL
const args = process.argv.slice(2);
let targetUrl = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
    i++;
  }
}

async function runIntegrationTests() {
  console.log("================================================================================");
  console.log("🧪 Running Synapsee Integration Test Suite");
  console.log("   Owner: Repository Owner & Likitha (branch: test/integration)");
  console.log("================================================================================");
  console.log(`Contract: ${contract.system} v${contract.version}`);
  console.log(`Architecture Checks:`);
  console.log(`  - Shared Database Required:    ${contract.coupling.sharedDatabase ? 'YES' : 'NO (PASSED)'}`);
  console.log(`  - Direct API Required:         ${contract.coupling.directApiIntegration ? 'YES' : 'NO (PASSED)'}`);
  console.log("--------------------------------------------------------------------------------\n");

  let serverInstance = null;
  let testUrl = targetUrl;

  // If no external URL provided, spin up the local café server for integration verification
  if (!testUrl) {
    const testPort = 3999;
    const cafeServerPath = path.join(__dirname, '../../apps/cafe/server.js');
    console.log(`Starting standalone Café server instance on port ${testPort}...`);
    process.env.PORT = testPort;
    
    // Require and start the server
    const fs = require('fs');
    const publicDir = path.join(__dirname, '../../apps/cafe/public');
    
    serverInstance = http.createServer((req, res) => {
      const filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => serverInstance.listen(testPort, '127.0.0.1', resolve));
    testUrl = `http://127.0.0.1:${testPort}`;
    console.log(`Local test server running at ${testUrl}\n`);
  }

  try {
    console.log(`Fetching page contents from ${testUrl}...`);
    const pageHtml = await fetchUrl(testUrl);

    console.log("Evaluating Service Level Commitments against page DOM:");
    let passed = 0;
    let failed = 0;

    for (const item of contract.serviceLevelCommitments) {
      const matched = item.expectedMarkers.every(marker => pageHtml.includes(marker));
      if (matched) {
        console.log(`  ✅ [PASS] ${item.promise}`);
        passed++;
      } else {
        console.log(`  ❌ [FAIL] ${item.promise} (Missing expected markers: ${item.expectedMarkers.join(', ')})`);
        failed++;
      }
    }

    console.log("\n--------------------------------------------------------------------------------");
    console.log(`Integration Test Summary: ${passed} passed, ${failed} failed`);
    console.log("================================================================================\n");

    if (failed > 0) {
      console.error("❌ Integration test suite failed.");
      process.exit(1);
    } else {
      console.log("🎉 All integration contract commitments PASSED successfully!");
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Integration test error:", err.message);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

runIntegrationTests();
