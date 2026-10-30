/**
 * Deterministic Rules & Mathematical Engine for Synapsee Café
 * 
 * All monetary values are maintained as exact integer paise (1 INR = 100 paise)
 * to eliminate floating-point representation anomalies.
 */

const PRODUCTS = {
  'veg-burger': {
    id: 'veg-burger',
    name: 'Veg Burger',
    pricePaise: 9900,
    priceRupees: 99,
    category: 'Mains',
    maxQuantity: 10
  },
  'paneer-wrap': {
    id: 'paneer-wrap',
    name: 'Paneer Wrap',
    pricePaise: 19900,
    priceRupees: 199,
    category: 'Mains',
    maxQuantity: 10
  },
  'margherita-pizza': {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    pricePaise: 24900,
    priceRupees: 249,
    category: 'Mains',
    maxQuantity: 10
  },
  'family-combo': {
    id: 'family-combo',
    name: 'Family Combo',
    pricePaise: 29900,
    priceRupees: 299,
    category: 'Combos',
    maxQuantity: 10
  },
  'extra-dip': {
    id: 'extra-dip',
    name: 'Extra Dip',
    pricePaise: 100,
    priceRupees: 1,
    category: 'Sides',
    maxQuantity: 10
  }
};

const DEFAULT_OWNER_RULES = {
  version: '1.0.0',
  currency: 'INR',
  confirmedBy: 'Jeevith P (Owner Confirmation)',
  confirmedAt: '2026-10-30T10:00:00.000Z',
  delivery: {
    standardFeePaise: 4000,
    freeDeliveryThresholdPaise: 49900,
    thresholdInclusive: true, // >= 49900
    subtotalBasis: 'food_subtotal_before_coupon',
    originalWording: 'Enjoy FREE delivery on food orders ₹499+ (normally ₹40)',
    sourceUrl: 'https://synapsee-promisecheck.vercel.app/offers'
  },
  coupon: {
    code: 'WELCOME20',
    percentage: 20,
    minSubtotalPaise: 20000, // Rs 200.00
    maxDiscountPaise: 10000, // Rs 100.00 cap
    maxCouponsAllowed: 1,
    rounding: 'half_up_to_nearest_paise',
    originalWording: '20% off up to ₹100 on orders above ₹200 with code WELCOME20',
    sourceUrl: 'https://synapsee-promisecheck.vercel.app/offers'
  },
  minimumOrder: {
    hasMinimumOrder: false,
    minCheckoutSubtotalPaise: 0,
    policyStatement: 'No minimum order amount. Any non-empty cart is eligible for checkout.',
    originalWording: 'No minimum order required — order as little or as much as you like!',
    sourceUrl: 'https://synapsee-promisecheck.vercel.app/offers'
  },
  taxesAndFees: {
    pricesIncludeTaxes: true,
    separateServiceFeePaise: 0,
    separatePackagingFeePaise: 0
  }
};

/**
 * Parses displayed money text from the DOM.
 * Handles:
 * - "FREE" or "Free" (without digits) -> 0
 * - "₹499.00", "Rs 499", "Rs 499.00", "499" -> 499
 * Returns NaN for empty/invalid strings.
 */
function moneyFromText(text) {
  if (typeof text !== 'string' || !text.trim()) return NaN;
  const trimmed = text.trim();
  if (/\bfree\b/i.test(trimmed) && !/\d/.test(trimmed)) return 0;
  const cleaned = trimmed.replace(/,/g, '').replace(/[₹Rs\s]/gi, ' ').trim();
  const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
  return matches?.length === 1 ? Number(matches[0]) : NaN;
}

/**
 * Formats integer paise into standard Indian Rupee string:
 * 49900 -> "₹499.00"
 */
function formatPaise(paise) {
  if (typeof paise !== 'number' || Number.isNaN(paise) || !Number.isFinite(paise)) {
    return '₹0.00';
  }
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainder = absPaise % 100;
  const formattedPence = remainder.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}₹${rupees.toLocaleString('en-IN')}.${formattedPence}`;
}

/**
 * Formats integer paise into a clean short rupee display:
 * 49900 -> "Rs 499" (or "Rs 499.50" if paise > 0)
 */
function formatRupees(paise) {
  if (typeof paise !== 'number' || Number.isNaN(paise) || !Number.isFinite(paise)) {
    return 'Rs 0';
  }
  const rupees = paise / 100;
  if (paise % 100 === 0) {
    return `Rs ${rupees.toLocaleString('en-IN')}`;
  }
  return `Rs ${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Pure deterministic calculation function.
 * Computes exact expected commercial values in integer paise.
 * 
 * @param {Object} options
 * @param {Array} options.items - [{ id, name, quantity, unitPricePaise }]
 * @param {string|null} options.couponCode - Applied coupon code (e.g. 'WELCOME20')
 * @param {Object} [options.rules] - Confirmed business rules (defaults to DEFAULT_OWNER_RULES)
 * @returns {Object} Deterministic expectations in paise and rupees
 */
function calculateExpected({ items = [], couponCode = null, rules = DEFAULT_OWNER_RULES } = {}) {
  const activeRules = rules || DEFAULT_OWNER_RULES;

  // 1. Food Subtotal before coupon
  let subtotalPaise = 0;
  for (const item of items) {
    const qty = Number(item.quantity);
    let unitPrice = Number(item.unitPricePaise);
    if (!unitPrice && item.id && PRODUCTS[item.id]) {
      unitPrice = PRODUCTS[item.id].pricePaise;
    }
    if (Number.isInteger(qty) && qty > 0 && Number.isFinite(unitPrice)) {
      subtotalPaise += qty * unitPrice;
    }
  }

  // 2. Free Delivery Qualification (subtotal basis before coupon)
  const deliveryRules = activeRules.delivery || DEFAULT_OWNER_RULES.delivery;
  let freeDeliveryQualified = false;
  if (subtotalPaise > 0) {
    if (deliveryRules.thresholdInclusive) {
      freeDeliveryQualified = subtotalPaise >= deliveryRules.freeDeliveryThresholdPaise;
    } else {
      freeDeliveryQualified = subtotalPaise > deliveryRules.freeDeliveryThresholdPaise;
    }
  }

  const deliveryPaise = (subtotalPaise === 0 || freeDeliveryQualified) ? 0 : deliveryRules.standardFeePaise;

  // 3. Coupon Discount Calculation
  let discountPaise = 0;
  let isCouponApplied = false;
  let couponError = null;
  const couponRules = activeRules.coupon || DEFAULT_OWNER_RULES.coupon;
  const normalizedCoupon = couponCode ? couponCode.trim().toUpperCase() : null;

  if (normalizedCoupon) {
    if (normalizedCoupon === couponRules.code) {
      if (subtotalPaise < couponRules.minSubtotalPaise) {
        couponError = `Food subtotal must be at least ${formatRupees(couponRules.minSubtotalPaise)} to use coupon ${couponRules.code}.`;
      } else {
        // Calculate percentage discount with half-up rounding to nearest paise
        const rawDiscount = Math.round(subtotalPaise * (couponRules.percentage / 100));
        // Apply maximum discount cap
        discountPaise = Math.min(rawDiscount, couponRules.maxDiscountPaise);
        isCouponApplied = true;
      }
    } else {
      couponError = `Invalid coupon code "${couponCode}". Valid code is ${couponRules.code}.`;
    }
  }

  // 4. Final Total Calculation
  // Total = Subtotal - Discount + Delivery
  const totalPaise = Math.max(0, subtotalPaise - discountPaise + deliveryPaise);

  // 5. Checkout Eligibility
  const minOrderRules = activeRules.minimumOrder || DEFAULT_OWNER_RULES.minimumOrder;
  let isCheckoutAllowed = false;
  let checkoutBlockedReason = null;

  if (items.length === 0 || subtotalPaise === 0) {
    isCheckoutAllowed = false;
    checkoutBlockedReason = 'Your cart is empty. Please add items to proceed.';
  } else if (minOrderRules.hasMinimumOrder && subtotalPaise < minOrderRules.minCheckoutSubtotalPaise) {
    isCheckoutAllowed = false;
    checkoutBlockedReason = `Minimum food subtotal of ${formatRupees(minOrderRules.minCheckoutSubtotalPaise)} required for checkout.`;
  } else {
    isCheckoutAllowed = true;
  }

  return {
    subtotalPaise,
    discountPaise,
    deliveryPaise,
    totalPaise,
    subtotalRupees: subtotalPaise / 100,
    discountRupees: discountPaise / 100,
    deliveryRupees: deliveryPaise / 100,
    totalRupees: totalPaise / 100,
    isCouponApplied,
    couponCode: isCouponApplied ? normalizedCoupon : null,
    couponError,
    isCheckoutAllowed,
    checkoutBlockedReason,
    freeDeliveryQualified
  };
}

module.exports = {
  PRODUCTS,
  DEFAULT_OWNER_RULES,
  moneyFromText,
  formatPaise,
  formatRupees,
  calculateExpected
};

