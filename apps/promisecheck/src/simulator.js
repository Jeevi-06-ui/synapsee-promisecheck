/**
 * Simulation Provider for PromiseCheck
 * 
 * Explicit fixture-based simulation mode.
 * Persistent Label: SIMULATED — NOT A LIVE AUDIT.
 * 
 * Works completely offline without TinyFish credentials or network access.
 * Emits incremental progress events mimicking TinyFish browser steps.
 */

const { setTimeout: delay } = require('node:timers/promises');
const { getJourneyById } = require('./journeys');

class SimulationProvider {
  constructor({ stepDelayMs = 250 } = {}) {
    this.stepDelayMs = stepDelayMs;
  }

  /**
   * Executes a simulated journey audit with realistic browser step progression.
   * 
   * @param {Object} options
   * @param {string} options.targetUrl
   * @param {string} options.journeyId
   * @param {string} options.scenario - 'buggy' or 'fixed'
   * @param {Function} [options.onStep] - Progress callback
   * @returns {Promise<Object>} Simulated TinyFish run result
   */
  async simulateJourney({ targetUrl, journeyId, scenario = 'buggy', onStep = () => {} }) {
    const journey = getJourneyById(journeyId);
    if (!journey) {
      throw new Error(`Unknown journey id: "${journeyId}"`);
    }

    const fixture = journey.validationFixtures[scenario];
    if (!fixture) {
      throw new Error(`No simulation fixture available for scenario "${scenario}" in journey "${journeyId}"`);
    }

    const runId = `sim-run-${scenario}-${journeyId}-${Date.now()}`;
    const baseTarget = new URL(targetUrl || 'https://synapsee-promisecheck.vercel.app/');
    baseTarget.searchParams.set('scenario', scenario);

    const steps = [
      {
        id: `sim-step-1-${runId}`,
        timestamp: new Date().toISOString(),
        status: 'RUNNING',
        action: `Navigate to ${baseTarget.href} (${scenario} mode)`,
        screenshot: 'simulated://screenshots/step-1-navigation.png',
        duration: '0.6s'
      },
      {
        id: `sim-step-2-${runId}`,
        timestamp: new Date().toISOString(),
        status: 'RUNNING',
        action: 'Inspect cart and ensure clean empty state',
        screenshot: 'simulated://screenshots/step-2-empty-cart.png',
        duration: '0.4s'
      },
      {
        id: `sim-step-3-${runId}`,
        timestamp: new Date().toISOString(),
        status: 'RUNNING',
        action: `Add requested items: ${journey.cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
        screenshot: 'simulated://screenshots/step-3-add-items.png',
        duration: '0.9s'
      }
    ];

    if (journey.couponCode) {
      steps.push({
        id: `sim-step-4-${runId}`,
        timestamp: new Date().toISOString(),
        status: 'RUNNING',
        action: `Enter coupon code "${journey.couponCode}" and click apply`,
        screenshot: 'simulated://screenshots/step-4-apply-coupon.png',
        duration: '0.7s'
      });
    }

    steps.push({
      id: `sim-step-5-${runId}`,
      timestamp: new Date().toISOString(),
      status: 'RUNNING',
      action: 'Read displayed order summary amounts (subtotal, delivery, discount, total)',
      screenshot: 'simulated://screenshots/step-5-order-summary.png',
      duration: '0.5s'
    });

    steps.push({
      id: `sim-step-6-${runId}`,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      action: 'Completed observation collection without placing order',
      screenshot: 'simulated://screenshots/step-6-final-cart.png',
      duration: '0.2s'
    });

    // Emit initial PENDING
    await onStep({
      run_id: runId,
      status: 'PENDING',
      steps: []
    });

    // Emit steps progressively
    for (let i = 0; i < steps.length - 1; i++) {
      if (this.stepDelayMs > 0) await delay(this.stepDelayMs);
      await onStep({
        run_id: runId,
        status: 'RUNNING',
        steps: steps.slice(0, i + 1),
        currentAction: steps[i].action
      });
    }

    if (this.stepDelayMs > 0) await delay(this.stepDelayMs);

    const observation = {
      scenario,
      url: baseTarget.href,
      journeyId,
      cartCleared: true,
      emptyCartText: 'Your cart is empty. Please add items to proceed.',
      items: journey.cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceRupees
      })),
      subtotal: fixture.subtotal,
      delivery: fixture.delivery,
      discount: fixture.discount,
      total: fixture.total,
      subtotalText: fixture.subtotalText,
      deliveryText: fixture.deliveryText,
      discountText: fixture.discountText,
      totalText: fixture.totalText,
      couponApplied: fixture.couponApplied,
      couponCode: fixture.couponApplied ? journey.couponCode : null,
      couponErrorText: null,
      isCheckoutAllowed: fixture.isCheckoutAllowed,
      checkoutBlockedReason: fixture.checkoutBlockedReason,
      advertisedRuleText: 'Enjoy FREE delivery on food orders ₹499+ (normally ₹40)',
      actions: steps.map(s => s.action),
      error: null
    };

    const finalRun = {
      run_id: runId,
      status: 'COMPLETED',
      mode: 'simulated',
      simulationNotice: 'SIMULATED — NOT A LIVE AUDIT',
      num_of_steps: steps.length,
      steps,
      result: observation
    };

    await onStep(finalRun);
    return finalRun;
  }
}

module.exports = SimulationProvider;

