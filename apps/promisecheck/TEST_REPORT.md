# PromiseCheck Automated Test Suite Report

**Engine:** Node.js Test Runner (`node --test`)  
**Date:** 2026-10-30  
**Test Suite Path:** `apps/promisecheck/test/`  
**Total Tests:** 35 Passing (0 Failed, 0 Skipped, 0 Regressions)  
**Execution Time:** ~2.1 seconds  

---

## 1. Test Suite Summary

| Test File | Total Tests | Status | Scope |
| :--- | :---: | :---: | :--- |
| `test/delivery-audit.test.js` | 8 | ✅ All Pass | Original delivery audit, credentials redaction, run resumption, public URL validation. |
| `test/rules-and-evaluation.test.js` | 15 | ✅ All Pass | Delivery boundaries (₹498, ₹499, ₹500), coupon eligibility, rounding, minimum order, dirty cart rejection. |
| `test/job-runner-and-server.test.js` | 12 | ✅ All Pass | Concurrency lock, path traversal safety, simulated labels, dashboard HTTP endpoints, Before/After retest. |

---

## 2. Granular Test Breakdown

### A. Delivery Boundaries & Threshold Mechanics (`rules-and-evaluation.test.js`)
- `✔ delivery boundary Rs 498 charges standard delivery fee (Rs 40)`: Verifies subtotal ₹498 charges standard ₹40 delivery in both scenarios.
- `✔ delivery boundary Rs 499 awards free delivery (Rs 0) with inclusive threshold`: Verifies inclusive ₹499 boundary yields ₹0 delivery.
- `✔ delivery boundary Rs 500 awards free delivery (Rs 0)`: Verifies threshold clearance above boundary.

### B. Promotional Coupons & Discount Caps (`rules-and-evaluation.test.js`)
- `✔ coupon WELCOME20 is rejected below Rs 200 threshold`: Validates that ₹199 cart triggers explicit coupon subtotal error.
- `✔ coupon WELCOME20 applies at Rs 200 threshold`: Verifies ₹200 cart receives exact 20% discount (₹40.00).
- `✔ coupon cap strictly limits discount to Rs 100 on Rs 600 cart`: Validates that raw ₹120 discount is capped at ₹100.
- `✔ coupon discount rounds half-up to nearest paise`: Validates 0.5 paise rounds up (e.g. 24928 * 0.20 = 4985.6 -> 4986 paise).
- `✔ coupon cap excess is explained as discount-rule violation`: Ensures uncapped discount is reported as a discount-rule violation, not an overcharge.

### C. Minimum-Order & Cart Cleanliness (`rules-and-evaluation.test.js`)
- `✔ minimum-order policy allows Rs 99 Veg Burger checkout in fixed mode`: Validates no false minimum order checkout blocks.
- `✔ empty cart blocks checkout`: Validates that 0 items properly restricts checkout progression.
- `✔ missing clean-cart confirmation makes evidence inconclusive`: Rejects observations where cart was not verified empty prior to testing.
- `✔ evaluator rejects mismatched item identity or count`: Flags observations reporting wrong products or quantities.
- `✔ scenario name cannot select verdict`: Confirms verdict is derived purely from mathematical comparison, never the URL parameter string.

### D. Security, Concurrency & Persistence (`job-runner-and-server.test.js`)
- `✔ duplicate submissions are rejected when an audit is active`: Proves single-audit lock prevents concurrent runs (HTTP 409).
- `✔ no live-to-simulation fallback`: Proves missing API key in live mode fails explicitly with zero silent simulation fallback.
- `✔ simulated runs are explicitly labelled SIMULATED — NOT A LIVE AUDIT`: Proves simulated output carries required regulatory notice.
- `✔ interrupted jobs are reconciled and marked on startup`: Proves server restart reconciles running jobs into `INTERRUPTED`.
- `✔ evidence-file access protects against path traversal`: Proves traversal attacks (`../../../etc/passwd`) are rejected.
- `✔ before/after retest comparison pairs identical journeys across scenarios`: Validates automated side-by-side defect resolution tracking.

### E. Dashboard HTTP Endpoints (`job-runner-and-server.test.js`)
- `✔ GET / serves accessible dashboard HTML`: Checks HTML markup, branding, and accessibility.
- `✔ GET /api/config returns system info without leaking credentials`: Confirms API key is never leaked in plaintext.
- `✔ GET /api/journeys returns all 5 test journeys`: Validates journey catalog endpoints.
- `✔ POST /api/rules/confirm updates and persists confirmed rules`: Validates owner rules confirmation workflow.
- `✔ POST /api/audit/start initiates simulated audit and provides progress status`: Tests full background worker polling.
- `✔ GET /api/history returns recorded audit runs and printable report`: Tests report generation and export.

---

## 3. Verification Command

```bash
cd apps/promisecheck
npm test
```
All 35 tests run in ~2.1s with 100% pass rate.

