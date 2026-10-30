# PromiseCheck: Autonomous Commercial Verification Engine

**Hackathon Submission Summary**  
**Team Name:** Synapsee  
**Institution:** Presidency University, Bengaluru  
**Department:** Department of Computer Science & Engineering  

---

## 📌 One-Sentence Description
PromiseCheck deploys TinyFish autonomous cloud browser agents to execute black-box customer shopping journeys, auditing whether an e-commerce storefront strictly honours its published promotional offers, delivery thresholds, and checkout policies.

---

## 🎯 Problem Statement
Online merchants routinely publish commercial promises—such as "Free delivery on orders ₹499+", "20% off up to ₹100 with code WELCOME20", and "No minimum order required". However, checkout logic, coupon rule engines, and cart pricing thresholds frequently contain off-by-one errors, missing discount caps, or unintended checkout blocks. 

Traditional synthetic monitoring tests static endpoints or verifies simple keyword presence in HTML, which cannot detect runtime discrepancies between advertised promises and actual checkout calculations. Manual compliance testing across edge cases is expensive, slow, and infrequent.

---

## 👥 Target Users
- **E-Commerce Operations & Growth Teams**: Ensuring marketing campaigns and promo banners match actual cart charges.
- **Merchant Compliance & Legal Auditors**: Continuously verifying that consumer-facing claims are legally and contractually honored.
- **Independent QA Engineers**: Automating end-to-end black-box verification without needing backend database access or internal APIs.

---

## 💡 Solution
PromiseCheck bridges advertised commitments and checkout reality. Rather than relying on static code analysis or internal calculations, PromiseCheck:
1. Captures published commercial rules and presents them for owner review and confirmation.
2. Dispatches **TinyFish cloud browser agents** to visit the live website as an ordinary customer.
3. Instructs the agent to clear the cart, add specific product combinations across boundary values (e.g. ₹498, ₹499, ₹500), apply coupons, and read displayed cart amounts.
4. Deterministically evaluates observed DOM amounts against code-calculated expectations using integer paise arithmetic.
5. Flags discrepancies (such as overcharges, uncapped discounts, or improper checkout blocks) with tamper-evident step logs and run traces.

---

## 🤖 TinyFish’s Exact Role
TinyFish acts exclusively as the **remote autonomous web agent**:
- Operates a cloud-hosted headless browser session (`POST /v1/automation/run-async`).
- Interacts with visible storefront UI controls (clicking add-to-cart buttons, verifying numeric counter values, inputting coupons).
- Extracts structured DOM observations (`output_schema`) and captures action steps with screenshot URLs.
- TinyFish runs in a remote cloud datacenter; it does not share database access, private cookies, or internal APIs with the target website.

---

## ⚙️ Technical Approach
- **Zero-Coupling Monorepo**: Separates the customer website (`apps/cafe`) from the audit engine (`apps/promisecheck`).
- **Deterministic Math Engine**: All currency math is calculated in integer paise (1 INR = 100 paise) with explicit half-up rounding. The LLM is never asked to perform arithmetic.
- **Separation of Concerns**: Scenario names select which site state to visit, but verdicts are computed strictly by comparing observed numbers to expected values.
- **Triple-Mode Execution**:
  - `Live`: Real cloud execution via TinyFish Agent API (`X-API-Key`).
  - `Simulated`: Deterministic offline fixture provider with realistic step progression, clearly labeled `SIMULATED — NOT A LIVE AUDIT`.
  - `Recorded`: Historical run replay with immutable run IDs and timestamps.
- **Node.js 22+ Standard Library**: Zero external npm runtime dependencies; builds directly on built-in HTTP, timers, crypto, and test runner.

---

## 🚀 Implemented Features
1. **Delivery Boundary Suite**:
   - `D498` (₹498): Verifies standard delivery fee of ₹40 applies below threshold.
   - `D499` (₹499): Verifies inclusive free-delivery threshold (catches `> ₹499` vs `>= ₹499` defect).
   - `D500` (₹500): Verifies free delivery applies above threshold.
2. **Promotional Coupon-Cap Audit**:
   - `C600` (₹600 + `WELCOME20`): Verifies ₹100 maximum discount cap (catches uncapped 20% / ₹120 defect).
3. **Minimum-Order Eligibility Audit**:
   - `M099` (₹99 Veg Burger): Verifies no false minimum order checkout block (catches rogue ₹199 minimum order block).
4. **Local Web Dashboard**:
   - Served on `http://127.0.0.1:4004` with Navy, White, and Teal visual hierarchy.
   - Real-time progress bar, live step log, offer confirmation, retest comparison, and printable report.
5. **Before/After Retest Reconciliation**:
   - Pairs identical carts across `buggy` and `fixed` scenarios to confirm defect resolution.
6. **Safety & Security**:
   - Redacts API keys, validates public URLs against SSRF/loopbacks, enforces single-job concurrency lock, and protects history files from path traversal.

---

## 📊 Measured Verification Results
- **Automated Tests**: 35/35 passing offline tests in `apps/promisecheck/test/` (~2.1 seconds execution time).
- **Live Provider Verification**: Completed real TinyFish delivery audit (`run_id: 989f0f0e-62ee-451c-841a-26c4697a06b0`) on 2026-10-30:
  - Buggy scenario: Subtotal ₹499, Delivery ₹40, Total ₹539 -> **VIOLATED** (Discrepancy detected).
  - Fixed scenario: Subtotal ₹499, Delivery ₹0, Total ₹499 -> **HONORED** (Promise verified).
  - Provider Steps: 31 recorded action steps with screenshot links.
- **Simulated Full Suite**: All 3 deliberate merchant defects detected and reported with exact rupee differences.

---

## ⚠️ Known Limitations
- **Demonstration Scope**: Tailored for the Synapsee Café demonstration contract; arbitrary multi-page ecommerce websites are not supported out of the box.
- **Temporary Provider Links**: TinyFish screenshot and recording URLs expire after ~15 minutes per provider policy; retained run IDs preserve trace retrieval within provider windows.
- **Cloud Reachability**: TinyFish remote browsers cannot navigate to `localhost` addresses without a public tunnel (localtunnel, Cloudflare, ngrok) or public deployment.
- **Live Metered Usage**: Live runs consume TinyFish API credits; tests default to synthetic fixtures to avoid unintended costs.

---

## 👥 Team & Responsibilities
- **Jeevith P** (Team Leader, PromiseCheck & System Integration):
  - Architecture, TinyFish integration, rules engine, job runner, dashboard server, and CLI.
- **Neha Ashok** (Café Website & Frontend Experience):
  - Responsive restaurant storefront on Vercel, dual runtime scenarios (`buggy` vs `fixed`), semantic `data-testid` hooks, and calculation engine.
- **Likitha R** (Independent QA, Validation & Evidence):
  - Test specifications, contract validation, evidence review, and independent test harness.

