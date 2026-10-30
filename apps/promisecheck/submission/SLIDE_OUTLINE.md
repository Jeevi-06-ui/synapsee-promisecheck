# PromiseCheck: Hackathon Slide Deck Outline (10 Slides)

**Team:** Synapsee | Department of CSE, Presidency University, Bengaluru  
**Project:** PromiseCheck: Autonomous Commercial Verification Engine  
**Target URL:** `https://synapsee-promisecheck.vercel.app`  

---

### Slide 1: Title & Team
- **Title**: PromiseCheck
- **Subtitle**: Autonomous Commercial Offer Verification Powered by TinyFish Cloud Browser Agents
- **Team Synapsee**:
  - Jeevith P (Team Leader, PromiseCheck Developer & System Integration)
  - Neha Ashok (Café Website & Frontend Experience)
  - Likitha R (Independent QA, Validation & Evidence)
- **Institution**: Department of CSE, Presidency University, Bengaluru

---

### Slide 2: The Problem: Commercial Promises vs. Checkout Reality
- **The Gap**: Retailers publish explicit promises (free delivery thresholds, coupon discounts, no minimum orders).
- **The Failure Mode**: Complex pricing engines, cart states, and discount rules often have subtle defects:
  - Strict inequality instead of inclusive threshold (`> ₹499` vs `>= ₹499`).
  - Missing percentage discount caps (giving away excess discount).
  - Rogue checkout blocks preventing paying customers from completing orders.
- **Why Traditional Tools Fail**: Synthetic pings only test server uptime; static keyword scanners cannot test interactive dynamic cart calculations.

---

### Slide 3: The Solution: PromiseCheck
- **Core Concept**: An autonomous auditor that tests e-commerce storefronts from the outside, exactly like a real customer.
- **Key Workflow**:
  1. Capture and confirm merchant promises.
  2. Dispatch TinyFish cloud browser agents to execute edge-case shopping carts.
  3. Extract real displayed checkout amounts.
  4. Deterministically evaluate observations against mathematical ground truth.
- **Zero-Coupling Advantage**: Requires no merchant backend access, private SDKs, or shared databases.

---

### Slide 4: TinyFish’s Autonomous Role
- **Why TinyFish?**
  - Cloud-hosted headless Chromium browser running on serverless infrastructure.
  - Understands natural language interaction goals without fragile CSS selectors.
  - Autonomously clears carts, handles asynchronous item count updates, and applies promo codes.
  - Extracts structured observation schemas (`output_schema`) and captures action trace steps with screenshots.
- **Black-Box Integrity**: Interacts purely through public storefront DOM controls.

---

### Slide 5: System Architecture & Data Flow
- **Visual Diagram**:
  - Storefront: Synapsee Café hosted on Vercel (`/?scenario=buggy` vs `/?scenario=fixed`).
  - Remote Agent: TinyFish Cloud Agent operating headless browser sessions.
  - Auditor Machine: Local Node.js engine and dashboard (`http://127.0.0.1:4004`).
- **Deterministic Math Engine**: All currency math calculated in integer paise with explicit half-up rounding (LLMs are never asked to do arithmetic).
- **Security**: Complete API key redaction, SSRF loopback protections, and path traversal defenses.

---

### Slide 6: Three Detected Commercial Defects (Synapsee Café Demo)
- **Defect 1: Delivery Threshold Overcharge (Journey D499 - ₹499 cart)**
  - *Promise*: Free delivery on orders ₹499+.
  - *Buggy Result*: Charges ₹40 delivery because code strictly checks `> 499`.
  - *Verdict*: 🔴 **DELIVERY OVERCHARGE DETECTED** (+₹40 discrepancy).
- **Defect 2: Uncapped Coupon Discount (Journey C600 - ₹600 cart + WELCOME20)**
  - *Promise*: 20% off capped at ₹100.
  - *Buggy Result*: Applies raw 20% (₹120 discount), ignoring the ₹100 cap.
  - *Verdict*: 🔴 **DISCOUNT-RULE VIOLATION** (+₹20 merchant margin loss).
- **Defect 3: Rogue Minimum Order Block (Journey M099 - ₹99 Veg Burger)**
  - *Promise*: No minimum order amount required.
  - *Buggy Result*: Blocks checkout claiming ₹199 minimum required.
  - *Verdict*: 🔴 **CHECKOUT ELIGIBILITY VIOLATION**.

---

### Slide 7: Verified Results & Evidence
- **Real Provider Run**: Provider Run ID `989f0f0e-62ee-451c-841a-26c4697a06b0` executed on 2026-10-30 across 31 recorded steps.
- **Automated Test Suite**: 35 passing unit and integration tests running in ~2.1 seconds.
- **Before / After Retest Reconciliation**:
  - Side-by-side comparison table clearly confirms all 3 defects transition to **CORRECTED IN FIXED SCENARIO**.
- **Immutable Evidence**: Saved to local JSON with action logs, timestamps, and exportable PDF reports.

---

### Slide 8: Execution Modes & Offline Failsafe
- **Triple-Mode Flexibility**:
  1. *Live Mode*: Metered TinyFish cloud browser execution for live audits.
  2. *Simulated Mode*: Deterministic fixture provider with realistic step progression, labeled `SIMULATED — NOT A LIVE AUDIT`.
  3. *Recorded Mode*: Replays saved historical evidence with immutable provenance for reliable presentations.
- **Concurrency Protection**: Single active audit lock prevents duplicate paid executions.

---

### Slide 9: Limitations & Future Expansion
- **Current Demonstration Boundaries**:
  - Tailored to the Synapsee demonstration restaurant specification.
  - Screenshot links expire after ~15 minutes per TinyFish API policies.
  - Does not execute real financial payments or submit final orders.
- **Future Roadmap**:
  - Automated vision-based offer extraction from promotional banners and social media.
  - CI/CD deployment release gate for e-commerce checkouts.
  - Multi-region proxy auditing for localized delivery fee verification.

---

### Slide 10: Conclusion & Live Demonstration
- **PromiseCheck Summary**: Autonomous, evidence-backed commercial compliance auditing powered by TinyFish.
- **Project Links**:
  - Public Demonstration Storefront: `https://synapsee-promisecheck.vercel.app`
  - GitHub Repository: `https://github.com/Jeevi-06-ui/synapsee-promisecheck`
  - Local Dashboard: `http://127.0.0.1:4004`
- **Closing Thought**: Protecting brand trust and merchant margins by verifying that every promise advertised is a promise kept.

