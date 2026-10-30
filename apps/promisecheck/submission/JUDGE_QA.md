# PromiseCheck: Judge Q&A & Technical Defense

**Team:** Synapsee | Presidency University, Bengaluru  
**Component:** `apps/promisecheck/submission/JUDGE_QA.md`  

---

### Q1: Why use TinyFish instead of traditional scrapers or Playwright/Selenium?
**Answer:**
Traditional scrapers (like Cheerio, BeautifulSoup, or curl) only fetch static HTML. They cannot interact with client-side SPAs, trigger interactive counter buttons, apply coupons dynamically, or navigate complex checkout state transitions.

While tools like Playwright or Cypress can automate browsers, they require brittle, hardcoded CSS/XPath selectors that break whenever the merchant updates their frontend markup. **TinyFish** provides an autonomous web agent API with an integrated headless cloud browser. It understands natural language interaction goals (e.g. *"add two Margherita Pizzas, verify counter updates, apply coupon WELCOME20"*), autonomously handles dynamic DOM updates, and extracts structured output schemas without maintaining fragile local browser infrastructure or proxy pools.

---

### Q2: How is this different from checking page keywords?
**Answer:**
A keyword check merely inspects whether a string like *"Free delivery on orders ₹499+"* appears on a webpage. In fact, both our `buggy` and `fixed` storefronts show the **exact same advertised text banner** on the homepage!

A keyword scanner would declare both sites 100% compliant. PromiseCheck tests the **actual transactional reality**: it enters the checkout funnel, constructs edge-case shopping carts (e.g. exactly ₹499), and inspects what the pricing engine actually charges. This catches runtime implementation bugs that keyword scanners are blind to.

---

### Q3: Which parts of PromiseCheck are deterministic, and which parts use AI?
**Answer:**
We strictly separate probabilistic observation from deterministic evaluation:
- **Autonomous Observation (TinyFish)**: TinyFish is responsible for navigating the website, clicking buttons, handling UI timing, and reading displayed text.
- **Deterministic Evaluation (PromiseCheck Core)**: The language model is **never** asked to do arithmetic. Expected subtotal, discount, delivery fee, and totals are computed in pure Node.js code using **integer paise** (1 INR = 100 paise) and explicit half-up rounding.
- **Verdict Generation**: Verdicts (`PASS`, `MISMATCH`, `INCONCLUSIVE`) are computed via mathematical comparison operators in code (`observed.delivery === expected.delivery`). The scenario name (`buggy` vs `fixed`) does not determine the verdict.

---

### Q4: What happens when the browser agent fails or returns incomplete data?
**Answer:**
PromiseCheck enforces a strict evidence validation contract before accepting an observation:
1. **Clean-Cart Check**: If the agent did not explicitly verify that the cart was cleared, the run is flagged `INCONCLUSIVE`.
2. **Cart Identity Verification**: If the reported items or quantities do not match the test plan, the observation is rejected.
3. **Displayed Text Consistency**: If a reported numeric amount does not match the actual displayed string on the page (e.g. numeric 40 vs displayed text "₹40.00"), the run is rejected.
4. **Agent Status Distinction**: A provider status of `COMPLETED` is not accepted as proof of compliance; only validated assertions decide the verdict.
5. **Recovery**: If a run times out or network drops, the backend preserves the `run_id`, allowing the operator to resume without paying for duplicate runs.

---

### Q5: What has been tested and verified so far?
**Answer:**
1. **Automated Offline Test Suite**: 35 unit and integration tests passing in `apps/promisecheck/test/` covering boundary thresholds, coupon rules, rounding, minimum order eligibility, SSRF protection, path traversal security, and REST endpoints.
2. **Real TinyFish Live Audit**: Executed a full live cloud run (`run_id: 989f0f0e-62ee-451c-841a-26c4697a06b0`) on 2026-10-30 verifying the delivery threshold overcharge across 31 recorded browser steps.
3. **Simulated Multi-Journey Demonstrations**: Verified all 5 customer journeys (`D498`, `D499`, `D500`, `C600`, `M099`), confirming that the 3 deliberate defects are detected on buggy mode and confirmed resolved on fixed mode.
4. **Local Web Dashboard**: End-to-end testing of the local web server at `http://127.0.0.1:4004`.

---

### Q6: What cannot be verified or is out of scope?
**Answer:**
- **No Real Payments or Order Submissions**: PromiseCheck deliberately halts before placing final orders or submitting payment details to prevent unauthorized transactions.
- **Demonstration Scope**: The prototype is tailored to the Synapsee Café demonstration contract; arbitrary third-party e-commerce platforms with unpredictable authentication, CAPTCHAs, or multi-step checkout modals are not claimed as supported without custom journey definitions.
- **Provider Link Expiry**: Cloud screenshot links expire after ~15 minutes per TinyFish API policies.

---

### Q7: How could the product expand in the future?
**Answer:**
1. **Automated Offer Discovery**: Using vision models to scan promotional banners, newsletters, and Instagram ads, automatically generating journey contracts.
2. **Scheduled CI/CD Gate**: Running PromiseCheck in GitHub Actions as a staging release gate before deploying e-commerce checkout changes.
3. **Multi-Region Geolocation Audits**: Auditing localized delivery fees across different postal codes using TinyFish proxy controls.
4. **Multi-Platform Support**: Expanding adapter profiles to standard platforms like Shopify, WooCommerce, and Magento.

---

### Q8: What are the operational limitations and metered costs?
**Answer:**
TinyFish cloud runs are metered API operations that consume credits per step and browser duration. To ensure cost predictability and test safety:
- Automated tests (`npm test`) run entirely offline using synthetic mocks and fixtures.
- The dashboard supports an explicit **Simulated Mode** that exercises the full UI without spending API credits.
- Concurrency locks prevent duplicate simultaneous paid runs from repeated clicks.
- Live runs are strictly opt-in and triggered explicitly by the operator.

