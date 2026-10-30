import { CartItem, CalculationResult, Scenario } from '../types';

export const STANDARD_DELIVERY_PAISE = 4000; // Rs 40.00
export const FREE_DELIVERY_THRESHOLD_PAISE = 49900; // Rs 499.00
export const WELCOME20_MIN_SUBTOTAL_PAISE = 20000; // Rs 200.00
export const WELCOME20_MAX_DISCOUNT_PAISE = 10000; // Rs 100.00
export const WELCOME20_PERCENT = 0.20; // 20%
export const BUGGY_MIN_CHECKOUT_SUBTOTAL_PAISE = 19900; // Rs 199.00

/**
 * Validates integer quantity between 1 and 10.
 * Rejects negative, fractional, NaN, 0, or > 10 quantities.
 */
export function isValidQuantity(qty: unknown): qty is number {
  if (typeof qty !== 'number' || Number.isNaN(qty) || !Number.isFinite(qty)) {
    return false;
  }
  if (!Number.isInteger(qty)) {
    return false;
  }
  return qty >= 1 && qty <= 10;
}

/**
 * Parses and sanitizes a quantity value.
 * Returns valid integer 1..10, or null if invalid.
 */
export function sanitizeQuantity(raw: unknown): number | null {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    const parsed = parseInt(trimmed, 10);
    return isValidQuantity(parsed) ? parsed : null;
  }
  return isValidQuantity(raw) ? raw : null;
}

/**
 * Formats integer paise into standard Indian Rupee string:
 * e.g., 49900 -> "₹499.00"
 */
export function formatPaise(paise: number): string {
  if (typeof paise !== 'number' || Number.isNaN(paise)) {
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
 * Formats integer paise into a clean short rupee representation:
 * e.g., 49900 -> "Rs 499" (or "Rs 499.50" if paise > 0)
 */
export function formatPaiseShort(paise: number): string {
  if (typeof paise !== 'number' || Number.isNaN(paise)) {
    return 'Rs 0';
  }
  const rupees = paise / 100;
  if (paise % 100 === 0) {
    return `Rs ${rupees.toLocaleString('en-IN')}`;
  }
  return `Rs ${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Pure calculation function for Synapsee Café.
 * Implements both 'fixed' and 'buggy' business rules.
 */
export function calculateOrder(
  items: CartItem[],
  couponCode: string | null,
  scenario: Scenario
): CalculationResult {
  // 1. Food Subtotal BEFORE coupon
  let subtotalPaise = 0;
  for (const item of items) {
    if (isValidQuantity(item.quantity) && item.product && typeof item.product.pricePaise === 'number') {
      subtotalPaise += item.quantity * item.product.pricePaise;
    }
  }

  // 2. Delivery Fee calculation
  // Advertised rule: Free delivery when food subtotal BEFORE coupon is 49900 paise or more.
  // Fixed scenario: subtotal >= 49900
  // Buggy scenario (Defect 1): subtotal > 49900 (strictly greater than, fails at exactly 49900)
  let freeDeliveryQualified = false;
  if (subtotalPaise > 0) {
    if (scenario === 'buggy') {
      freeDeliveryQualified = subtotalPaise > FREE_DELIVERY_THRESHOLD_PAISE;
    } else {
      freeDeliveryQualified = subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE;
    }
  }

  const deliveryPaise = (subtotalPaise === 0 || freeDeliveryQualified) ? 0 : STANDARD_DELIVERY_PAISE;

  // 3. Coupon calculation
  let discountPaise = 0;
  let isCouponApplied = false;
  let couponError: string | null = null;
  const normalizedCoupon = couponCode ? couponCode.trim().toUpperCase() : null;

  if (normalizedCoupon) {
    if (normalizedCoupon === 'WELCOME20') {
      if (subtotalPaise < WELCOME20_MIN_SUBTOTAL_PAISE) {
        couponError = `Food subtotal must be at least ${formatPaise(WELCOME20_MIN_SUBTOTAL_PAISE)} to use coupon WELCOME20.`;
      } else {
        // Calculate 20% discount rounded to nearest paise, half up
        const rawDiscount = Math.round(subtotalPaise * WELCOME20_PERCENT);

        if (scenario === 'buggy') {
          // Defect 2: WELCOME20 calculates 20% but ignores the 10000-paise cap
          discountPaise = rawDiscount;
        } else {
          // Fixed: Capped at 10000 paise (Rs 100.00)
          discountPaise = Math.min(rawDiscount, WELCOME20_MAX_DISCOUNT_PAISE);
        }
        isCouponApplied = true;
      }
    } else {
      couponError = `Invalid coupon code "${couponCode}". Try WELCOME20.`;
    }
  }

  // 4. Total calculation
  // Total = subtotal - discount + delivery
  const totalPaise = Math.max(0, subtotalPaise - discountPaise + deliveryPaise);

  // 5. Checkout eligibility
  // Advertised rule: No minimum order. Only an empty cart prevents checkout.
  // Buggy scenario (Defect 3): Incorrectly rejects subtotal below 19900 paise.
  let isCheckoutAllowed = false;
  let checkoutBlockedReason: string | null = null;

  if (items.length === 0 || subtotalPaise === 0) {
    isCheckoutAllowed = false;
    checkoutBlockedReason = 'Your cart is empty. Please add items to proceed.';
  } else if (scenario === 'buggy' && subtotalPaise < BUGGY_MIN_CHECKOUT_SUBTOTAL_PAISE) {
    // Defect 3: Minimum order subtotal check falsely enforced in buggy mode
    isCheckoutAllowed = false;
    checkoutBlockedReason = `Minimum food subtotal of ${formatPaise(BUGGY_MIN_CHECKOUT_SUBTOTAL_PAISE)} required for checkout.`;
  } else {
    isCheckoutAllowed = true;
  }

  // Savings calculation: total discount + free delivery savings (if qualified)
  const deliverySavings = (subtotalPaise > 0 && freeDeliveryQualified) ? STANDARD_DELIVERY_PAISE : 0;
  const savingsPaise = discountPaise + deliverySavings;

  return {
    subtotalPaise,
    discountPaise,
    deliveryPaise,
    totalPaise,
    isCouponApplied,
    couponCode: isCouponApplied ? normalizedCoupon : null,
    couponError,
    isCheckoutAllowed,
    checkoutBlockedReason,
    freeDeliveryThresholdPaise: FREE_DELIVERY_THRESHOLD_PAISE,
    freeDeliveryQualified,
    savingsPaise,
  };
}

