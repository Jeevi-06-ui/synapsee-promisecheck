const { test } = require('node:test');
const assert = require('node:assert/strict');
const TinyFishClient = require('../src/tinyfish-client');
const { evaluateRun, buildGoal, outputSchema } = require('../src/delivery-audit');
const target = 'https://example.com/';

// Synthetic data is used ONLY for offline unit tests, never as live observations.
function sampleRun() {
  return {
    run_id: 'offline-unit-test', status: 'COMPLETED',
    steps: [{ action: 'offline fixture', screenshot: 'https://example.com/test.jpg' }],
    result: { scenarios: ['buggy', 'fixed'].map(scenario => ({
      scenario, url: `${target}?scenario=${scenario}`,
      advertisedRuleText: 'Free delivery on orders Rs 499 and above',
      freeDeliveryThreshold: 499, thresholdInclusive: true,
      cartCleared: true, emptyCartText: 'Your cart is empty',
      items: [{ name: 'Margherita Pizza', quantity: 2, unitPrice: 249 }, { name: 'Extra Dip', quantity: 1, unitPrice: 1 }],
      subtotal: 499, delivery: scenario === 'buggy' ? 40 : 0, total: scenario === 'buggy' ? 539 : 499,
      subtotalText: 'Subtotal: Rs 499', deliveryText: scenario === 'buggy' ? 'Delivery: Rs 40' : 'Delivery: Free',
      totalText: scenario === 'buggy' ? 'Total: Rs 539' : 'Total: Rs 499',
      actions: ['Verified empty cart', 'Added requested products', 'Read summary'], error: null
    })) }
  };
}

test('missing credentials fail before any network access; no HTML fallback', async () => {
  let called = false;
  const client = new TinyFishClient({ apiKey: '', fetchImpl: () => { called = true; } });
  await assert.rejects(client.visitAndAudit(target, { goal: 'test' }), /TINYFISH_API_KEY is required/);
  assert.equal(called, false);
});

test('public URL validation rejects local addresses, credentials, and non-HTTP URLs', () => {
  const client = new TinyFishClient({ apiKey: '' });
  for (const url of ['http://localhost', 'http://127.0.0.2', 'http://[::1]', 'http://192.168.1.1', 'file:///tmp/test', 'https://user:pass@example.com']) {
    assert.throws(() => client.validateUrlReachability(url));
  }
  assert.equal(client.validateUrlReachability(target), target);
});

test('documented API, auth header and result polling are used; only one run is created', async () => {
  const calls = [];
  const updates = [];
  const responses = [ { run_id: 'test-run', error: null }, { run_id: 'test-run', status: 'RUNNING' },
    { ...sampleRun(), run_id: 'test-run' } ];
  const client = new TinyFishClient({ apiKey: 'unit-test-secret', pollIntervalMs: 0,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => responses.shift() };
    }
  });
  const run = await client.visitAndAudit(target, { goal: buildGoal(target), outputSchema, onUpdate: value => updates.push(value) });
  assert.equal(run.status, 'COMPLETED');
  assert.equal(calls[0].url, 'https://agent.tinyfish.ai/v1/automation/run-async');
  assert.equal(calls[0].options.headers['X-API-Key'], 'unit-test-secret');
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(JSON.parse(calls[0].options.body).capture_config.screenshots, true);
  assert.equal(calls.filter(call => call.options.method === 'POST').length, 1);
  assert.equal(calls[1].url, 'https://agent.tinyfish.ai/v1/runs/test-run?screenshots=url');
  assert.equal(updates.length, 3);
});

test('resuming a run never creates another automation', async () => {
  const client = new TinyFishClient({ apiKey: 'unit-test-secret', fetchImpl: async (url, options) => {
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => sampleRun() };
  } });
  await client.visitAndAudit(target, { runId: 'offline-unit-test' });
});

test('HTTP failures are explicit and redact credentials', async () => {
  const client = new TinyFishClient({ apiKey: 'unit-test-secret', fetchImpl: async () => ({
    ok: false, status: 401, json: async () => ({ error: { message: 'Invalid unit-test-secret' } })
  }) });
  await assert.rejects(client.request('/v1/runs/test'), error => {
    assert.match(error.message, /HTTP 401/);
    assert.ok(!error.message.includes('unit-test-secret'));
    return true;
  });
});

test('ambiguous start failure is not retried', async () => {
  let calls = 0;
  const client = new TinyFishClient({ apiKey: 'unit-test-secret', fetchImpl: async () => { calls++; throw new Error('network'); } });
  await assert.rejects(client.visitAndAudit(target, { goal: 'test' }), /Do not start a duplicate/);
  assert.equal(calls, 1);
});

test('inclusive threshold computes expectations independently of scenario name', () => {
  const rows = evaluateRun(sampleRun(), target);
  assert.deepEqual(rows.map(row => row.expected), [
    { subtotal: 499, delivery: 0, total: 499 }, { subtotal: 499, delivery: 0, total: 499 }
  ]);
  assert.deepEqual(rows.map(row => row.compliant), [false, true]);
  const changed = sampleRun();
  Object.assign(changed.result.scenarios[1], { delivery: 17, deliveryText: 'Rs 17', total: 516, totalText: 'Rs 516' });
  assert.equal(evaluateRun(changed, target)[1].compliant, false);
});

test('incomplete, fabricated text, wrong cart, or missing clean-cart evidence is rejected', () => {
  const mutations = [
    run => { run.result = null; },
    run => { run.status = 'RUNNING'; },
    run => { run.steps = []; },
    run => { run.result.scenarios[0].subtotal = null; },
    run => { Object.assign(run.result.scenarios[1], { subtotal: 748, subtotalText: 'Rs 748', total: 748, totalText: 'Rs 748' }); },
    run => { run.result.scenarios[0].deliveryText = 'Rs 0'; },
    run => { run.result.scenarios[0].cartCleared = false; },
    run => { run.result.scenarios[0].items[0].quantity = 1; },
    run => { run.result.scenarios[0].thresholdInclusive = false; },
    run => { run.result.scenarios[0].url = 'https://other.example/?scenario=buggy'; }
  ];
  for (const mutate of mutations) {
    const run = sampleRun(); mutate(run);
    assert.throws(() => evaluateRun(run, target));
  }
});
