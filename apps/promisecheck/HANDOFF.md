# HANDOFF: PromiseCheck Autonomous Verification Engine

**Author:** Jeevith P (Team Leader, PromiseCheck Developer & System Integration)  
**Team:** Synapsee (Department of CSE, Presidency University, Bengaluru)  
**Recipients:** Likitha R (Independent QA & Validation), Neha Ashok (Café Website & Frontend)  
**Date:** 2026-10-30  
**Repository Branch:** `feature/promisecheck`  
**Latest Source Commit:** `6b470f4`  

---

## 1. Executive Summary

This document serves as the formal operational, QA, and release handoff for the **PromiseCheck** prototype. PromiseCheck is fully implemented, verified, and accompanied by complete submission documentation:

1. **Delivery Boundary Suite (`D498`, `D499`, `D500`)**: Evaluates the ₹499 inclusive free-delivery promise flanking boundary values (₹498 charges ₹40; ₹499 earns free delivery; ₹500 earns free delivery).
2. **Promotional Coupon-Cap Audit (`C600`)**: Evaluates the ₹100 maximum discount cap on a ₹600 cart with `WELCOME20`. Correctly flags uncapped ₹120 discount in buggy mode as a **discount-rule violation**.
3. **Minimum-Order Checkout Audit (`M099`)**: Assesses checkout eligibility on a ₹99 Veg Burger. Correctly flags the buggy mode defect where checkout is erroneously blocked under ₹199.
4. **Interactive Local Web Dashboard**: Polished, accessible Navy/Teal/White dashboard running locally at `http://127.0.0.1:4004`.
5. **Offer Review, History & Retest**: Editable owner rules confirmation, tamper-evident persistent evidence in `evidence/`, and side-by-side Before/After retest comparison.
6. **Zero External NPM Dependencies**: 100% standard library Node.js 22+.
7. **Complete Submission Package**: All 8 required hackathon submission documents authored in `apps/promisecheck/submission/`.

---

## 2. Component Ownership & System Architecture

```text
synapsee-promisecheck/
  apps/
    cafe/                 <-- Neha Ashok (feature/cafe) | Customer Café
    promisecheck/         <-- Jeevith P (feature/promisecheck) | PromiseCheck Engine
      evidence/           <-- Immutable saved audit JSON runs
      src/                <-- Deterministic engine, TinyFish client, server
      submission/         <-- Complete hackathon submission package (8 docs)
      test/               <-- 35 automated offline unit & integration tests
  integration/            <-- Likitha R (test/integration) | E2E QA Contract
```

### Zero-Coupling Contract
- **No Shared Database**: PromiseCheck and Café maintain zero direct database coupling.
- **No Private Internal APIs**: PromiseCheck interacts with the Café exclusively through visible web controls and DOM observation via TinyFish.
- **Pure Integer Paise**: All calculations (`src/rules.js`) use exact integer paise (1 INR = 100 paise) and explicit half-up rounding (`Math.round(subtotal * 0.20)`).

---

## 3. QA Validation Guide for Likitha

### A. Exact Test Commands

**macOS / Linux:**
```bash
cd apps/promisecheck
npm test
```

**Windows PowerShell:**
```powershell
cd apps\promisecheck
npm.cmd test
```

**Expected Outcome:**
- 35 passing tests, 0 failures, 0 regressions (~2.1s execution time).
- Validates boundaries (₹498, ₹499, ₹500), coupon caps, minimum orders, missing vs zero amounts, SSRF protections, concurrency locks, and dashboard endpoints.

---

### B. Launching the Local Web Dashboard

**macOS / Linux:**
```bash
npm start
```

**Windows PowerShell:**
```powershell
npm.cmd start
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
     - `D499` (₹499): Delivery fee ₹40.00 instead of ₹0.00 (**MISMATCH** — Defect 1).
     - `C600` (₹600): Discount ₹120.00 instead of ₹100.00 cap (**MISMATCH** — Defect 2).
     - `M099` (₹99): Checkout blocked claiming ₹199 subtotal required (**MISMATCH** — Defect 3).
   - Fixed scenario passes all journeys (**PASS**).
7. Review **4. Before & After Retest Comparison**:
   - Shows all 3 defects marked **CORRECTED IN FIXED SCENARIO**.
8. Inspect **5. Saved Evidence History**:
   - Click **JSON** to download raw evidence.
   - Click **Print** to open the printable / PDF report view.
   - Click **View** on `audit-2026-10-30T08-32-41-280Z.json` to inspect the genuine live TinyFish run (`run_id: 989f0f0e-62ee-451c-841a-26c4697a06b0`).

---

### C. CLI Audit Commands & Exit Codes

```bash
# Run full suite in simulated mode:
npm run check -- --mode simulated --suite all

# Run live audit (requires TINYFISH_API_KEY in .env):
npm run check -- --url https://synapsee-promisecheck.vercel.app/
```

| Exit Code | Meaning |
| :---: | :--- |
| **`0`** | All commercial commitments honored (0 violations found). |
| **`1`** | Commercial violation detected (deliberate buggy defects correctly flagged). |
| **`2`** | Execution or evidence validation incomplete. |

---

## 4. Evidence Format & Audit Schema

Saved evidence files reside in `apps/promisecheck/evidence/`. Each file contains:
- `id`: Job identifier (`job-<timestamp>-<hash>` or provider run ID).
- `mode`: `'live'` or `'simulated'`.
- `simulationNotice`: `'SIMULATED — NOT A LIVE AUDIT'` (if simulated).
- `status`: `'COMPLETED'`, `'FAILED'`, or `'INTERRUPTED'`.
- `targetUrl`: Exact scenario target URL.
- `rules`: Confirmed ruleset version.
- `findings`: Array of journey evaluations with exact assertions, expected vs observed amounts, and difference calculations.
- `runs`: Step metadata, action logs, screenshot links, and provider run IDs.

---

## 5. Live vs. Simulated Verification Status

| Feature | Simulated Status | Live Status | Evidence Reference |
| :--- | :---: | :---: | :--- |
| **Delivery Boundary (`D499`)** | ✅ Verified | ✅ Verified Live | Provider Run `989f0f0e-62ee-451c-841a-26c4697a06b0` in `evidence/` |
| **Coupon Cap (`C600`)** | ✅ Verified | Opt-in via API Key | Verified against Vercel café DOM contract |
| **Minimum Order (`M099`)** | ✅ Verified | Opt-in via API Key | Verified against Vercel café DOM contract |
| **Local Web Dashboard** | ✅ Verified | ✅ Verified | Running at `http://127.0.0.1:4004` |
| **Before/After Retest** | ✅ Verified | ✅ Verified | Auto-reconciled side-by-side table |
| **Timeout Resumption** | ✅ Verified (Mock) | Operational Path | Resume via `--run-id <ID>` tested without duplicate run creation |

---

## 6. Submission Deliverables Prepared in `apps/promisecheck/submission/`

1. `SUBMISSION_SUMMARY.md`: Executive summary, problem, solution, TinyFish role, and team roles.
2. `ARCHITECTURE.md`: Detailed architecture diagrams, zero-coupling boundaries, and deterministic data flow.
3. `DEMO_SCRIPT.md`: Rehearsed 3-minute pitch sequence with measured timings.
4. `JUDGE_QA.md`: Answers to all anticipated technical, architectural, and cost defense questions.
5. `FINAL_CHECKLIST.md`: Pre-submission verification checklist.
6. `SLIDE_OUTLINE.md`: 10-slide presentation deck structure.
7. `SAFE_RESULTS_SUMMARY.md`: Sanitized evidence tables with zero credential leakage.
8. `SUBMISSION_FORM_DRAFT.md`: Reusable short/long descriptions and team metadata draft.
