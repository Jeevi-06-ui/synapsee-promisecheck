#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const TinyFishClient = require('./tinyfish-client');
const { outputSchema, buildGoal, evaluateRun } = require('./delivery-audit');
const PromiseCheckServer = require('./server');
const SimulationProvider = require('./simulator');
const { JOURNEYS, getJourneyById } = require('./journeys');
const { evaluateJourney } = require('./evaluator');
const { DEFAULT_OWNER_RULES } = require('./rules');

const appDir = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(appDir, '.env')) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.join(appDir, '.env')); } catch {}
}

function parseArgs(args) {
  const options = {
    url: process.env.CAFE_PUBLIC_URL || 'https://synapsee-promisecheck.vercel.app/',
    evidence: path.join(appDir, 'evidence', `audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
    mode: 'live',
    suite: 'delivery',
    serve: false,
    port: Number(process.env.PORT) || 4004
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--serve' || arg === 'serve' || arg === '--dashboard') {
      options.serve = true;
      continue;
    }
    if (['--url', '--evidence', '--run-id', '--mode', '--suite', '--port'].includes(arg)) {
      if (!args[i + 1] || args[i + 1].startsWith('--')) {
        throw new Error(`Argument ${arg} requires a value.`);
      }
      const val = args[++i];
      if (arg === '--run-id') options.runId = val;
      else if (arg === '--port') options.port = Number(val);
      else options[arg.slice(2)] = val;
    } else {
      throw new Error(`Unknown or invalid argument: "${arg}". Usage: npm run check -- [--url PUBLIC_URL] [--evidence FILE.json] [--run-id ID] [--mode live|simulated] [--suite delivery|coupon|minorder|all] [--serve]`);
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  // If --serve was requested, launch local dashboard
  if (options.serve) {
    const server = new PromiseCheckServer({ port: options.port });
    await server.start();
    return new Promise(() => {}); // Keep alive
  }

  // If suite is standard delivery audit, preserve exact legacy delivery audit behavior
  if (options.suite === 'delivery' && options.mode === 'live') {
    return runStandardDeliveryAudit(options);
  }

  // Otherwise, run generalized multi-journey audit CLI
  return runSuiteCli(options);
}

async function runStandardDeliveryAudit(options) {
  const client = new TinyFishClient();
  const target = new URL(client.validateUrlReachability(options.url));
  target.searchParams.set('scenario', 'buggy');
  const evidencePath = path.resolve(options.evidence);
  if (fs.existsSync(evidencePath)) throw new Error('Evidence file already exists; choose a new --evidence path to preserve it.');
  const evidence = {
    source: 'TinyFish Agent API — real browser interaction',
    target: target.href,
    requestedAt: new Date().toISOString(),
    request: { goal: buildGoal(target.href), output_schema: outputSchema }
  };
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

async function runSuiteCli(options) {
  console.log(`================================================================`);
  console.log(`🛡️ PromiseCheck CLI — Suite: ${options.suite.toUpperCase()} (${options.mode.toUpperCase()})`);
  console.log(`Target: ${options.url}`);
  console.log(`================================================================\n`);

  let targetJourneys = [];
  if (options.suite === 'delivery') {
    targetJourneys = [getJourneyById('delivery-498'), getJourneyById('delivery-499'), getJourneyById('delivery-500')];
  } else if (options.suite === 'coupon') {
    targetJourneys = [getJourneyById('coupon-cap-600')];
  } else if (options.suite === 'minorder') {
    targetJourneys = [getJourneyById('min-order-99')];
  } else {
    targetJourneys = [...JOURNEYS];
  }

  const simulator = new SimulationProvider({ stepDelayMs: 50 });
  const tinyFishClient = options.mode === 'live' ? new TinyFishClient() : null;
  const evidencePath = path.resolve(options.evidence);
  if (fs.existsSync(evidencePath)) throw new Error('Evidence file already exists; choose a new --evidence path to preserve it.');

  const results = [];
  const scenarios = ['buggy', 'fixed'];

  try {
    for (const sc of scenarios) {
      for (const journey of targetJourneys) {
        console.log(`Evaluating [${sc}] ${journey.name}...`);
        let runData = null;

        if (options.mode === 'simulated') {
          runData = await simulator.simulateJourney({
            targetUrl: options.url,
            journeyId: journey.id,
            scenario: sc
          });
        } else {
          const goal = journey.buildGoal(options.url, sc);
          const scUrl = new URL(options.url);
          scUrl.searchParams.set('scenario', sc);
          runData = await tinyFishClient.visitAndAudit(scUrl.href, { goal });
        }

        const observation = runData.result || runData;
        const evaluated = evaluateJourney({
          observation,
          journey,
          rules: DEFAULT_OWNER_RULES,
          scenario: sc
        });
        results.push(evaluated);
      }
    }

    console.table(results.map(r => ({
      scenario: r.scenario,
      journey: r.journeyName,
      verdict: r.verdict,
      explanation: r.explanation.slice(0, 70)
    })));

    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, JSON.stringify({
      mode: options.mode,
      targetUrl: options.url,
      suite: options.suite,
      verifiedAt: new Date().toISOString(),
      findings: results
    }, null, 2), { mode: 0o600 });
    console.log(`Run evidence saved: ${evidencePath}\n`);

    const hasViolations = results.some(r => r.verdict === 'MISMATCH');
    return hasViolations ? 1 : 0;
  } catch (err) {
    console.error(`Audit incomplete: ${err.message}`);
    return 2;
  }
}

if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(`PromiseCheck: ${error.message}`);
  process.exitCode = 2;
});

module.exports = { main, parseArgs };
