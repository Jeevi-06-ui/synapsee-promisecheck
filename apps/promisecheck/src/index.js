#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const TinyFishClient = require('./tinyfish-client');
const { outputSchema, buildGoal, evaluateRun } = require('./delivery-audit');

const appDir = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(appDir, '.env'))) process.loadEnvFile(path.join(appDir, '.env'));

function parseArgs(args) {
  const options = { url: process.env.CAFE_PUBLIC_URL || 'https://synapsee-promisecheck.vercel.app/',
    evidence: path.join(appDir, 'evidence', `delivery-${new Date().toISOString().replace(/[:.]/g, '-')}.json`) };
  for (let i = 0; i < args.length; i++) {
    if (!['--url', '--evidence', '--run-id'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Usage: npm run check -- [--url PUBLIC_URL] [--evidence FILE.json] [--run-id ID]');
    }
    options[args[i] === '--run-id' ? 'runId' : args[i].slice(2)] = args[++i];
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const client = new TinyFishClient();
  const target = new URL(client.validateUrlReachability(options.url));
  target.searchParams.set('scenario', 'buggy');
  const evidencePath = path.resolve(options.evidence);
  if (fs.existsSync(evidencePath)) throw new Error('Evidence file already exists; choose a new --evidence path to preserve it.');
  const evidence = { source: 'TinyFish Agent API — real browser interaction', target: target.href,
    requestedAt: new Date().toISOString(), request: { goal: buildGoal(target.href), output_schema: outputSchema } };
  const save = () => {
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, client.redact(JSON.stringify(evidence, null, 2)), { mode: 0o600 });
  };
  let lastStatus;
  try {
    const run = await client.visitAndAudit(target.href, {
      goal: evidence.request.goal, outputSchema, runId: options.runId,
      onUpdate: current => {
        evidence.run = current;
        save();
        if (current.status !== lastStatus) {
          console.log(`TinyFish ${current.run_id}: ${current.status}`);
          lastStatus = current.status;
        }
      }
    });
    evidence.comparison = evaluateRun(run, target.href);
    evidence.verifiedAt = new Date().toISOString();
    save();
    console.table(evidence.comparison.map(row => ({
      scenario: row.scenario,
      'expected subtotal': row.expected.subtotal, 'observed subtotal': row.observed.subtotal,
      'expected delivery': row.expected.delivery, 'observed delivery': row.observed.delivery,
      'expected total': row.expected.total, 'observed total': row.observed.total,
      promise: row.compliant ? 'HONORED' : 'VIOLATED'
    })));
    console.log(`Amounts in INR. Run evidence: ${evidencePath}`);
    console.log(`TinyFish steps: ${run.num_of_steps ?? run.steps?.length}`);
    return evidence.comparison.every(row => row.compliant) ? 0 : 1;
  } catch (error) {
    evidence.error = client.redact(error.message);
    save();
    console.error(`Audit incomplete: ${evidence.error}\nEvidence: ${evidencePath}`);
    return 2;
  }
}

if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(`PromiseCheck: ${error.message}`);
  process.exitCode = 2;
});
module.exports = { main, parseArgs };
