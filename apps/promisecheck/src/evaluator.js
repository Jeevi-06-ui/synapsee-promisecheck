/**
 * Evaluator & Verdict Engine
 * 
 * Compares observed customer-journey browser data against
 * deterministic expectations computed from owner-confirmed rules.
 */

const { calculateExpected, moneyFromText, formatRupees, formatPaise } = require('./rules');

/**
 * Validates a single journey observation.
 * Throws explicit errors if required evidence is missing or corrupted.
 */
function validateObservationEvidence(obs, journey) {
  if (!obs || typeof obs !== 'object') {
    return { valid: false, reason: 'Observation is empty or not an object.' };
  }

  if (obs.error) {
    return { valid: false, reason: `Browser agent reported error: ${obs.error}` };
  }

  if (obs.cartCleared !== true) {
    return { valid: false, reason: 'Cart was not confirmed cleared before assembling the test cart.' };
  }

  // Check items in cart
  if (!Array.isArray(obs.items) || obs.items.length === 0) {
    return { valid: false, reason: 'No items reported in observed cart.' };
  }

  for (const expectedItem of journey.cart) {
    const matched = obs.items.find(i => 
      i.name && i.name.toLowerCase().trim() === expectedItem.name.toLowerCase().trim()
    );
    if (!matched) {
      return { valid: false, reason: `Expected item "${expectedItem.name}" was not observed in the cart.` };
    }
    if (matched.quantity !== expectedItem.quantity) {
      return {
        valid: false,
        reason: `Mismatched quantity for "${expectedItem.name}": expected ${expectedItem.quantity}, observed ${matched.quantity}.`
      };
    }
  }

  // Validate amount fields
  // If checkout is blocked, total might or might not be available, but subtotal and delivery should be present
  if (typeof obs.subtotal !== 'number' || Number.isNaN(obs.subtotal) || obs.subtotal < 0) {
    return { valid: false, reason: 'Invalid or missing subtotal amount in observation.' };
  }

  const parsedSubtotal = moneyFromText(obs.subtotalText);
  if (Number.isNaN(parsedSubtotal) || parsedSubtotal !== obs.subtotal) {
    return {
      valid: false,
      reason: `Subtotal numeric value (${obs.subtotal}) does not match displayed text "${obs.subtotalText}".`
    };
  }

  if (typeof obs.delivery !== 'number' || Number.isNaN(obs.delivery) || obs.delivery < 0) {
    return { valid: false, reason: 'Invalid or missing delivery amount in observation.' };
  }

  const parsedDelivery = moneyFromText(obs.deliveryText);
  if (Number.isNaN(parsedDelivery) || parsedDelivery !== obs.delivery) {
    return {
      valid: false,
      reason: `Delivery numeric value (${obs.delivery}) does not match displayed text "${obs.deliveryText}".`
    };
  }

  return { valid: true };
}

/**
 * Evaluates an observed journey against deterministic expectations.
 * 
 * @param {Object} options
 * @param {Object} options.observation - Raw observation from TinyFish
 * @param {Object} options.journey - The test journey definition
 * @param {Object} options.rules - Confirmed business rules
 * @param {string} options.scenario - 'buggy' or 'fixed'
 * @returns {Object} Comprehensive evaluation result with per-assertion verdicts
 */
function evaluateJourney({ observation, journey, rules, scenario }) {
  if (!observation) {
    return {
      journeyId: journey.id,
      journeyName: journey.name,
      category: journey.category,
      scenario,
      verdict: 'NOT_TESTED',
      explanation: 'No observation was recorded for this journey.',
      assertions: [],
      expected: null,
      observed: null
    };
  }

  // 1. Evidence Completeness Check
  const evidenceCheck = validateObservationEvidence(observation, journey);
  if (!evidenceCheck.valid) {
    return {
      journeyId: journey.id,
      journeyName: journey.name,
      category: journey.category,
      scenario,
      verdict: 'INCONCLUSIVE',
      explanation: `Incomplete or invalid evidence: ${evidenceCheck.reason}`,
      assertions: [
        {
          name: 'evidence_validation',
          verdict: 'INCONCLUSIVE',
          detail: evidenceCheck.reason
        }
      ],
      expected: null,
      observed: observation
    };
  }

  // 2. Deterministic Expected Calculation (Independent of scenario name!)
  const expected = calculateExpected({
    items: journey.cart,
    couponCode: journey.couponCode,
    rules
  });

  const observed = {
    subtotal: observation.subtotal,
    delivery: observation.delivery,
    discount: typeof observation.discount === 'number' ? observation.discount : 0,
    total: typeof observation.total === 'number' ? observation.total : (observation.subtotal + observation.delivery - (observation.discount || 0)),
    subtotalText: observation.subtotalText,
    deliveryText: observation.deliveryText,
    discountText: observation.discountText || '₹0.00',
    totalText: observation.totalText || '',
    isCheckoutAllowed: Boolean(observation.isCheckoutAllowed),
    checkoutBlockedReason: observation.checkoutBlockedReason || null,
    couponApplied: Boolean(observation.couponApplied),
    couponCode: observation.couponCode || null
  };

  const assertions = [];

  // Subtotal assertion
  const subtotalMatch = observed.subtotal === expected.subtotalRupees;
  assertions.push({
    name: 'subtotal_accuracy',
    description: 'Food subtotal before coupon matches sum of items',
    expected: expected.subtotalRupees,
    observed: observed.subtotal,
    difference: observed.subtotal - expected.subtotalRupees,
    verdict: subtotalMatch ? 'PASS' : 'MISMATCH',
    detail: subtotalMatch 
      ? `Subtotal matches: Rs ${observed.subtotal}`
      : `Subtotal mismatch: expected Rs ${expected.subtotalRupees}, observed Rs ${observed.subtotal}`
  });

  // Delivery fee assertion
  const deliveryMatch = observed.delivery === expected.deliveryRupees;
  assertions.push({
    name: 'delivery_fee_policy',
    description: `Delivery fee policy: ${rules.delivery?.originalWording || 'Free delivery >= Rs 499'}`,
    expected: expected.deliveryRupees,
    observed: observed.delivery,
    difference: observed.delivery - expected.deliveryRupees,
    verdict: deliveryMatch ? 'PASS' : 'MISMATCH',
    detail: deliveryMatch
      ? `Delivery fee honored: Rs ${observed.delivery}`
      : `Delivery fee violation: expected Rs ${expected.deliveryRupees}, observed Rs ${observed.delivery} (${observed.delivery > expected.deliveryRupees ? 'customer overcharge' : 'undercharge'})`
  });

  // Coupon discount assertion (if journey tests coupon)
  if (journey.couponCode) {
    const discountMatch = observed.discount === expected.discountRupees;
    let couponDetail = '';
    if (discountMatch) {
      couponDetail = `Coupon discount correctly applied and capped at Rs ${expected.discountRupees}.`;
    } else if (observed.discount > expected.discountRupees) {
      couponDetail = `Discount-rule violation: café granted Rs ${observed.discount} discount, exceeding the confirmed Rs ${expected.discountRupees} cap.`;
    } else {
      couponDetail = `Discount mismatch: expected Rs ${expected.discountRupees}, observed Rs ${observed.discount}.`;
    }

    assertions.push({
      name: 'coupon_discount_and_cap',
      description: `Coupon ${journey.couponCode} discount cap (${rules.coupon?.originalWording || 'Capped at Rs 100'})`,
      expected: expected.discountRupees,
      observed: observed.discount,
      difference: observed.discount - expected.discountRupees,
      verdict: discountMatch ? 'PASS' : 'MISMATCH',
      detail: couponDetail
    });
  }

  // Checkout eligibility assertion
  const eligibilityMatch = observed.isCheckoutAllowed === expected.isCheckoutAllowed;
  assertions.push({
    name: 'checkout_eligibility',
    description: `Checkout eligibility: ${rules.minimumOrder?.policyStatement || 'No minimum order required'}`,
    expected: expected.isCheckoutAllowed ? 'Allowed' : 'Blocked',
    observed: observed.isCheckoutAllowed ? 'Allowed' : 'Blocked',
    verdict: eligibilityMatch ? 'PASS' : 'MISMATCH',
    detail: eligibilityMatch
      ? `Checkout eligibility honored: ${observed.isCheckoutAllowed ? 'Allowed' : 'Blocked'}`
      : `Checkout eligibility violation: expected ${expected.isCheckoutAllowed ? 'Allowed' : 'Blocked'}, but checkout was ${observed.isCheckoutAllowed ? 'Allowed' : 'Blocked'}${observed.checkoutBlockedReason ? ` (Reason: "${observed.checkoutBlockedReason}")` : ''}`
  });

  // Total assertion (only if checkout allowed and total displayed)
  if (observed.isCheckoutAllowed) {
    const totalMatch = observed.total === expected.totalRupees;
    assertions.push({
      name: 'total_calculation',
      description: 'Final order total equals Subtotal - Discount + Delivery',
      expected: expected.totalRupees,
      observed: observed.total,
      difference: observed.total - expected.totalRupees,
      verdict: totalMatch ? 'PASS' : 'MISMATCH',
      detail: totalMatch
        ? `Total matches: Rs ${observed.total}`
        : `Total mismatch: expected Rs ${expected.totalRupees}, observed Rs ${observed.total}`
    });
  }

  // Derive overall journey verdict from assertions
  const hasMismatch = assertions.some(a => a.verdict === 'MISMATCH');
  const hasInconclusive = assertions.some(a => a.verdict === 'INCONCLUSIVE');
  let overallVerdict = 'PASS';
  let explanation = 'All commercial commitments and rules honored.';

  if (hasMismatch) {
    overallVerdict = 'MISMATCH';
    const mismatchList = assertions.filter(a => a.verdict === 'MISMATCH').map(a => a.detail);
    explanation = mismatchList.join(' | ');
  } else if (hasInconclusive) {
    overallVerdict = 'INCONCLUSIVE';
    explanation = 'One or more assertions could not be completed with the available evidence.';
  }

  return {
    journeyId: journey.id,
    journeyName: journey.name,
    category: journey.category,
    scenario,
    verdict: overallVerdict,
    explanation,
    assertions,
    expected,
    observed
  };
}

module.exports = {
  validateObservationEvidence,
  evaluateJourney
};

