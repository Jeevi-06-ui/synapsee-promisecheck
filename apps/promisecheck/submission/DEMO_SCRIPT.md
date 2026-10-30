# PromiseCheck: Hackathon Judge Presentation Script

**Team:** Synapsee (Presidency University, Bengaluru)  
**Speakers:** Jeevith P (Team Leader), Neha Ashok (Café Frontend), Likitha R (QA & Validation)  
**Allocated Time:** 3 Minutes  
**Target Café URL:** `https://synapsee-promisecheck.vercel.app`  
**Local Dashboard URL:** `http://127.0.0.1:4004`  

---

## ⏱️ Timing & Real Execution Reality Check

> [!NOTE]
> **Measured Live Duration:** A live cloud browser audit executing multi-step shopping journeys via TinyFish typically takes between 45 and 90 seconds per scenario due to browser initialization, DOM rendering, and sequential item clicks.
> **Presentation Strategy:** For a tight 3-minute pitch, we present the **Simulated Live Demonstration** (real-time progress, instant response, 100% offline reliability) or replay the **Genuine Recorded Live Run** (`run_id: 989f0f0e-62ee-451c-841a-26c4697a06b0`), followed by triggering an on-demand check.

---

## 🎤 Presentation Script (3-Minute Breakdown)

### 0:00 – 0:45 | The Problem & The Commercial Promise (Jeevith P)

**Spoken:**
> *"Judges, every day e-commerce stores advertise explicit commercial commitments: 'Free delivery on orders above ₹499', '20% off with coupon WELCOME20', or 'No minimum order required'.*
> 
> *However, checkout codebases are complex. A single off-by-one error—such as writing `greater-than` instead of `greater-than-or-equal-to`—means a customer spending exactly ₹499 is wrongly charged a ₹40 delivery fee. Missing discount caps cost merchants thousands in over-discounting. Bogus minimum order checks block paying customers.*
> 
> *Traditional synthetic monitoring tests static ping endpoints or checks HTML keywords. They never catch dynamic checkout calculation bugs.*
> 
> *We built **PromiseCheck**: an autonomous verification engine that uses **TinyFish cloud browser agents** to visit live web storefronts as a real customer, construct carts across edge cases, and deterministically verify commercial promises."*

---

### 0:45 – 1:30 | The Café Demonstration & Triggering the Audit (Neha Ashok)

**Visual:** Switch screen to Public Café (`https://synapsee-promisecheck.vercel.app`) then Dashboard (`http://127.0.0.1:4004`).

**Spoken:**
> *"To demonstrate this, we built and deployed **Synapsee Café** on Vercel. It features our advertised promises on the banner and supports two runtime modes: `?scenario=buggy`, which contains three deliberate commercial defects, and `?scenario=fixed`.*
> 
> *Here on our local dashboard, PromiseCheck loads the merchant's published rules: Free delivery at ₹499 (inclusive), standard delivery ₹40, coupon WELCOME20 capped at ₹100, and no minimum order.*
> 
> *Watch as I select **Both Scenarios** across our boundary journeys and launch the audit.*
> 
> *Notice our real-time backend progress: PromiseCheck instructs TinyFish to navigate to the store, verify a clean cart, click menu items one by one, apply coupons, and read the final DOM amounts without ever placing an order or touching private APIs."*

---

### 1:30 – 2:30 | Discrepancies Detected & Before/After Retest (Likitha R)

**Visual:** Highlight the **Findings Table** and **Before/After Retest Comparison**.

**Spoken:**
> *"The results are in, and PromiseCheck has caught all three commercial discrepancies:*
> 
> 1. *First, **Journey B at ₹499**: Our advertised banner promised free delivery, but the buggy storefront charged ₹40 delivery. PromiseCheck flags this as a **DELIVERY OVERCHARGE**.*
> 2. *Second, **Journey D at ₹600**: The coupon `WELCOME20` was advertised as capped at ₹100. The buggy code applied an uncapped 20%, giving ₹120. PromiseCheck flags this as a **DISCOUNT-RULE VIOLATION**.*
> 3. *Third, **Journey E at ₹99**: A customer ordering a single Veg Burger was erroneously blocked by an unannounced ₹199 minimum order. PromiseCheck flags this as a **CHECKOUT ELIGIBILITY VIOLATION**.*
> 
> *Now, look at our **Before & After Retest table**: when audited against our corrected fixed storefront, all three journeys transition to **CORRECTED IN FIXED SCENARIO** with 100% compliance.*
> 
> *Every run produces immutable local evidence with action steps, timestamps, and genuine provider run IDs, exportable to JSON or printable PDF."*

---

### 2:30 – 3:00 | Business Value & Closing (Jeevith P)

**Spoken:**
> *"What makes PromiseCheck practical:*
> - *First, **Zero Integration Overhead**: Merchants don't need to install SDKs or grant database access. TinyFish inspects the site from the outside, exactly as a human customer would.*
> - *Second, **Deterministic Ground Truth**: We never ask an LLM to guess the arithmetic. Calculations run in integer paise using verified code.*
> - *Third, **Offline Reliability**: In addition to live cloud execution, we provide deterministic simulation and recorded replays for instant audit reviews.*
> 
> *PromiseCheck protects brand trust and revenue by ensuring that every promise advertised is a promise kept. Thank you!"*

---

## 🛟 Backup & Q&A Transition
- If judges ask to inspect the genuine live cloud run, open **Card 5: Saved Audit Evidence History** and click **View** on `audit-2026-10-30T08-32-41-280Z.json` (Provider Run ID `989f0f0e-62ee-451c-841a-26c4697a06b0`, 31 recorded steps).

