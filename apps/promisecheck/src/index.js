#!/usr/bin/env node

/**
 * PromiseCheck Runner
 * Audits public web applications using TinyFish web agents.
 * 
 * Usage:
 *   node src/index.js --url https://<your-public-cafe-url>
 */

const TinyFishClient = require('./tinyfish-client');
const promises = require('./promises.json');

// Parse CLI arguments
const args = process.argv.slice(2);
let targetUrl = process.env.CAFE_PUBLIC_URL;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
    i++;
  }
}

if (!targetUrl) {
  // Check default local or tunnel URL
  targetUrl = 'http://localhost:3000';
  console.log(`ℹ️  No --url provided. Defaulting to local dev server: ${targetUrl}`);
  console.log(`💡 Tip: Pass your public tunnel URL: npm run check -- --url https://<your-tunnel>.loca.lt\n`);
}

async function runAudit() {
  console.log("================================================================================");
  console.log("🔍 PromiseCheck Verification Engine (TinyFish Autonomous Agent)");
  console.log("================================================================================");
  console.log(`Target Café URL: ${targetUrl}`);
  console.log(`Timestamp:       ${new Date().toISOString()}`);
  console.log("--------------------------------------------------------------------------------\n");

  const client = new TinyFishClient();

  try {
    const pageData = await client.visitAndAudit(targetUrl);

    if (pageData.statusCode !== 200) {
      console.error(`❌ HTTP Error: Received status ${pageData.statusCode} from ${targetUrl}`);
      process.exit(1);
    }

    console.log(`✅ Page reached successfully (HTTP ${pageData.statusCode}). Auditing claims...\n`);

    const results = [];
    const pageText = pageData.text || '';

    for (const promise of promises) {
      const matches = [];
      for (const keyword of promise.expectedKeywords) {
        const regex = new RegExp(keyword, 'i');
        if (regex.test(pageText)) {
          matches.push(keyword);
        }
      }

      const passed = matches.length > 0;
      results.push({
        ...promise,
        passed,
        matches,
        coverage: `${matches.length}/${promise.expectedKeywords.length}`
      });
    }

    // Output formatted results table
    console.log("📋 AUDIT RESULTS:");
    console.log("--------------------------------------------------------------------------------");
    let passedCount = 0;

    for (const res of results) {
      const statusIcon = res.passed ? '✅ PASSED' : '❌ FAILED';
      if (res.passed) passedCount++;

      console.log(`${statusIcon.padEnd(10)} [${res.category}] ${res.title}`);
      if (res.passed) {
        console.log(`           Matched keywords: "${res.matches.join('", "')}"`);
      } else {
        console.log(`           Missing expected: "${res.expectedKeywords.join('", "')}"`);
      }
    }

    console.log("--------------------------------------------------------------------------------");
    const score = Math.round((passedCount / results.length) * 100);
    console.log(`Overall Compliance Score: ${score}% (${passedCount}/${results.length} promises verified)`);
    console.log("================================================================================\n");

    const failedRequired = results.filter(r => r.required && !r.passed);
    if (failedRequired.length > 0) {
      console.error(`❌ Audit FAILED: ${failedRequired.length} required promises were not verified.`);
      process.exit(1);
    } else {
      console.log("🎉 Audit SUCCESSFUL: All core café promises verified by PromiseCheck.");
      process.exit(0);
    }

  } catch (error) {
    console.error(`❌ PromiseCheck encountered an error:`, error.message);
    process.exit(1);
  }
}

runAudit();

