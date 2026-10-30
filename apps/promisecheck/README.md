# PromiseCheck — Autonomous Commercial Verification Engine

**Team Synapsee** | Department of Computer Science & Engineering, Presidency University, Bengaluru  
- **Jeevith P** — Team Leader, PromiseCheck Developer & System Integration (`feature/promisecheck`)  
- **Neha Ashok** — Café Website & Frontend Experience (`feature/cafe`)  
- **Likitha R** — Independent QA, Validation & Evidence (`test/integration`)  

---

## 🌟 Overview

PromiseCheck is an autonomous compliance auditing system that uses **TinyFish cloud browser agents** to verify that customer-facing commercial promises (free delivery thresholds, promotional coupon caps, and checkout eligibility rules) are strictly honored by online merchants.

### Key Capabilities
1. **Preserved Delivery Audit**: Verifies the inclusive ₹499 free-delivery boundary with clean-cart guarantees.
2. **Coupon-Cap Audit**: Evaluates percentage discount caps (e.g. `WELCOME20` 20% off up to ₹100 on ₹600 carts).
3. **Minimum-Order Audit**: Verifies that low-value carts (e.g. ₹99 Veg Burger) can proceed to checkout without bogus subtotal blocks.
4. **Interactive Local Web Dashboard**: Accessible, responsive interface in Navy (`#0f172a`), White (`#ffffff`), and Teal (`#0d9488`).
5. **Deterministic Pure Math**: Currency stored in integer paise; expectations derived from owner-confirmed rules via code (never LLM arithmetic).
6. **Triple-Mode Execution**:
   - **Live**: Metered cloud browser execution via TinyFish Agent API (`X-API-Key`).
   - **Simulated**: Realistic offline fixture provider with progressive browser steps, permanently labeled `SIMULATED — NOT A LIVE AUDIT`.
   - **Recorded**: Tamper-evident historical replay with immutable timestamps and evidence.

---

## 🚀 Quick Start Commands

### 1. Installation
PromiseCheck is built using the **Node.js 22+ standard library** and requires **zero external npm dependencies**.

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

---

### 2. Run Automated Offline Tests
Executes 35 unit and integration tests covering delivery boundaries, coupon math, rounding, minimum order, security boundaries, and dashboard endpoints:

**macOS / Linux:**
```bash
npm test
```

**Windows PowerShell:**
```powershell
npm.cmd test
```

---

### 3. Launch Local Web Dashboard
Starts the local dashboard server on `http://127.0.0.1:4004`.

**macOS / Linux:**
```bash
npm start
# Alternatively:
npm run dashboard
```

**Windows PowerShell:**
```powershell
npm.cmd start
```

Open your browser to: **`http://127.0.0.1:4004`**

---

### 4. Run CLI Audits

#### A. Simulated Full Suite (Offline demonstration of all 3 deliberate bugs)
```bash
npm run check -- --mode simulated --suite all
```
*Windows PowerShell:*
```powershell
npm.cmd run check -- --mode simulated --suite all
```

#### B. Live Metered Run via TinyFish (Requires credentials)
```bash
npm run check -- --url https://synapsee-promisecheck.vercel.app/
```
*Windows PowerShell:*
```powershell
npm.cmd run check -- --url https://synapsee-promisecheck.vercel.app/
```

#### C. Custom Output & Resuming
```bash
# Custom evidence path:
npm run check -- --evidence evidence/my-custom-audit.json

# Resume an existing active run:
npm run check -- --run-id <RUN_ID> --evidence evidence/resumed-run.json
```

---

## ⚙️ Configuration & Security

Create a local `.env` file in `apps/promisecheck/`:
```bash
cp .env.example .env
```

| Environment Variable | Description | Default |
| :--- | :--- | :--- |
| `CAFE_PUBLIC_URL` | Canonical public URL of the target café. | `https://synapsee-promisecheck.vercel.app/` |
| `TINYFISH_API_KEY` | Secret key from [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys). | `(Empty / Optional for Simulation)` |
| `PORT` | Local dashboard server port. | `4004` |
| `HOST` | Local dashboard server host interface. | `127.0.0.1` |

### Security Safeguards
- **Zero API Key Leaks**: The backend redacts all occurrences of `TINYFISH_API_KEY`. It is never delivered to client code, browser logs, or report JSONs.
- **SSRF & Private Network Protection**: `validatePublicUrl` rejects localhost, loopbacks, internal RFC-1918 subnets, and non-HTTP(S) schemes.
- **Path Traversal Protection**: History endpoints reject `..`, slashes, and traversal characters.
- **Single-Job Concurrency Lock**: Only one active audit job runs at any time, preventing duplicate paid browser invocations.

---

## 🚦 Exit Codes

| Exit Code | Meaning | Context |
| :---: | :--- | :--- |
| **`0`** | **All Promises Honored** | Completed audit found zero commercial violations (e.g. against the fixed scenario). |
| **`1`** | **Business Violation Detected** | Completed audit successfully detected a merchant commercial discrepancy (e.g. delivery fee defect, coupon cap violation, or checkout block). |
| **`2`** | **Execution / Evidence Incomplete** | Network failure, missing credentials, malformed browser DOM, or incomplete evidence. |

---

## 🧪 The 5 Test Journeys & Expected Buggy Findings

| Journey | Cart Items | Expected Fixed Behavior | Buggy Scenario Discrepancy |
| :--- | :--- | :--- | :--- |
| **A. Delivery Below** | 2 Margherita Pizzas (₹498) | Delivery: ₹40.00, Total: ₹538.00 | Honors standard delivery charge (**PASS**). |
| **B. Delivery Exact** | 2 Pizzas + 1 Dip (₹499) | Delivery: FREE (₹0.00), Total: ₹499.00 | **Defect 1**: Strictly checks `> ₹499`. Charges ₹40 delivery at exactly ₹499 (**MISMATCH**). |
| **C. Delivery Above** | 2 Pizzas + 2 Dips (₹500) | Delivery: FREE (₹0.00), Total: ₹500.00 | Honors free delivery (**PASS**). |
| **D. Coupon Cap** | 2 Family Combos + 2 Dips (₹600) + `WELCOME20` | Discount: ₹100.00 (Capped), Total: ₹500.00 | **Defect 2**: Uncapped discount of ₹120.00 applied (**MISMATCH** — discount-rule violation). |
| **E. Minimum Order** | 1 Veg Burger (₹99) | Delivery: ₹40.00, Total: ₹139.00, Allowed: Yes | **Defect 3**: Blocks checkout claiming minimum subtotal of ₹199 is required (**MISMATCH**). |

---

## 🌐 Local REST API Routes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the accessible Single-Page Web Dashboard. |
| `GET` | `/api/config` | Returns system status and readiness without exposing secrets. |
| `GET` | `/api/rules` | Retrieves active business rules. |
| `POST` | `/api/rules/confirm` | Saves owner-confirmed commercial rules. |
| `GET` | `/api/journeys` | Lists available test journeys and expected validation contracts. |
| `POST` | `/api/audit/start` | Initiates an audit job (`live` or `simulated`). Returns `jobId` immediately. |
| `GET` | `/api/audit/status` | Returns active audit progress, step log, and incremental findings. |
| `POST` | `/api/audit/cancel` | Gracefully cancels the currently running audit. |
| `GET` | `/api/history` | Lists all past audit runs saved in `evidence/`. |
| `GET` | `/api/history/:id` | Returns full JSON evidence for a specific run (path-traversal protected). |
| `GET` | `/api/history/:id/export` | Downloads evidence report as `promisecheck-<id>.json`. |
| `GET` | `/api/history/:id/print` | Renders a clean printable report formatted for PDF / print. |
| `GET` | `/api/retest-comparison` | Generates side-by-side Before/After evaluation across scenarios. |

---

## 📂 Storage & Evidence Format

Evidence is saved to `apps/promisecheck/evidence/` as immutable JSON files:
- `evidence/delivery-<timestamp>.json` (Legacy delivery runs)
- `evidence/audit-<timestamp>-<jobId>.json` (Multi-journey suite runs)

### Data Schema
- `id`: Unique Job identifier.
- `mode`: `'live'` or `'simulated'`.
- `simulationNotice`: `'SIMULATED — NOT A LIVE AUDIT'` (if simulated).
- `status`: `'COMPLETED'`, `'FAILED'`, or `'INTERRUPTED'`.
- `targetUrl`: Exact scenario target URL.
- `rules`: Confirmed ruleset version.
- `findings`: Array of journey evaluations with exact assertions, expected vs observed amounts, and difference calculations.
- `runs`: Step metadata, action logs, screenshot links, and provider run IDs.

---

## 🔍 Verification Status & Known Limitations

### Verified Capabilities
- **35 Unit & Integration Tests**: 100% passing offline without credentials or network access.
- **Deterministic Pure Arithmetic**: Integer paise calculations with half-up rounding.
- **Local Dashboard Server**: Verified responsive and fully functional at `http://127.0.0.1:4004`.
- **All 3 Deliberate Bugs Detected**: Correctly identified and flagged in buggy mode; verified resolved in fixed mode.
- **Interrupted Job Reconciliation**: Incomplete runs are marked `INTERRUPTED` upon server restart.
- **Live TinyFish Delivery Run**: Previously verified live on 2026-10-30 (`evidence/delivery-2026-10-30T06-59-43-287Z.json`).

### Known Limitations
- **TinyFish Browser Profile**: Uses the `lite` browser profile for fast execution; runs in cloud datacenters and cannot resolve `localhost`.
- **Provider Screenshots**: Provider screenshot and recording URLs expire after approximately 15 minutes per TinyFish API policies; retained run IDs allow re-querying trace data within provider retention windows.
- **Live Run Timeout Recovery**: The client captures and logs the `run_id` immediately upon start. While offline tests prove the client resumes with `--run-id` without creating duplicates, live network recovery during a provider outage remains an operational recovery path rather than an automated fault-injection test.
