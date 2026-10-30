# HANDOFF: Synapsee Café Demonstration Website

**Author:** Neha Ashok (Café Website and Frontend Experience)  
**Team:** Synapsee (Department of CSE, Presidency University, Bengaluru)  
**Recipients:** Jeevith P (Team Leader), Likitha R (QA and Validation)  
**Project:** PromiseCheck Hackathon  

---

## 1. Overview & Project Objectives

Synapsee Café is an interactive demonstration restaurant web application built specifically for the PromiseCheck hackathon project. PromiseCheck utilizes automated TinyFish agents to inspect advertised offers on the café website, programmatically assemble shopping carts across boundary values, and verify whether actual checkout behavior matches advertised commercial commitments.

Key characteristics:
- **Zero Backend / Zero AI Dependency:** 100% deterministic pure calculation engine running entirely in React and browser storage.
- **Dual Runtime Scenarios:** Toggle between **Fixed** (100% rule-compliant) and **Buggy** (contains exactly 3 deliberate business defects).
- **Automation-Ready:** Built with semantic HTML, stable `data-testid` hooks, accessible ARIA labels, and keyboard navigability.
- **Strictly Fictional:** Clear simulation banners and notices ensure no real payment, order processing, or personal data collection.

---

## 2. Routes & Automation UI Labels

Every route is wired with semantic tags and stable selectors for DOM inspection by TinyFish:

| Route Path | Page Title | Primary Functional UI Labels & Test IDs |
|---|---|---|
| `/` | Home | `home-offers-banner`, `food-card-*`, `nav-cart-btn`, `scenario-pill` |
| `/menu` | Menu | `menu-product-list`, `add-to-cart-*`, `food-price-*`, `qty-increase-*`, `qty-decrease-*` |
| `/offers` | Offers & Rules | `offer-free-delivery`, `offer-welcome20`, coupon copy button |
| `/cart` | Cart | `cart-items-list`, `cart-item-*`, `cart-qty-value-*`, `clear-cart-btn`, `order-summary` |
| `/checkout` | Checkout | `checkout-items-list`, `place-demo-order-btn`, `checkout-page-blocked-notice` |
| `/demo-controls` | Demo Controls | `select-scenario-fixed`, `select-scenario-buggy`, `load-fixture-1-btn` through `load-fixture-5-btn` |

### Core Calculation DOM Identifiers (`OrderSummary.tsx`)
- `data-testid="subtotal-amount"`: Food subtotal before coupon in paise format (e.g., `₹499.00`)
- `data-testid="discount-amount"`: Applied discount amount (e.g., `-₹100.00` or `₹0.00`)
- `data-testid="delivery-amount"`: Delivery charge (displays `FREE` or `₹40.00`)
- `data-testid="total-amount"`: Final payable total (`Total = Subtotal - Discount + Delivery`)
- `data-testid="coupon-input"`: Coupon text input field
- `data-testid="apply-coupon-btn"`: Apply coupon button
- `data-testid="remove-coupon-btn"`: Remove applied coupon button
- `data-testid="checkout-blocked-reason"`: Descriptive reason if checkout is restricted

---

## 3. Product Catalog & Strict Quantity Bounds

All prices are stored as integer paise (INR).

| Product ID | Product Name | Price (Paise) | Price (INR) | Category | Limits |
|---|---|---|---|---|---|
| `veg-burger` | Veg Burger | 9,900 paise | ₹99.00 | Mains | 1–10 integer |
| `paneer-wrap` | Paneer Wrap | 19,900 paise | ₹199.00 | Mains | 1–10 integer |
| `margherita-pizza` | Margherita Pizza | 24,900 paise | ₹249.00 | Mains | 1–10 integer |
| `family-combo` | Family Combo | 29,900 paise | ₹299.00 | Combos | 1–10 integer |
| `extra-dip` | Extra Dip | 100 paise | ₹1.00 | Sides | 1–10 integer |

*Extra Dip is an ordinary visible selectable item on the menu, enabling testing of single-rupee threshold transitions.*

---

## 4. Scenario Behaviors & The 3 Deliberate Defects

### URL Entry Handling
- Entry URLs: `/?scenario=fixed` or `/?scenario=buggy`
- Unrecognized or absent scenario values default safely to `fixed`.
- The URL parameter hydrates application state prior to cart synchronization.
- **Scenario Persistence:** State persists across route changes and browser refreshes using `sessionStorage` and `localStorage`.
- **Cart Reset Guarantee:** Switching between scenarios immediately clears all cart items and active coupons to ensure clean, uncontaminated test states.

### Comparison Table

| Rule | Fixed Scenario | Buggy Scenario (Deliberate Defect) |
|---|---|---|
| **Free Delivery** (Normal: ₹40.00) | Awarded when `subtotal >= 49900` paise (₹499.00). | **Defect 1:** Checks strictly `subtotal > 49900` paise. At ₹499.00, delivery is incorrectly charged as ₹40.00. |
| **WELCOME20 Coupon** (20% off $\ge$ ₹200) | `Math.min(Math.round(subtotal * 0.20), 10000)` paise (capped at ₹100.00). | **Defect 2:** Calculates 20% discount but ignores the ₹100.00 cap (uncapped). |
| **Checkout Eligibility** | Any non-empty cart is allowed for checkout (no minimum order). | **Defect 3:** Erroneously requires `subtotal >= 19900` paise. Carts under ₹199.00 (e.g. 1 Veg Burger = ₹99.00) are blocked. |

---

## 5. Validation Fixtures Results

All 5 validation fixtures specified in the project requirements were evaluated and verified:

```
Fixture 1: 2 Margherita Pizzas (₹498 subtotal, no coupon)
  - Fixed: Delivery ₹40.00 | Total: ₹538.00 | Checkout: Allowed
  - Buggy: Delivery ₹40.00 | Total: ₹538.00 | Checkout: Allowed

Fixture 2: 2 Margherita Pizzas + 1 Extra Dip (₹499 subtotal, no coupon)
  - Fixed: Delivery FREE (₹0.00) | Total: ₹499.00 | Checkout: Allowed
  - Buggy: Delivery ₹40.00 (Defect 1) | Total: ₹539.00 | Checkout: Allowed

Fixture 3: 2 Margherita Pizzas + 2 Extra Dips (₹500 subtotal, no coupon)
  - Fixed: Delivery FREE (₹0.00) | Total: ₹500.00 | Checkout: Allowed
  - Buggy: Delivery FREE (₹0.00) | Total: ₹500.00 | Checkout: Allowed

Fixture 4: 2 Family Combos + 2 Extra Dips + WELCOME20 (₹600 subtotal)
  - Fixed: Discount ₹100.00 (Capped) | Total: ₹500.00 | Checkout: Allowed
  - Buggy: Discount ₹120.00 (Defect 2 Uncapped) | Total: ₹480.00 | Checkout: Allowed

Fixture 5: 1 Veg Burger (₹99 subtotal, no coupon)
  - Fixed: Delivery ₹40.00 | Total: ₹139.00 | Checkout: Allowed
  - Buggy: Checkout Blocked! (Defect 3 - Subtotal < ₹199.00)
```

---

## 6. Test Suite & Verification Results

The test suite executed via Vitest confirms complete coverage:

- **Total Test Files:** 2 (`src/test/calc.test.ts` & `src/test/integration.test.tsx`)
- **Total Tests:** 25 passing tests (0 failures, 0 regressions)
- **Execution Time:** ~1.5 seconds

### Verified Capabilities:
1. Integer quantity sanitization (1–10 validation, fractional/negative/NaN rejection).
2. Exact boundary arithmetic for standard delivery and threshold transitions.
3. Half-up rounding on paise calculations for discount percentages.
4. Reactive recalculation of coupon eligibility upon modifying cart quantities.
5. Scenario state persistence and automatic cart purge on scenario toggling.
6. TypeScript build passes with zero compile errors under strict mode (`noUnusedLocals`, `noUnusedParameters`).

---

## 7. Static Hosting & Deployment Instructions

The production build resides in `apps/cafe/dist/`.

### Serving Options
1. **Local Preview:**
   ```bash
   cd apps/cafe
   npm run build
   npm run preview
   ```
2. **Netlify / Vercel / Cloudflare Pages:**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Client-side SPA routing rewrites are bundled automatically (`_redirects` and `404.html` in `dist`).

---

## 8. Known Limitations & Demonstration Boundaries

1. **No Real Financial Transactions:** All checkout actions conclude with simulated confirmation (`#SYN-XXXXXX`).
2. **No Persistent Database:** Orders and carts live in the client's browser storage; clearing browser cache resets local state.
3. **No Dynamic Price Adjustments:** Menu product prices and IDs are hardcoded to match the PromiseCheck specification.

