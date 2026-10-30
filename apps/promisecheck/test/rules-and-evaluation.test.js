const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateExpected, moneyFromText, formatPaise, formatRupees, DEFAULT_OWNER_RULES } = require('../src/rules');
const { getJourneyById, JOURNEYS } = require('../src/journeys');
const { evaluateJourney, validateObservationEvidence } = require('../src/evaluator');

// 1. Delivery Boundaries: Rs 498, Rs 499, Rs 500
test('delivery boundary Rs 498 charges standard delivery fee (Rs 40)', () => {
  const items = [{ id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPricePaise: 24900 }];
  const expected = calculateExpected({ items });
  assert.equal(expected.subtotalPaise, 49800);
  assert.equal(expected.subtotalRupees, 498);
  assert.equal(expected.deliveryPaise, 4000);
  assert.equal(expected.deliveryRupees, 40);
  assert.equal(expected.totalPaise, 53800);
  assert.equal(expected.totalRupees, 538);
});

test('delivery boundary Rs 499 awards free delivery (Rs 0) with inclusive threshold', () => {
  const items = [
    { id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPricePaise: 24900 },
    { id: 'extra-dip', name: 'Extra Dip', quantity: 1, unitPricePaise: 100 }
  ];
  const expected = calculateExpected({ items });
  assert.equal(expected.subtotalPaise, 49900);
  assert.equal(expected.subtotalRupees, 499);
  assert.equal(expected.deliveryPaise, 0);
  assert.equal(expected.deliveryRupees, 0);
  assert.equal(expected.totalPaise, 49900);
  assert.equal(expected.totalRupees, 499);
});

test('delivery boundary Rs 500 awards free delivery (Rs 0)', () => {
  const items = [
    { id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPricePaise: 24900 },
    { id: 'extra-dip', name: 'Extra Dip', quantity: 2, unitPricePaise: 100 }
  ];
  const expected = calculateExpected({ items });
  assert.equal(expected.subtotalPaise, 50000);
  assert.equal(expected.subtotalRupees, 500);
  assert.equal(expected.deliveryPaise, 0);
  assert.equal(expected.deliveryRupees, 0);
  assert.equal(expected.totalPaise, 50000);
  assert.equal(expected.totalRupees, 500);
});

// 2. Coupon Eligibility below and at Rs 200
test('coupon WELCOME20 is rejected below Rs 200 threshold', () => {
  // 1 Paneer Wrap = Rs 199 (19900 paise)
  const items = [{ id: 'paneer-wrap', name: 'Paneer Wrap', quantity: 1, unitPricePaise: 19900 }];
  const expected = calculateExpected({ items, couponCode: 'WELCOME20' });
  assert.equal(expected.subtotalPaise, 19900);
  assert.equal(expected.isCouponApplied, false);
  assert.equal(expected.discountPaise, 0);
  assert.match(expected.couponError, /at least Rs 200/);
});

test('coupon WELCOME20 applies at Rs 200 threshold (Rs 199 wrap + Rs 1 dip)', () => {
  const items = [
    { id: 'paneer-wrap', name: 'Paneer Wrap', quantity: 1, unitPricePaise: 19900 },
    { id: 'extra-dip', name: 'Extra Dip', quantity: 1, unitPricePaise: 100 }
  ];
  const expected = calculateExpected({ items, couponCode: 'WELCOME20' });
  assert.equal(expected.subtotalPaise, 20000);
  assert.equal(expected.isCouponApplied, true);
  // 20% of 20000 paise = 4000 paise (Rs 40.00)
  assert.equal(expected.discountPaise, 4000);
  assert.equal(expected.discountRupees, 40);
});

// 3. Coupon Cap and Rounding
test('coupon cap strictly limits discount to Rs 100 on Rs 600 cart', () => {
  const items = [
    { id: 'family-combo', name: 'Family Combo', quantity: 2, unitPricePaise: 29900 },
    { id: 'extra-dip', name: 'Extra Dip', quantity: 2, unitPricePaise: 100 }
  ];
  const expected = calculateExpected({ items, couponCode: 'WELCOME20' });
  assert.equal(expected.subtotalPaise, 60000); // Rs 600
  // Raw 20% is Rs 120 (12000 paise), but cap is Rs 100 (10000 paise)
  assert.equal(expected.discountPaise, 10000);
  assert.equal(expected.discountRupees, 100);
  assert.equal(expected.totalPaise, 50000); // 60000 - 10000 + 0 = 50000
});

test('coupon discount rounds half-up to nearest paise', () => {
  // Odd subtotal: 24901 paise * 0.20 = 4980.2 -> 4980
  const exp1 = calculateExpected({
    items: [{ id: 'custom', name: 'Custom', quantity: 1, unitPricePaise: 24901 }],
    couponCode: 'WELCOME20'
  });
  assert.equal(exp1.discountPaise, 4980);

  // Subtotal with .6 paise: 24928 * 0.20 = 4985.6 -> 4986 (rounds up)
  const exp2 = calculateExpected({
    items: [{ id: 'custom', name: 'Custom', quantity: 1, unitPricePaise: 24928 }],
    couponCode: 'WELCOME20'
  });
  assert.equal(exp2.discountPaise, 4986);
});

// 4. Minimum Order Eligibility
test('minimum-order policy allows Rs 99 Veg Burger checkout in fixed mode', () => {
  const items = [{ id: 'veg-burger', name: 'Veg Burger', quantity: 1, unitPricePaise: 9900 }];
  const expected = calculateExpected({ items });
  assert.equal(expected.isCheckoutAllowed, true);
  assert.equal(expected.checkoutBlockedReason, null);
});

test('empty cart blocks checkout', () => {
  const expected = calculateExpected({ items: [] });
  assert.equal(expected.isCheckoutAllowed, false);
  assert.match(expected.checkoutBlockedReason, /empty/i);
});

// 5. Missing versus Zero Amounts & moneyFromText
test('moneyFromText handles zero, FREE, formatted rupees, and rejects missing', () => {
  assert.equal(moneyFromText('FREE'), 0);
  assert.equal(moneyFromText('Free Delivery'), 0);
  assert.equal(moneyFromText('₹499.00'), 499);
  assert.equal(moneyFromText('Rs 40'), 40);
  assert.equal(moneyFromText('-₹100.00'), 100);
  assert.ok(Number.isNaN(moneyFromText('')));
  assert.ok(Number.isNaN(moneyFromText(null)));
  assert.ok(Number.isNaN(moneyFromText(undefined)));
});

// 6. Mismatched Cart Identity & Quantities
test('evaluator rejects mismatched item identity or count', () => {
  const journey = getJourneyById('delivery-498');
  const badCartObs = {
    cartCleared: true,
    items: [{ name: 'Veg Burger', quantity: 2, unitPrice: 99 }], // Expected Margherita Pizza
    subtotal: 198,
    delivery: 40,
    subtotalText: '₹198.00',
    deliveryText: '₹40.00'
  };
  const evalResult = evaluateJourney({
    observation: badCartObs,
    journey,
    rules: DEFAULT_OWNER_RULES,
    scenario: 'fixed'
  });
  assert.equal(evalResult.verdict, 'INCONCLUSIVE');
  assert.match(evalResult.explanation, /not observed in the cart/i);
});

test('evaluator rejects wrong quantity count for item', () => {
  const journey = getJourneyById('delivery-498');
  const badQtyObs = {
    cartCleared: true,
    items: [{ name: 'Margherita Pizza', quantity: 1, unitPrice: 249 }], // Expected 2
    subtotal: 249,
    delivery: 40,
    subtotalText: '₹249.00',
    deliveryText: '₹40.00'
  };
  const evalResult = evaluateJourney({
    observation: badQtyObs,
    journey,
    rules: DEFAULT_OWNER_RULES,
    scenario: 'fixed'
  });
  assert.equal(evalResult.verdict, 'INCONCLUSIVE');
  assert.match(evalResult.explanation, /Mismatched quantity/i);
});

// 7. Scenario Name cannot select the verdict
test('scenario name cannot select verdict: buggy observation evaluated against fixed rules produces MISMATCH', () => {
  const journey = getJourneyById('delivery-499');
  // At 499, buggy observation charges 40 instead of 0
  const buggyObs = {
    cartCleared: true,
    items: [
      { name: 'Margherita Pizza', quantity: 2, unitPrice: 249 },
      { name: 'Extra Dip', quantity: 1, unitPrice: 1 }
    ],
    subtotal: 499,
    delivery: 40,
    discount: 0,
    total: 539,
    subtotalText: '₹499.00',
    deliveryText: '₹40.00',
    discountText: '₹0.00',
    totalText: '₹539.00',
    isCheckoutAllowed: true
  };
  // Evaluating under scenario label 'fixed' or 'buggy' produces MISMATCH because 40 != 0
  const res = evaluateJourney({
    observation: buggyObs,
    journey,
    rules: DEFAULT_OWNER_RULES,
    scenario: 'fixed'
  });
  assert.equal(res.verdict, 'MISMATCH');
  assert.match(res.explanation, /Delivery fee violation/i);
});

// 8. Coupon cap violation described as discount-rule violation, not overcharge
test('coupon cap excess is explained as discount-rule violation', () => {
  const journey = getJourneyById('coupon-cap-600');
  const uncappedObs = {
    cartCleared: true,
    items: [
      { name: 'Family Combo', quantity: 2, unitPrice: 299 },
      { name: 'Extra Dip', quantity: 2, unitPrice: 1 }
    ],
    subtotal: 600,
    delivery: 0,
    discount: 120, // Should be capped at 100
    total: 480,
    subtotalText: '₹600.00',
    deliveryText: 'FREE',
    discountText: '-₹120.00',
    totalText: '₹480.00',
    couponApplied: true,
    couponCode: 'WELCOME20',
    isCheckoutAllowed: true
  };
  const res = evaluateJourney({
    observation: uncappedObs,
    journey,
    rules: DEFAULT_OWNER_RULES,
    scenario: 'buggy'
  });
  assert.equal(res.verdict, 'MISMATCH');
  assert.match(res.explanation, /Discount-rule violation/i);
});

// 9. Incomplete evidence rejection
test('missing clean-cart confirmation makes evidence inconclusive', () => {
  const journey = getJourneyById('delivery-498');
  const dirtyCartObs = {
    cartCleared: false,
    items: [{ name: 'Margherita Pizza', quantity: 2, unitPrice: 249 }],
    subtotal: 498, delivery: 40, subtotalText: '₹498.00', deliveryText: '₹40.00'
  };
  const res = evaluateJourney({
    observation: dirtyCartObs,
    journey,
    rules: DEFAULT_OWNER_RULES,
    scenario: 'buggy'
  });
  assert.equal(res.verdict, 'INCONCLUSIVE');
  assert.match(res.explanation, /Cart was not confirmed cleared/i);
});
