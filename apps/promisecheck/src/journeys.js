/**
 * Test Journeys for PromiseCheck
 * 
 * Defines the 5 customer journeys spanning delivery thresholds,
 * coupon caps, and minimum-order checkout eligibility.
 */

const { PRODUCTS } = require('./rules');

const object = properties => ({ type: 'object', properties, required: Object.keys(properties) });
const string = { type: 'string' };
const number = { type: 'number', nullable: true };
const boolean = { type: 'boolean', nullable: true };

/**
 * Standard structured output schema for a single journey observation
 */
const journeyOutputSchema = object({
  scenario: { type: 'string', enum: ['buggy', 'fixed'] },
  url: string,
  journeyId: string,
  cartCleared: { type: 'boolean' },
  emptyCartText: string,
  items: {
    type: 'array',
    items: object({
      name: string,
      quantity: number,
      unitPrice: number
    })
  },
  subtotal: number,
  discount: number,
  delivery: number,
  total: number,
  subtotalText: string,
  discountText: string,
  deliveryText: string,
  totalText: string,
  couponApplied: boolean,
  couponCode: { type: 'string', nullable: true },
  couponErrorText: { type: 'string', nullable: true },
  isCheckoutAllowed: boolean,
  checkoutBlockedReason: { type: 'string', nullable: true },
  advertisedRuleText: { type: 'string', nullable: true },
  actions: { type: 'array', items: string },
  error: { type: 'string', nullable: true }
});

const JOURNEYS = [
  {
    id: 'delivery-498',
    category: 'delivery',
    name: 'Journey A: Delivery Boundary Below (Rs 498)',
    description: 'Adds 2 Margherita Pizzas (subtotal Rs 498). Evaluates that delivery fee of Rs 40 is charged below the Rs 499 threshold in both modes.',
    cart: [
      { id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPriceRupees: 249, unitPricePaise: 24900 }
    ],
    couponCode: null,
    targetSubtotalPaise: 49800,
    checkType: 'delivery_boundary_below',
    buildGoal(targetUrl, scenario) {
      const url = new URL(targetUrl);
      url.searchParams.set('scenario', scenario);
      return `Test the public café at ${url.href} using real browser UI interaction:
1. Navigate to ${url.href}.
2. Ensure the cart is clean: open the cart and clear any existing items. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each). Wait for quantity indicators to update.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and no other items.
5. Read and record the actual displayed subtotal, delivery charge, and final total. Capture both the exact displayed text and numeric values.
6. Check whether checkout is allowed. DO NOT place an order or submit payment.
Return the observation using the supplied JSON schema.`;
    },
    validationFixtures: {
      buggy: {
        subtotal: 498, delivery: 40, discount: 0, total: 538,
        subtotalText: '₹498.00', deliveryText: '₹40.00', discountText: '₹0.00', totalText: '₹538.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      },
      fixed: {
        subtotal: 498, delivery: 40, discount: 0, total: 538,
        subtotalText: '₹498.00', deliveryText: '₹40.00', discountText: '₹0.00', totalText: '₹538.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      }
    }
  },
  {
    id: 'delivery-499',
    category: 'delivery',
    name: 'Journey B: Delivery Boundary Exact (Rs 499)',
    description: 'Adds 2 Margherita Pizzas + 1 Extra Dip (subtotal Rs 499). Evaluates the inclusive free delivery promise (Fixed: Rs 0 delivery vs Buggy: Rs 40 delivery defect).',
    cart: [
      { id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPriceRupees: 249, unitPricePaise: 24900 },
      { id: 'extra-dip', name: 'Extra Dip', quantity: 1, unitPriceRupees: 1, unitPricePaise: 100 }
    ],
    couponCode: null,
    targetSubtotalPaise: 49900,
    checkType: 'delivery_boundary_exact',
    buildGoal(targetUrl, scenario) {
      const url = new URL(targetUrl);
      url.searchParams.set('scenario', scenario);
      return `Test the public café at ${url.href} using real browser UI interaction:
1. Navigate to ${url.href}. Read the advertised free-delivery conditions visible on the page (quote the exact rule text and threshold).
2. Ensure the cart is clean: open the cart and clear any existing items. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each) and 1 Extra Dip (Rs 1). Click once at a time and verify the quantity counts.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and 1 Extra Dip.
5. Read and record the actual displayed subtotal, delivery charge, and final total. If delivery is marked FREE, record delivery as 0 and deliveryText as "FREE".
6. Check whether checkout is allowed. DO NOT place an order or submit payment.
Return the observation using the supplied JSON schema.`;
    },
    validationFixtures: {
      buggy: {
        subtotal: 499, delivery: 40, discount: 0, total: 539,
        subtotalText: '₹499.00', deliveryText: '₹40.00', discountText: '₹0.00', totalText: '₹539.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      },
      fixed: {
        subtotal: 499, delivery: 0, discount: 0, total: 499,
        subtotalText: '₹499.00', deliveryText: 'FREE', discountText: '₹0.00', totalText: '₹499.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      }
    }
  },
  {
    id: 'delivery-500',
    category: 'delivery',
    name: 'Journey C: Delivery Boundary Above (Rs 500)',
    description: 'Adds 2 Margherita Pizzas + 2 Extra Dips (subtotal Rs 500). Evaluates that free delivery is awarded above the threshold in both modes.',
    cart: [
      { id: 'margherita-pizza', name: 'Margherita Pizza', quantity: 2, unitPriceRupees: 249, unitPricePaise: 24900 },
      { id: 'extra-dip', name: 'Extra Dip', quantity: 2, unitPriceRupees: 1, unitPricePaise: 100 }
    ],
    couponCode: null,
    targetSubtotalPaise: 50000,
    checkType: 'delivery_boundary_above',
    buildGoal(targetUrl, scenario) {
      const url = new URL(targetUrl);
      url.searchParams.set('scenario', scenario);
      return `Test the public café at ${url.href} using real browser UI interaction:
1. Navigate to ${url.href}.
2. Ensure the cart is clean: open the cart and clear any existing items. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each) and 2 Extra Dips (Rs 1 each). Wait for quantity indicators to update.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and 2 Extra Dips.
5. Read and record the actual displayed subtotal, delivery charge, and final total. If delivery is marked FREE, record delivery as 0.
6. Check whether checkout is allowed. DO NOT place an order or submit payment.
Return the observation using the supplied JSON schema.`;
    },
    validationFixtures: {
      buggy: {
        subtotal: 500, delivery: 0, discount: 0, total: 500,
        subtotalText: '₹500.00', deliveryText: 'FREE', discountText: '₹0.00', totalText: '₹500.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      },
      fixed: {
        subtotal: 500, delivery: 0, discount: 0, total: 500,
        subtotalText: '₹500.00', deliveryText: 'FREE', discountText: '₹0.00', totalText: '₹500.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      }
    }
  },
  {
    id: 'coupon-cap-600',
    category: 'coupon',
    name: 'Journey D: Coupon Cap Audit (Rs 600 + WELCOME20)',
    description: 'Adds 2 Family Combos + 2 Extra Dips (subtotal Rs 600) and applies WELCOME20. Evaluates the Rs 100 maximum discount cap (Fixed: Rs 100 capped vs Buggy: Rs 120 uncapped discount defect).',
    cart: [
      { id: 'family-combo', name: 'Family Combo', quantity: 2, unitPriceRupees: 299, unitPricePaise: 29900 },
      { id: 'extra-dip', name: 'Extra Dip', quantity: 2, unitPriceRupees: 1, unitPricePaise: 100 }
    ],
    couponCode: 'WELCOME20',
    targetSubtotalPaise: 60000,
    checkType: 'coupon_cap',
    buildGoal(targetUrl, scenario) {
      const url = new URL(targetUrl);
      url.searchParams.set('scenario', scenario);
      return `Test the coupon discount cap at ${url.href} using real browser UI interaction:
1. Navigate to ${url.href}.
2. Clear the cart completely. Verify it is empty.
3. Add exactly 2 Family Combos (Rs 299 each) and 2 Extra Dips (Rs 1 each) to the cart (subtotal must be Rs 600).
4. Open the Cart page. Verify items: 2 Family Combos and 2 Extra Dips.
5. In the coupon code input field (data-testid="coupon-input"), enter "WELCOME20" and click the apply button (data-testid="apply-coupon-btn").
6. Read the applied discount amount, delivery fee, subtotal, and total amount. Note whether the discount is capped at Rs 100 or incorrectly set to Rs 120.
7. DO NOT place an order. Capture all displayed amounts and text.
Return the observation using the supplied JSON schema.`;
    },
    validationFixtures: {
      buggy: {
        subtotal: 600, delivery: 0, discount: 120, total: 480,
        subtotalText: '₹600.00', deliveryText: 'FREE', discountText: '-₹120.00', totalText: '₹480.00',
        couponApplied: true, couponCode: 'WELCOME20', isCheckoutAllowed: true, checkoutBlockedReason: null
      },
      fixed: {
        subtotal: 600, delivery: 0, discount: 100, total: 500,
        subtotalText: '₹600.00', deliveryText: 'FREE', discountText: '-₹100.00', totalText: '₹500.00',
        couponApplied: true, couponCode: 'WELCOME20', isCheckoutAllowed: true, checkoutBlockedReason: null
      }
    }
  },
  {
    id: 'min-order-99',
    category: 'minimum-order',
    name: 'Journey E: Minimum Order Audit (Rs 99 Veg Burger)',
    description: 'Adds 1 Veg Burger (subtotal Rs 99) with no coupon and attempts to checkout. Evaluates the "No minimum order" policy (Fixed: checkout allowed vs Buggy: checkout blocked defect).',
    cart: [
      { id: 'veg-burger', name: 'Veg Burger', quantity: 1, unitPriceRupees: 99, unitPricePaise: 9900 }
    ],
    couponCode: null,
    targetSubtotalPaise: 9900,
    checkType: 'minimum_order_eligibility',
    buildGoal(targetUrl, scenario) {
      const url = new URL(targetUrl);
      url.searchParams.set('scenario', scenario);
      return `Test the minimum order policy at ${url.href} using real browser UI interaction:
1. Navigate to ${url.href}.
2. Clear the cart completely. Verify it is empty.
3. Add exactly 1 Veg Burger (Rs 99) to the cart.
4. Open the Cart page. Verify item: 1 Veg Burger, subtotal Rs 99.
5. Check whether the checkout button is enabled or if checkout is blocked. If blocked, record the exact blocked reason text (data-testid="checkout-blocked-reason").
6. Read the displayed subtotal, delivery fee (Rs 40 expected), and total.
7. DO NOT place an order.
Return the observation using the supplied JSON schema.`;
    },
    validationFixtures: {
      buggy: {
        subtotal: 99, delivery: 40, discount: 0, total: 139,
        subtotalText: '₹99.00', deliveryText: '₹40.00', discountText: '₹0.00', totalText: '₹139.00',
        couponApplied: false, isCheckoutAllowed: false,
        checkoutBlockedReason: 'Minimum food subtotal of ₹199.00 required for checkout.'
      },
      fixed: {
        subtotal: 99, delivery: 40, discount: 0, total: 139,
        subtotalText: '₹99.00', deliveryText: '₹40.00', discountText: '₹0.00', totalText: '₹139.00',
        couponApplied: false, isCheckoutAllowed: true, checkoutBlockedReason: null
      }
    }
  }
];

function getJourneyById(id) {
  return JOURNEYS.find(j => j.id === id) || null;
}

function getJourneysByCategory(category) {
  return JOURNEYS.filter(j => j.category === category);
}

module.exports = {
  JOURNEYS,
  journeyOutputSchema,
  getJourneyById,
  getJourneysByCategory
};

