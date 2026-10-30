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
const journeyOutputSchema = {
  type: 'object',
  required: [
    'scenario',
    'url',
    'journeyId',
    'cartCleared',
    'emptyCartText',
    'items',
    'subtotal',
    'discount',
    'delivery',
    'total',
    'subtotalText',
    'discountText',
    'deliveryText',
    'totalText',
    'couponApplied',
    'couponCode',
    'couponErrorText',
    'isCheckoutAllowed',
    'checkoutBlockedReason',
    'advertisedRuleText',
    'actions',
    'error'
  ],
  properties: {
    scenario: {
      type: 'string',
      enum: ['buggy', 'fixed'],
      description: 'Scenario mode identifier: "buggy" or "fixed".'
    },
    url: {
      type: 'string',
      description: 'Exact scenario URL tested.'
    },
    journeyId: {
      type: 'string',
      description: 'Unique identifier of the test journey executed.'
    },
    cartCleared: {
      type: 'boolean',
      description: 'true if the cart was confirmed empty before adding test items.'
    },
    emptyCartText: {
      type: 'string',
      description: 'Visible empty-cart confirmation message observed from the page.'
    },
    items: {
      type: 'array',
      description: 'Observed items currently in the cart.',
      items: {
        type: 'object',
        required: ['name', 'quantity', 'unitPrice'],
        properties: {
          name: { type: 'string', description: 'Product name as displayed.' },
          quantity: { type: 'number', nullable: true, description: 'Observed item quantity in cart.' },
          unitPrice: { type: 'number', nullable: true, description: 'Observed unit price in rupees.' }
        }
      }
    },
    subtotal: {
      type: 'number',
      nullable: true,
      description: 'Numeric food subtotal in rupees parsed from the displayed value (e.g. 499). Must be null if value cannot be observed.'
    },
    discount: {
      type: 'number',
      nullable: true,
      description: 'Numeric discount amount in rupees parsed from displayed discount (e.g. 100 or 120, 0 if none). Must be null if value cannot be observed.'
    },
    delivery: {
      type: 'number',
      nullable: true,
      description: 'Numeric delivery fee in rupees parsed from displayed delivery (e.g. 40, or 0 if FREE). Must be null if value cannot be observed.'
    },
    total: {
      type: 'number',
      nullable: true,
      description: 'Numeric total payable in rupees parsed from displayed total. Must be null if value cannot be observed.'
    },
    subtotalText: {
      type: 'string',
      description: 'The exact displayed monetary value string for the food subtotal on the right side of the Food Subtotal summary row (e.g. "₹499.00"). NEVER the row label "Food Subtotal". If unobserved, empty string or null with error set.'
    },
    discountText: {
      type: 'string',
      description: 'The exact displayed monetary value string for discount (e.g. "-₹100.00" or "₹0.00"). NEVER the row label "Discount".'
    },
    deliveryText: {
      type: 'string',
      description: 'The exact displayed monetary value or text for the delivery fee on the right side of the Delivery Fee summary row (e.g. "₹40.00" or "FREE"). NEVER the row label "Delivery Fee". If unobserved, empty string or null with error set.'
    },
    totalText: {
      type: 'string',
      description: 'The exact displayed monetary value string for total payable on the right side of the Total summary row (e.g. "₹539.00" or "₹499.00"). NEVER the row label "Total Payable". If unobserved, empty string or null with error set.'
    },
    couponApplied: {
      type: 'boolean',
      nullable: true,
      description: 'true if a coupon was successfully applied, false otherwise.'
    },
    couponCode: {
      type: 'string',
      nullable: true,
      description: 'The coupon code entered or applied, or null if none.'
    },
    couponErrorText: {
      type: 'string',
      nullable: true,
      description: 'Visible coupon validation error message if coupon was rejected, or null.'
    },
    isCheckoutAllowed: {
      type: 'boolean',
      nullable: true,
      description: 'true if the checkout button is enabled and clickable, false if disabled or blocked.'
    },
    checkoutBlockedReason: {
      type: 'string',
      nullable: true,
      description: 'Visible text explaining why checkout is blocked, or null if checkout is allowed.'
    },
    advertisedRuleText: {
      type: 'string',
      nullable: true,
      description: 'Verbatim advertised rule text visible on the page or offers policy, or null.'
    },
    actions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Chronological list of factual user actions performed.'
    },
    error: {
      type: 'string',
      nullable: true,
      description: 'Explicit error message if any interaction failed or if any value could not be observed; null when successful.'
    }
  }
};

const JOURNEYS = [
  {
    id: 'delivery-498',
    code: 'D498',
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
2. Ensure the cart is clean: open the cart and clear any existing items using UI buttons. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each). Wait for quantity indicators to update.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and no other items.
5. In the cart order summary, locate each summary line row and read the associated displayed value on the right, NOT the row label on the left:
   - Food Subtotal: read displayed value (e.g. "₹498.00") into subtotalText and numeric rupees into subtotal. NEVER record the row label "Food Subtotal".
   - Delivery Fee: read displayed value (e.g. "₹40.00" or "FREE") into deliveryText and numeric rupees into delivery. NEVER record the row label "Delivery Fee".
   - Total Payable: read displayed value into totalText and numeric rupees into total. NEVER record the row label "Total Payable".
   If any summary value cannot be observed, record null for numeric values and explain in error.
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
    code: 'D499',
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
2. Ensure the cart is clean: open the cart and clear any existing items using UI buttons. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each) and 1 Extra Dip (Rs 1). Click once at a time and verify the quantity counts.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and 1 Extra Dip.
5. In the cart order summary, locate each summary line row and read the associated displayed value on the right, NOT the row label on the left:
   - Food Subtotal: read displayed value (e.g. "₹499.00") into subtotalText and numeric rupees into subtotal. NEVER record the row label "Food Subtotal".
   - Delivery Fee: read displayed value (e.g. "₹40.00" or "FREE") into deliveryText and numeric rupees into delivery (0 if "FREE"). NEVER record the row label "Delivery Fee".
   - Total Payable: read displayed value into totalText and numeric rupees into total. NEVER record the row label "Total Payable".
   If any summary value cannot be observed, record null for numeric values and explain in error.
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
    code: 'D500',
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
2. Ensure the cart is clean: open the cart and clear any existing items using UI buttons. Verify empty cart text is shown.
3. Use visible menu controls to add exactly 2 Margherita Pizzas (Rs 249 each) and 2 Extra Dips (Rs 1 each). Wait for quantity indicators to update.
4. Open the Cart page. Confirm the displayed cart has exactly 2 Margherita Pizzas and 2 Extra Dips.
5. In the cart order summary, locate each summary line row and read the associated displayed value on the right, NOT the row label on the left:
   - Food Subtotal: read displayed value (e.g. "₹500.00") into subtotalText and numeric rupees into subtotal. NEVER record the row label "Food Subtotal".
   - Delivery Fee: read displayed value (e.g. "FREE" or "₹0.00") into deliveryText and numeric rupees (0) into delivery. NEVER record the row label "Delivery Fee".
   - Total Payable: read displayed value into totalText and numeric rupees into total. NEVER record the row label "Total Payable".
   If any summary value cannot be observed, record null for numeric values and explain in error.
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
    code: 'C600',
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
2. Clear the cart completely using UI buttons. Verify it is empty.
3. Add exactly 2 Family Combos (Rs 299 each) and 2 Extra Dips (Rs 1 each) to the cart (subtotal must be Rs 600).
4. Open the Cart page. Verify items: 2 Family Combos and 2 Extra Dips.
5. In the coupon code input field (data-testid="coupon-input"), enter "WELCOME20" and click the apply button (data-testid="apply-coupon-btn").
6. In the cart order summary, locate each summary row and read the associated displayed value on the right, NOT the row label on the left:
   - Food Subtotal: read displayed value (e.g. "₹600.00") into subtotalText and numeric rupees into subtotal. NEVER record the row label "Food Subtotal".
   - Discount: read displayed value (e.g. "-₹100.00" or "-₹120.00") into discountText and numeric rupees into discount. NEVER record the row label "Discount".
   - Delivery Fee: read displayed value into deliveryText and numeric rupees into delivery. NEVER record the row label "Delivery Fee".
   - Total Payable: read displayed value into totalText and numeric rupees into total. NEVER record the row label "Total Payable".
   If any summary value cannot be observed, record null for numeric values and explain in error.
7. DO NOT place an order.
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
    code: 'M099',
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
2. Clear the cart completely using UI buttons. Verify it is empty.
3. Add exactly 1 Veg Burger (Rs 99) to the cart.
4. Open the Cart page. Verify item: 1 Veg Burger, subtotal Rs 99.
5. Check whether the checkout button is enabled or if checkout is blocked. If blocked, record the exact blocked reason text (data-testid="checkout-blocked-reason").
6. In the cart order summary, locate each summary row and read the associated displayed value on the right, NOT the row label on the left:
   - Food Subtotal: read displayed value (e.g. "₹99.00") into subtotalText and numeric rupees into subtotal. NEVER record the row label "Food Subtotal".
   - Delivery Fee: read displayed value (e.g. "₹40.00") into deliveryText and numeric rupees into delivery. NEVER record the row label "Delivery Fee".
   - Total Payable: read displayed value into totalText and numeric rupees into total. NEVER record the row label "Total Payable".
   If any summary value cannot be observed, record null for numeric values and explain in error.
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
  if (!id) return null;
  const normalized = String(id).toLowerCase().trim();
  return JOURNEYS.find(j => 
    j.id.toLowerCase() === normalized || 
    (j.code && j.code.toLowerCase() === normalized)
  ) || null;
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

