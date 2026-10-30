import { describe, it, expect } from 'vitest';
import {
  calculateOrder,
  isValidQuantity,
  sanitizeQuantity,
  formatPaise,
  formatPaiseShort,
} from '../utils/calc';
import { PRODUCTS } from '../data/products';
import { CartItem } from '../types';

describe('Unit Tests: Pure Calculation Functions & Validation', () => {
  describe('Quantity Validation and Sanitization', () => {
    it('accepts valid integer quantities between 1 and 10', () => {
      for (let q = 1; q <= 10; q++) {
        expect(isValidQuantity(q)).toBe(true);
        expect(sanitizeQuantity(q)).toBe(q);
        expect(sanitizeQuantity(String(q))).toBe(q);
      }
    });

    it('rejects 0, negative numbers, and numbers greater than 10', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(-5)).toBe(false);
      expect(isValidQuantity(11)).toBe(false);
      expect(isValidQuantity(99)).toBe(false);

      expect(sanitizeQuantity(0)).toBeNull();
      expect(sanitizeQuantity(-1)).toBeNull();
      expect(sanitizeQuantity(11)).toBeNull();
      expect(sanitizeQuantity('0')).toBeNull();
      expect(sanitizeQuantity('-3')).toBeNull();
      expect(sanitizeQuantity('15')).toBeNull();
    });

    it('rejects fractional numbers, NaN, and non-numeric strings', () => {
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(2.0001)).toBe(false);
      expect(isValidQuantity(NaN)).toBe(false);
      expect(isValidQuantity(Infinity)).toBe(false);
      expect(isValidQuantity('2')).toBe(false);
      expect(isValidQuantity(null)).toBe(false);
      expect(isValidQuantity(undefined)).toBe(false);

      expect(sanitizeQuantity(2.5)).toBeNull();
      expect(sanitizeQuantity('abc')).toBeNull();
      expect(sanitizeQuantity('1.5')).toBeNull();
      expect(sanitizeQuantity('')).toBeNull();
    });
  });

  describe('Paise Formatting', () => {
    it('formats integer paise into INR rupee strings correctly', () => {
      expect(formatPaise(0)).toBe('₹0.00');
      expect(formatPaise(100)).toBe('₹1.00');
      expect(formatPaise(9900)).toBe('₹99.00');
      expect(formatPaise(49900)).toBe('₹499.00');
      expect(formatPaise(100000)).toBe('₹1,000.00');
    });

    it('formats short paise representation correctly', () => {
      expect(formatPaiseShort(100)).toBe('Rs 1');
      expect(formatPaiseShort(49900)).toBe('Rs 499');
      expect(formatPaiseShort(50000)).toBe('Rs 500');
      expect(formatPaiseShort(9950)).toBe('Rs 99.50');
    });
  });

  describe('Free Delivery Threshold & Defect 1', () => {
    it('in FIXED mode: awards free delivery at exactly 49,900 paise (>= threshold)', () => {
      const item498: CartItem[] = [{ productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] }]; // 49800
      const item499: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 1, product: PRODUCTS['extra-dip'] },
      ]; // 49900
      const item500: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] },
      ]; // 50000

      const res498 = calculateOrder(item498, null, 'fixed');
      expect(res498.subtotalPaise).toBe(49800);
      expect(res498.deliveryPaise).toBe(4000);
      expect(res498.freeDeliveryQualified).toBe(false);

      const res499 = calculateOrder(item499, null, 'fixed');
      expect(res499.subtotalPaise).toBe(49900);
      expect(res499.deliveryPaise).toBe(0);
      expect(res499.freeDeliveryQualified).toBe(true);

      const res500 = calculateOrder(item500, null, 'fixed');
      expect(res500.subtotalPaise).toBe(50000);
      expect(res500.deliveryPaise).toBe(0);
      expect(res500.freeDeliveryQualified).toBe(true);
    });

    it('in BUGGY mode (Defect 1): requires strictly subtotal > 49,900 paise', () => {
      const item499: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 1, product: PRODUCTS['extra-dip'] },
      ]; // exactly 49900 paise
      const item500: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] },
      ]; // 50000 paise

      const res499 = calculateOrder(item499, null, 'buggy');
      expect(res499.subtotalPaise).toBe(49900);
      expect(res499.deliveryPaise).toBe(4000); // Defect 1: charges Rs 40 delivery at 49900 paise!
      expect(res499.freeDeliveryQualified).toBe(false);

      const res500 = calculateOrder(item500, null, 'buggy');
      expect(res500.subtotalPaise).toBe(50000);
      expect(res500.deliveryPaise).toBe(0); // Qualified because 50000 > 49900
      expect(res500.freeDeliveryQualified).toBe(true);
    });
  });

  describe('WELCOME20 Coupon Logic & Defect 2', () => {
    it('rejects coupon when food subtotal is below 20,000 paise', () => {
      const item199: CartItem[] = [{ productId: 'paneer-wrap', quantity: 1, product: PRODUCTS['paneer-wrap'] }]; // 19900 paise
      const res = calculateOrder(item199, 'WELCOME20', 'fixed');

      expect(res.subtotalPaise).toBe(19900);
      expect(res.discountPaise).toBe(0);
      expect(res.isCouponApplied).toBe(false);
      expect(res.couponError).toContain('Food subtotal must be at least ₹200.00');
    });

    it('applies 20% discount and enforces 10,000 paise cap in FIXED mode', () => {
      // Cart subtotal: 60,000 paise. 20% is 12,000 paise. Capped at 10,000 paise.
      const items: CartItem[] = [
        { productId: 'family-combo', quantity: 2, product: PRODUCTS['family-combo'] }, // 59800
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] }, // 200
      ];
      const res = calculateOrder(items, 'WELCOME20', 'fixed');

      expect(res.subtotalPaise).toBe(60000);
      expect(res.discountPaise).toBe(10000); // Capped at Rs 100
      expect(res.isCouponApplied).toBe(true);
      expect(res.totalPaise).toBe(50000); // 60000 - 10000 + 0 delivery
    });

    it('in BUGGY mode (Defect 2): ignores the 10,000 paise discount cap', () => {
      // Cart subtotal: 60,000 paise. 20% is 12,000 paise.
      const items: CartItem[] = [
        { productId: 'family-combo', quantity: 2, product: PRODUCTS['family-combo'] },
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] },
      ];
      const res = calculateOrder(items, 'WELCOME20', 'buggy');

      expect(res.subtotalPaise).toBe(60000);
      expect(res.discountPaise).toBe(12000); // Defect 2: 12,000 paise (Rs 120), no cap applied!
      expect(res.isCouponApplied).toBe(true);
      expect(res.totalPaise).toBe(48000); // 60000 - 12000 + 0 delivery
    });

    it('rounds half-up to nearest paise', () => {
      // Subtotal: 20003 paise -> 20% = 4000.6 -> 4001 paise
      const customItem: CartItem = {
        productId: 'extra-dip',
        quantity: 1,
        product: { ...PRODUCTS['extra-dip'], pricePaise: 20003 },
      };
      const res = calculateOrder([customItem], 'WELCOME20', 'fixed');
      expect(res.discountPaise).toBe(4001);
    });

    it('returns error on unknown coupon codes', () => {
      const items: CartItem[] = [{ productId: 'paneer-wrap', quantity: 2, product: PRODUCTS['paneer-wrap'] }];
      const res = calculateOrder(items, 'INVALID50', 'fixed');
      expect(res.isCouponApplied).toBe(false);
      expect(res.couponError).toContain('Invalid coupon code "INVALID50"');
    });
  });

  describe('Checkout Eligibility & Defect 3', () => {
    it('blocks checkout on empty cart in both scenarios', () => {
      const fixedRes = calculateOrder([], null, 'fixed');
      expect(fixedRes.isCheckoutAllowed).toBe(false);
      expect(fixedRes.checkoutBlockedReason).toContain('empty');

      const buggyRes = calculateOrder([], null, 'buggy');
      expect(buggyRes.isCheckoutAllowed).toBe(false);
      expect(buggyRes.checkoutBlockedReason).toContain('empty');
    });

    it('in FIXED mode: allows checkout on any subtotal (no minimum order)', () => {
      const items: CartItem[] = [{ productId: 'veg-burger', quantity: 1, product: PRODUCTS['veg-burger'] }]; // 9900 paise
      const res = calculateOrder(items, null, 'fixed');

      expect(res.subtotalPaise).toBe(9900);
      expect(res.isCheckoutAllowed).toBe(true);
      expect(res.checkoutBlockedReason).toBeNull();
    });

    it('in BUGGY mode (Defect 3): rejects checkout if subtotal is below 19,900 paise', () => {
      // 1 Veg Burger = 9900 paise < 19900 paise -> blocked!
      const itemsVeg: CartItem[] = [{ productId: 'veg-burger', quantity: 1, product: PRODUCTS['veg-burger'] }];
      const resBlocked = calculateOrder(itemsVeg, null, 'buggy');

      expect(resBlocked.subtotalPaise).toBe(9900);
      expect(resBlocked.isCheckoutAllowed).toBe(false); // Defect 3: blocked!
      expect(resBlocked.checkoutBlockedReason).toContain('Minimum food subtotal of ₹199.00 required');

      // 1 Paneer Wrap = 19900 paise >= 19900 paise -> allowed!
      const itemsPaneer: CartItem[] = [{ productId: 'paneer-wrap', quantity: 1, product: PRODUCTS['paneer-wrap'] }];
      const resAllowed = calculateOrder(itemsPaneer, null, 'buggy');

      expect(resAllowed.subtotalPaise).toBe(19900);
      expect(resAllowed.isCheckoutAllowed).toBe(true);
      expect(resAllowed.checkoutBlockedReason).toBeNull();
    });
  });

  describe('The 5 Specified Validation Fixtures', () => {
    it('Fixture 1: 2 Margherita Pizzas = Rs 498 without coupon', () => {
      const items: CartItem[] = [{ productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] }];

      // Fixed: delivery Rs 40; total Rs 538
      const fixed = calculateOrder(items, null, 'fixed');
      expect(fixed.subtotalPaise).toBe(49800);
      expect(fixed.deliveryPaise).toBe(4000);
      expect(fixed.discountPaise).toBe(0);
      expect(fixed.totalPaise).toBe(53800);
      expect(fixed.isCheckoutAllowed).toBe(true);

      // Buggy: delivery Rs 40; total Rs 538
      const buggy = calculateOrder(items, null, 'buggy');
      expect(buggy.subtotalPaise).toBe(49800);
      expect(buggy.deliveryPaise).toBe(4000);
      expect(buggy.discountPaise).toBe(0);
      expect(buggy.totalPaise).toBe(53800);
      expect(buggy.isCheckoutAllowed).toBe(true);
    });

    it('Fixture 2: 2 Margherita Pizzas + 1 Extra Dip = Rs 499 without coupon', () => {
      const items: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 1, product: PRODUCTS['extra-dip'] },
      ];

      // Fixed delivery Rs 0; total Rs 499
      const fixed = calculateOrder(items, null, 'fixed');
      expect(fixed.subtotalPaise).toBe(49900);
      expect(fixed.deliveryPaise).toBe(0);
      expect(fixed.totalPaise).toBe(49900);
      expect(fixed.isCheckoutAllowed).toBe(true);

      // Buggy delivery Rs 40; total Rs 539 (Defect 1 demonstrated)
      const buggy = calculateOrder(items, null, 'buggy');
      expect(buggy.subtotalPaise).toBe(49900);
      expect(buggy.deliveryPaise).toBe(4000);
      expect(buggy.totalPaise).toBe(53900);
      expect(buggy.isCheckoutAllowed).toBe(true);
    });

    it('Fixture 3: 2 Margherita Pizzas + 2 Extra Dips = Rs 500 without coupon', () => {
      const items: CartItem[] = [
        { productId: 'margherita-pizza', quantity: 2, product: PRODUCTS['margherita-pizza'] },
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] },
      ];

      // Both scenarios: delivery Rs 0; total Rs 500
      const fixed = calculateOrder(items, null, 'fixed');
      expect(fixed.subtotalPaise).toBe(50000);
      expect(fixed.deliveryPaise).toBe(0);
      expect(fixed.totalPaise).toBe(50000);

      const buggy = calculateOrder(items, null, 'buggy');
      expect(buggy.subtotalPaise).toBe(50000);
      expect(buggy.deliveryPaise).toBe(0);
      expect(buggy.totalPaise).toBe(50000);
    });

    it('Fixture 4: With WELCOME20: 2 Family Combos + 2 Extra Dips = Rs 600', () => {
      const items: CartItem[] = [
        { productId: 'family-combo', quantity: 2, product: PRODUCTS['family-combo'] },
        { productId: 'extra-dip', quantity: 2, product: PRODUCTS['extra-dip'] },
      ];

      // Fixed discount Rs 100; total Rs 500
      const fixed = calculateOrder(items, 'WELCOME20', 'fixed');
      expect(fixed.subtotalPaise).toBe(60000);
      expect(fixed.discountPaise).toBe(10000); // capped at Rs 100
      expect(fixed.deliveryPaise).toBe(0);
      expect(fixed.totalPaise).toBe(50000);

      // Buggy discount Rs 120; total Rs 480 (Defect 2 demonstrated)
      const buggy = calculateOrder(items, 'WELCOME20', 'buggy');
      expect(buggy.subtotalPaise).toBe(60000);
      expect(buggy.discountPaise).toBe(12000); // uncapped Rs 120
      expect(buggy.deliveryPaise).toBe(0);
      expect(buggy.totalPaise).toBe(48000);
    });

    it('Fixture 5: 1 Veg Burger = Rs 99 without coupon', () => {
      const items: CartItem[] = [{ productId: 'veg-burger', quantity: 1, product: PRODUCTS['veg-burger'] }];

      // Fixed delivery Rs 40; total Rs 139; checkout allowed
      const fixed = calculateOrder(items, null, 'fixed');
      expect(fixed.subtotalPaise).toBe(9900);
      expect(fixed.deliveryPaise).toBe(4000);
      expect(fixed.totalPaise).toBe(13900);
      expect(fixed.isCheckoutAllowed).toBe(true);

      // Buggy checkout blocked (Defect 3 demonstrated)
      const buggy = calculateOrder(items, null, 'buggy');
      expect(buggy.subtotalPaise).toBe(9900);
      expect(buggy.deliveryPaise).toBe(4000);
      expect(buggy.isCheckoutAllowed).toBe(false);
      expect(buggy.checkoutBlockedReason).toContain('Minimum food subtotal of ₹199.00 required');
    });
  });
});
