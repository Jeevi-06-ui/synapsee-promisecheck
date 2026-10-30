import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { CartItem, Product, ProductId, CalculationResult } from '../types';
import { calculateOrder, sanitizeQuantity } from '../utils/calc';
import { PRODUCTS } from '../data/products';
import { useScenario } from './ScenarioContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  couponCode: string | null;
  couponInput: string;
  setCouponInput: (val: string) => void;
  couponMessage: { type: 'success' | 'error'; text: string } | null;
  calculation: CalculationResult;
  addItem: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: ProductId, quantity: number) => boolean;
  incrementQuantity: (productId: ProductId) => boolean;
  decrementQuantity: (productId: ProductId) => boolean;
  removeItem: (productId: ProductId) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getItemQuantity: (productId: ProductId) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'synapsee_cafe_cart';
const COUPON_STORAGE_KEY = 'synapsee_cafe_coupon';

function loadStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validItems: CartItem[] = [];
    for (const item of parsed) {
      if (item && item.productId && PRODUCTS[item.productId as ProductId]) {
        const qty = sanitizeQuantity(item.quantity);
        if (qty !== null) {
          validItems.push({
            productId: item.productId as ProductId,
            quantity: qty,
            product: PRODUCTS[item.productId as ProductId],
          });
        }
      }
    }
    return validItems;
  } catch {
    return [];
  }
}

function loadStoredCoupon(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(COUPON_STORAGE_KEY) || localStorage.getItem(COUPON_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { scenario, registerCartResetHandler } = useScenario();
  const [items, setItems] = useState<CartItem[]>(loadStoredCart);
  const [couponCode, setCouponCode] = useState<string | null>(loadStoredCoupon);
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear cart & coupon handler (used when switching scenario or explicitly clearing cart)
  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setCouponInput('');
    setCouponMessage(null);
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Register with ScenarioContext so switching scenario automatically resets cart
  useEffect(() => {
    registerCartResetHandler(clearCart);
  }, [registerCartResetHandler, clearCart]);

  // Persist items to browser storage
  useEffect(() => {
    try {
      const serializable = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializable));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore
    }
  }, [items]);

  // Persist coupon to browser storage
  useEffect(() => {
    try {
      if (couponCode) {
        sessionStorage.setItem(COUPON_STORAGE_KEY, couponCode);
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
      } else {
        sessionStorage.removeItem(COUPON_STORAGE_KEY);
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [couponCode]);

  // Reactive calculation
  const calculation = useMemo(() => {
    return calculateOrder(items, couponCode, scenario);
  }, [items, couponCode, scenario]);

  // Sync coupon error messages if calculation invalidated an applied coupon due to cart changes
  useEffect(() => {
    if (couponCode) {
      if (calculation.couponError) {
        setCouponMessage({ type: 'error', text: calculation.couponError });
      } else if (calculation.isCouponApplied) {
        setCouponMessage({
          type: 'success',
          text: `Coupon ${couponCode} applied successfully!`,
        });
      }
    }
  }, [calculation.couponError, calculation.isCouponApplied, couponCode]);

  const addItem = useCallback((product: Product, quantity: number = 1): boolean => {
    const validQty = sanitizeQuantity(quantity);
    if (!validQty) return false;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(10, currentQty + validQty);
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            quantity: validQty,
            product,
          },
        ];
      }
    });
    return true;
  }, []);

  const updateQuantity = useCallback((productId: ProductId, quantity: number): boolean => {
    if (quantity === 0) {
      removeItem(productId);
      return true;
    }
    const validQty = sanitizeQuantity(quantity);
    if (!validQty) return false;

    setItems((prev) => {
      return prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: validQty };
        }
        return item;
      });
    });
    return true;
  }, []);

  const incrementQuantity = useCallback((productId: ProductId): boolean => {
    let success = false;
    setItems((prev) => {
      return prev.map((item) => {
        if (item.productId === productId) {
          if (item.quantity < 10) {
            success = true;
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        }
        return item;
      });
    });
    return success;
  }, []);

  const decrementQuantity = useCallback((productId: ProductId): boolean => {
    setItems((prev) => {
      const target = prev.find((i) => i.productId === productId);
      if (target && target.quantity <= 1) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
    });
    return true;
  }, []);

  const removeItem = useCallback((productId: ProductId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const applyCoupon = useCallback(
    (code: string): boolean => {
      const clean = code.trim().toUpperCase();
      if (!clean) {
        setCouponMessage({ type: 'error', text: 'Please enter a coupon code.' });
        return false;
      }

      if (clean !== 'WELCOME20') {
        setCouponMessage({ type: 'error', text: `Invalid coupon code "${clean}". Try WELCOME20.` });
        return false;
      }

      // Calculate hypothetical order with WELCOME20
      const testCalc = calculateOrder(items, clean, scenario);
      if (testCalc.couponError) {
        setCouponMessage({ type: 'error', text: testCalc.couponError });
        setCouponCode(clean); // Keep stored so if cart meets threshold later, it triggers
        return false;
      }

      setCouponCode(clean);
      setCouponMessage({ type: 'success', text: `Coupon ${clean} applied successfully!` });
      return true;
    },
    [items, scenario]
  );

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setCouponInput('');
    setCouponMessage(null);
  }, []);

  const getItemQuantity = useCallback(
    (productId: ProductId): number => {
      const found = items.find((i) => i.productId === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        couponCode,
        couponInput,
        setCouponInput,
        couponMessage,
        calculation,
        addItem,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
