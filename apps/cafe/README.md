# Synapsee Café — Demonstration Restaurant Website

> **Fictional demonstration restaurant** created for the **PromiseCheck** hackathon project (Team Synapsee, Department of CSE, Presidency University, Bengaluru).

Synapsee Café serves as the live target website visited by PromiseCheck's automated TinyFish crawler to inspect offers, construct carts, and compare advertised commercial rules against real checkout behavior.

---

## 🛠️ Stack & Architecture

- **Framework**: React 19, TypeScript, Vite
- **Routing**: Client-side routing with `react-router-dom`
- **Design System**: Warm cream background (`#FBF8F1`), deep forest green typography (`#163829`), vibrant orange accents (`#E05A2B`), responsive CSS grid, accessible ARIA attributes, and reduced-motion support
- **State Management**: Zero backend or database required; state is managed via React Context and synchronized with browser storage (`sessionStorage` and `localStorage`)
- **Testing**: Vitest with `@testing-library/react` and `jsdom`

---

## 🚀 Quick Start & Scripts

All commands must be executed within the `apps/cafe` directory:

```bash
cd apps/cafe
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5173`.

### 3. Run Test Suite
```bash
npm test
```
Runs all 25 unit and integration tests (calculation boundary checks, defect verifications, and UI interaction tests).

### 4. Build for Production
```bash
npm run build
```
Generates a type-checked, optimized production bundle inside `apps/cafe/dist/`.

### 5. Preview Production Build
```bash
npm run preview
```
Serves the `dist/` directory locally at `http://localhost:4173`.

---

## 🧭 Routes & Deep Links

| Route | Description | Key Automation Identifiers |
|---|---|---|
| `/` | Landing page, hero, featured products, and offer banner | `home-offers-banner` |
| `/menu` | Full menu of all 5 items with category filters | `menu-product-list`, `add-to-cart-*` |
| `/offers` | Exact advertised offer wording and terms | `offer-free-delivery`, `offer-welcome20` |
| `/cart` | Item quantity stepper, line subtotals, clear cart, coupon entry | `cart-items-list`, `coupon-input`, `apply-coupon-btn` |
| `/checkout` | Itemised review, simulated address & payment, demo submission | `checkout-items-list`, `place-demo-order-btn` |
| `/demo-controls` | Presenter scenario switcher, defect table, and 1-click fixture loaders | `select-scenario-fixed`, `select-scenario-buggy` |

---

## 🎭 Dual Runtime Scenarios

Synapsee Café supports two reproducible scenarios:

### 1. Fixed Scenario (`fixed`)
- Follows all advertised promises strictly.
- Free delivery awarded when food subtotal $\ge$ 49,900 paise (₹499.00).
- Coupon `WELCOME20` awards 20% discount on food subtotal $\ge$ 20,000 paise (₹200.00), strictly capped at 10,000 paise (₹100.00).
- No minimum order required for checkout.

### 2. Buggy Scenario (`buggy`)
Contains exactly **3 deliberate business defects** for automated discovery by PromiseCheck:
1. **Free Delivery Defect**: Checks strictly `subtotal > 49900` instead of `>= 49900`. At exactly ₹499.00, standard delivery fee of ₹40.00 is charged.
2. **Coupon Cap Defect**: Calculates 20% discount on orders $\ge$ ₹200.00 but ignores the ₹100.00 (10,000 paise) cap.
3. **Minimum Order Defect**: Erroneously rejects checkout if food subtotal is below 19,900 paise (₹199.00), preventing small orders like Veg Burger (₹99.00).

### Direct Scenario Entry URLs
You can deep-link into any scenario on initial page load:
- Fixed mode: `http://localhost:5173/?scenario=fixed`
- Buggy mode: `http://localhost:5173/?scenario=buggy`
*(Unknown scenario query parameters default to `fixed`)*

---

## 🌐 Static Hosting & Deep-Link Routing Instructions

When deploying the `dist` folder to static web hosts, client-side routes (e.g. `/menu`, `/checkout`) must be redirected to `index.html`:

- **Netlify**: An automatic `_redirects` file (`/* /index.html 200`) is located in `public/` and copied to `dist/`.
- **Vercel**: Add `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **GitHub Pages**: A fallback `404.html` is provided in `public/` that redirects navigation to `index.html` while preserving query parameters and pathnames.
- **Nginx**:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```

---

## 👥 Team Synapsee
- **Neha Ashok** — Café Website & Frontend Experience (Department of CSE, Presidency University)
- **Jeevith P** — Team Leader
- **Likitha R** — QA & Validation

