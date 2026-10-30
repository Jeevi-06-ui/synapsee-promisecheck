# HANDOFF: PromiseCheck Autonomous Verification Engine

**Author:** Jeevith P (Team Leader, PromiseCheck Developer & System Integration)  
**Team:** Synapsee (Department of CSE, Presidency University, Bengaluru)  
**Recipients:** Likitha R (Independent QA & Validation), Neha Ashok (Café Website & Frontend)  
**Date:** 2026-10-30  
**Repository Branch:** `feature/promisecheck`  

---

## 1. Executive Summary

This document serves as the formal operational and QA handoff for the **PromiseCheck** engine. PromiseCheck has been completed to full specification:
1. **Existing Delivery Audit Preserved**: Continues to pass all original offline tests and real TinyFish run verification.
2. **Coupon-Cap Audit**: Evaluates the ₹100 maximum discount cap on ₹600 orders under coupon `WELCOME20`.
3. **Minimum-Order Audit**: Assesses low-value checkout eligibility on a ₹99 Veg Burger cart.
4. **Interactive Local Web Dashboard**: Polished, accessible Navy/Teal/White dashboard running locally at `http://127.0.0.1:4004`.
5. **Offer Review, History & Retest**: Editable owner rules confirmation, tamper-evident persistent evidence in `evidence/`, and side-by-side Before/After retest comparison.
6. **Zero External NPM Dependencies**: 100% standard library Node.js 22+.

---

## 2. Component Ownership & System Architecture

```text
synapsee-promisecheck/
  apps/
    cafe/                 <-- Neha Ashok (feature/cafe) | Customer Café
    promisecheck/         <-- Jeevith P (feature/promisecheck) | PromiseCheck Engine
      evidence/           <-- Immutable saved audit JSON runs
      src/                <-- Deterministic engine, TinyFish client, server
      test/               <-- 35 automated offline unit & integration tests
  integration/            <-- Likitha R (test/integration) | E2E QA Contract
```

### Zero-Coupling Contract
- **No Shared Database**: PromiseCheck and Café maintain zero direct database coupling.
- **No Private Internal APIs**: PromiseCheck interacts with the Café exclusively through visible web controls and DOM observation via TinyFish.
- **Pure Integer Paise**: All calculations (`src/rules.js`) use exact integer paise (1 INR = 100 paise) and explicit half-up rounding (`Math.round(subtotal * 0.20)`).

---

## 3. QA Validation Guide for Likitha

### A. Running the Offline Test Suite
Execute the 35 automated unit and integration tests:
```bash
cd apps/promisecheck
npm test
```
**Expected Outcome:**
- 35 passing tests, 0 failures, 0 regressions.
- Validates boundaries (₹498, ₹499, ₹500), coupon caps, minimum orders, missing vs zero amounts, SSRF protections, and dashboard endpoints.

### B. Launching the Local Web Dashboard
```bash
npm start
```
1. Open `http://127.0.0.1:4004`.
2. Inspect the **System Readiness** banner: Shows Node.js version, port, and API key presence (masked, never leaked).
3. Review the **1. Offer Review & Owner Confirmation** card: Verify that Free Delivery is set to `49900` paise and coupon cap to `10000` paise. Click **Confirm & Update Rules**.
4. Under **2. Select Test Journeys**:
   - Choose scenario: **Both (Buggy + Fixed Comparison)**.
   - Click **Launch PromiseCheck Audit**.
5. Observe real-time progress:
   - Progress bar tracks completed provider steps.
   - Live step log displays navigation, cart clearing, item addition, and calculation extraction.
6. Review the **3. Audit Findings**:
   - Buggy scenario reveals exactly 3 discrepancies:
     - Journey B (₹499): Delivery fee ₹40.00 instead of ₹0.00 (**MISMATCH** — Defect 1).
     - Journey D (₹600): Discount ₹120.00 instead of ₹100.00 cap (**MISMATCH** — Defect 2).
     - Journey E (₹99): Checkout blocked claiming ₹199 subtotal required (**MISMATCH** — Defect 3).
   - Fixed scenario passes all journeys (**PASS**).
7. Review **4. Before & After Retest Comparison**:
   - Shows all 3 defects marked **CORRECTED IN FIXED SCENARIO**.
8. Inspect **5. Saved Evidence History**:
   - Click **JSON** to download raw evidence.
   - Click **Print** to open the printable / PDF report view.

---

## 4. Evidence Format & Audit Schema

Saved evidence files reside in `apps/promisecheck/evidence/`. Each file contains:
- `id`: Job identifier (`job-<timestamp>-<hash>`).
- `mode`: `'live'` or `'simulated'`.
- `simulationNotice`: Explicit banner if simulated.
- `status`: `'COMPLETED'` or `'INTERRUPTED'`.
- `targetUrl`: Public URL of target.
- `rules`: Exact version of confirmed rules used for expected math.
- `findings`: Array of journeys evaluated:
  - `expected`: Pure math expectations in rupees and paise.
  - `observed`: Real DOM amounts and displayed text.
  - `assertions`: Granular checks (`subtotal_accuracy`, `delivery_fee_policy`, `coupon_discount_and_cap`, `checkout_eligibility`).
  - `verdict`: `'PASS'`, `'MISMATCH'`, or `'INCONCLUSIVE'`.

---

## 5. Live vs. Simulated Verification Status

| Feature | Simulated Status | Live Status | Evidence / Notes |
| :--- | :---: | :---: | :--- |
| **Delivery Boundary (₹499)** | ✅ Verified | ✅ Verified | Recorded run: `evidence/delivery-2026-10-30T06-59-43-287Z.json` |
| **Coupon Cap (₹600)** | ✅ Verified | Opt-in via API Key | Verified against Vercel deployment structure |
| **Minimum Order (₹99)** | ✅ Verified | Opt-in via API Key | Verified against Vercel deployment structure |
| **Local Web Dashboard** | ✅ Verified | ✅ Verified | Accessible on `http://127.0.0.1:4004` |
| **Before/After Retest** | ✅ Verified | ✅ Verified | Automated side-by-side reconciliation |
| **Timeout Resume / Recovery** | ✅ Verified (Mock) | Operational Path | Resume via `--run-id <ID>` tested without creating duplicate runs |

