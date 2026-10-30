# PromiseCheck: Safe Audit Results & Evidence Summary

**Team:** Synapsee | Presidency University, Bengaluru  
**Component:** `apps/promisecheck/submission/SAFE_RESULTS_SUMMARY.md`  
**Security Notice:** All API credentials, sensitive environment tokens, and private headers have been redacted.  

---

## 1. Verified Live Delivery Audit Run

- **Provider**: TinyFish Cloud Headless Agent (`POST https://agent.tinyfish.ai/v1/automation/run-async`)
- **TinyFish Run ID**: `989f0f0e-62ee-451c-841a-26c4697a06b0`
- **Recorded Timestamp**: 2026-10-30T08:32:41.281Z to 2026-10-30T08:36:31.752Z
- **Recorded Provider Steps**: 31 sequential interaction steps
- **Target URL**: `https://synapsee-promisecheck.vercel.app/?scenario=buggy` (transitioning to `?scenario=fixed`)
- **Local Evidence File**: `apps/promisecheck/evidence/audit-2026-10-30T08-32-41-280Z.json`

### Side-by-Side Comparison Findings

| Field | Buggy Scenario (Deliberate Defect) | Fixed Scenario (Reference Implementation) |
| :--- | :--- | :--- |
| **Advertised Rule** | "Free Delivery on Food Subtotal ₹499 and Above" | "Free Delivery on Food Subtotal ₹499 and Above" |
| **Observed Cart** | 2 Margherita Pizzas (₹249 ea) + 1 Extra Dip (₹1) | 2 Margherita Pizzas (₹249 ea) + 1 Extra Dip (₹1) |
| **Expected Subtotal** | ₹499.00 (49,900 paise) | ₹499.00 (49,900 paise) |
| **Observed Subtotal** | ₹499.00 (49,900 paise) | ₹499.00 (49,900 paise) |
| **Expected Delivery** | ₹0.00 (Free delivery threshold met: subtotal >= 499) | ₹0.00 (Free delivery threshold met: subtotal >= 499) |
| **Observed Delivery** | **₹40.00** | **₹0.00 (Displayed as "FREE")** |
| **Expected Total** | ₹499.00 | ₹499.00 |
| **Observed Total** | **₹539.00** | **₹499.00** |
| **Delivery Difference** | **+₹40.00 Overcharge** | **₹0.00 Difference** |
| **Commercial Verdict** | 🔴 **VIOLATED (MISMATCH)** | 🟢 **HONORED (PASS)** |

---

## 2. Verified Simulated Multi-Journey Suite

- **Mode**: Explicit Simulated Provider (`SIMULATED — NOT A LIVE AUDIT`)
- **Evaluated Journeys**: 5 Journeys across both scenarios (10 total journey evaluations)
- **Deterministic Ruleset**: Owner-confirmed rules v1.0.0

### Comprehensive Journey Matrix

```text
┌─────────────┬──────────┬─────────────────────────────────────────────────────┬────────────┬──────────────────────────────────────────────────────────────────┐
│ Journey ID  │ Scenario │ Journey Description                                 │ Verdict    │ Explanation / Discrepancy                                        │
├─────────────┼──────────┼─────────────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────┤
│ D498        │ buggy    │ Journey A: Delivery Boundary Below (Rs 498)         │ PASS       │ Subtotal Rs 498 < Rs 499 threshold. Standard Rs 40 fee charged.  │
│ D499        │ buggy    │ Journey B: Delivery Boundary Exact (Rs 499)         │ MISMATCH   │ Delivery fee violation: charged Rs 40 instead of free Rs 0.      │
│ D500        │ buggy    │ Journey C: Delivery Boundary Above (Rs 500)         │ PASS       │ Subtotal Rs 500 > Rs 499 threshold. Free delivery awarded.       │
│ C600        │ buggy    │ Journey D: Coupon Cap Audit (Rs 600 + WELCOME20)    │ MISMATCH   │ Discount-rule violation: applied Rs 120, exceeding Rs 100 cap.   │
│ M099        │ buggy    │ Journey E: Minimum Order Audit (Rs 99 Veg Burger)   │ MISMATCH   │ Checkout eligibility violation: falsely blocked under Rs 199.    │
│ D498        │ fixed    │ Journey A: Delivery Boundary Below (Rs 498)         │ PASS       │ All commercial commitments and rules honored.                    │
│ D499        │ fixed    │ Journey B: Delivery Boundary Exact (Rs 499)         │ PASS       │ All commercial commitments and rules honored.                    │
│ D500        │ fixed    │ Journey C: Delivery Boundary Above (Rs 500)         │ PASS       │ All commercial commitments and rules honored.                    │
│ C600        │ fixed    │ Journey D: Coupon Cap Audit (Rs 600 + WELCOME20)    │ PASS       │ All commercial commitments and rules honored.                    │
│ M099        │ fixed    │ Journey E: Minimum Order Audit (Rs 99 Veg Burger)   │ PASS       │ All commercial commitments and rules honored.                    │
└─────────────┴──────────┴─────────────────────────────────────────────────────┴────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 3. Retest Reconciliation Matrix

When the exact confirmed rules and cart plans are re-evaluated against the fixed scenario, PromiseCheck reconciles the before and after states:

| Journey Code | Description | Buggy State | Fixed State | Retest Resolution |
| :---: | :--- | :---: | :---: | :--- |
| **D498** | Delivery Below (₹498) | `PASS` | `PASS` | **HONORED IN BOTH** |
| **D499** | Delivery Exact (₹499) | `MISMATCH` | `PASS` | **CORRECTED IN FIXED SCENARIO** |
| **D500** | Delivery Above (₹500) | `PASS` | `PASS` | **HONORED IN BOTH** |
| **C600** | Coupon Cap (₹600) | `MISMATCH` | `PASS` | **CORRECTED IN FIXED SCENARIO** |
| **M099** | Minimum Order (₹99) | `MISMATCH` | `PASS` | **CORRECTED IN FIXED SCENARIO** |

---

## 4. Key Takeaways for Auditors
1. **Mathematical Objectivity**: Verdicts are computed strictly from arithmetic comparison, not from scenario names.
2. **Defect Granularity**: Distinguishes customer overcharges (₹40 delivery fee) from merchant margin loss (₹20 excess discount) and eligibility blocks.
3. **Audit Trail**: Every evaluation maintains a full trace of expected vs observed amounts with timestamps and execution mode provenance.

