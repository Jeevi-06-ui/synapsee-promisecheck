export type Scenario = 'fixed' | 'buggy';

export type ProductId =
  | 'veg-burger'
  | 'paneer-wrap'
  | 'margherita-pizza'
  | 'family-combo'
  | 'extra-dip';

export interface Product {
  id: ProductId;
  name: string;
  pricePaise: number;
  description: string;
  category: 'mains' | 'combos' | 'sides';
  imageUrl: string;
  badge?: string;
  isVegetarian?: boolean;
}

export interface CartItem {
  productId: ProductId;
  quantity: number;
  product: Product;
}

export interface CalculationResult {
  subtotalPaise: number;
  discountPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  isCouponApplied: boolean;
  couponCode: string | null;
  couponError: string | null;
  isCheckoutAllowed: boolean;
  checkoutBlockedReason: string | null;
  freeDeliveryThresholdPaise: number;
  freeDeliveryQualified: boolean;
  savingsPaise: number;
}

