# PromiseCheck: Hackathon Submission Form Draft

**Team:** Synapsee  
**Component:** `apps/promisecheck/submission/SUBMISSION_FORM_DRAFT.md`  

---

## 1. Project Information

- **Project Title**: PromiseCheck
- **Short Tagline (under 120 characters)**: Autonomous web agent auditor that verifies whether e-commerce storefronts strictly honor their published commercial promises.
- **Project Category**: Developer Tools / AI Agents / E-Commerce QA & Compliance
- **Public Storefront URL**: `https://synapsee-promisecheck.vercel.app`
- **GitHub Repository URL**: `https://github.com/Jeevi-06-ui/synapsee-promisecheck`
- **Primary Working Branch**: `feature/promisecheck`

---

## 2. Team Information

- **Team Name**: Synapsee
- **Institution**: Presidency University, Bengaluru
- **Department**: Department of Computer Science & Engineering (CSE)

### Team Members
1. **Jeevith P**
   - **Role**: Team Leader, PromiseCheck Developer & System Integration
   - **Primary Focus**: TinyFish integration, rules engine, dashboard server, CLI, and end-to-end orchestration
   - **Email / Student ID**: *[To be provided by user upon official portal submission]*
2. **Neha Ashok**
   - **Role**: Café Website & Frontend Experience
   - **Primary Focus**: Synapsee Café web application on Vercel, dual runtime scenarios (`buggy` vs `fixed`), semantic DOM test hooks
   - **Email / Student ID**: *[To be provided by user upon official portal submission]*
3. **Likitha R**
   - **Role**: Independent QA, Validation & Evidence
   - **Primary Focus**: Integration test harness, audit contract validation, and compliance evidence review
   - **Email / Student ID**: *[To be provided by user upon official portal submission]*

---

## 3. Short Description (150 Words)

Online stores make explicit commercial commitments to shoppers every day: free delivery thresholds, promotional coupon discounts, and no-minimum-order policies. However, subtle off-by-one errors in checkout logic, uncapped coupon calculations, or unintended minimum-order gates frequently violate these promises without merchant awareness.

PromiseCheck bridges the gap between advertised offers and checkout reality. Built with Node.js and powered by TinyFish cloud browser agents, PromiseCheck autonomously visits public storefronts as an ordinary customer. It establishes clean shopping carts, adds edge-case product combinations, inputs promotional codes, and reads visible order summaries.

The engine deterministically calculates expected totals using integer paise arithmetic and flags any discrepancies—such as delivery overcharges, discount-rule violations, or blocked checkouts. PromiseCheck delivers a complete local web dashboard, tamper-evident evidence logs, and Before/After retest reconciliation without requiring merchant database access or privileged APIs.

---

## 4. Long Description / Technical Narrative (500 Words)

### Background & Motivation
Modern e-commerce architectures increasingly decouple marketing banners from backend checkout logic. Promotional teams publish offers such as "Free delivery on orders ₹499+" or "20% off up to ₹100 with code WELCOME20". However, checkout microservices often contain subtle software defects:
- An inequality check written as `> 499` instead of `>= 499` unlawfully charges customers who hit the exact advertised threshold.
- Promotional engines that omit discount caps give away excess margin on large orders.
- Leftover testing logic falsely blocks low-value orders from checking out.

Traditional synthetic monitoring pings endpoints or scans static HTML for keyword presence, completely missing dynamic pricing calculations. Manual testing across edge cases is slow, expensive, and unscalable.

### How PromiseCheck Works
PromiseCheck solves this through an autonomous, black-box audit workflow:
1. **Offer Review & Confirmation**: The auditor or merchant confirms published business conditions in the local dashboard.
2. **Autonomous Cloud Navigation**: PromiseCheck dispatches TinyFish cloud browser agents via the official TinyFish Agent API (`X-API-Key`). TinyFish operates a remote headless Chromium browser, navigating through visible DOM elements without brittle CSS selectors.
3. **Customer Journey Execution**: The agent enters the store, verifies that the cart is completely cleared, adds precise items (e.g. 2 Margherita Pizzas + 1 Extra Dip = ₹499), applies coupons (e.g. `WELCOME20`), and records the visible order summary. The agent strictly halts before submitting orders or payment.
4. **Deterministic Evaluation**: Observations are transmitted back to the local PromiseCheck engine. Expected values are computed deterministically in code using integer paise math (1 INR = 100 paise) with explicit half-up rounding. The LLM is never asked to perform arithmetic.
5. **Verdicts & Evidence**: Observations are validated against strict criteria (clean cart verified, exact quantities confirmed, text matches numeric amounts). If an amount differs from the confirmed rule, PromiseCheck flags an explicit commercial discrepancy.

### Demonstration & Verification
Using our publicly hosted restaurant storefront, Synapsee Café (`https://synapsee-promisecheck.vercel.app`), PromiseCheck verifies 5 critical customer journeys across both `buggy` and `fixed` runtime scenarios:
- **Delivery Thresholds**: Validates ₹498 (standard ₹40 fee), ₹499 (detects the ₹40 overcharge in buggy mode), and ₹500 (free delivery).
- **Coupon Caps**: Validates ₹600 cart with `WELCOME20` (detects the uncapped ₹120 discount in buggy mode vs the ₹100 cap).
- **Minimum Order**: Validates ₹99 Veg Burger (detects rogue checkout block in buggy mode).

PromiseCheck provides a polished local web dashboard (`http://127.0.0.1:4004`), an automated 35-test offline suite, Before/After retest reconciliation, and exportable audit evidence.

---

## 5. Portal Form Fields & Missing Information Checklist

When filling out the official hackathon organizer submission portal, please supply the following team-specific identifiers:
- [ ] Official Hackathon Team Registration ID
- [ ] Official Portal Submission URL / Portal Name
- [ ] Registered Student Email Addresses for Jeevith P, Neha Ashok, and Likitha R
- [ ] Video Demonstration Link (e.g. YouTube / Loom / Google Drive link if required by organizer)
- [ ] Presentation Slide Deck PDF / Link (exported from `SLIDE_OUTLINE.md`)

