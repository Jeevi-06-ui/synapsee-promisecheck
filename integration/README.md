# 🧪 Integration Suite

> **Directory**: `integration/`  
> **Assigned Team Member**: Likitha (`test/integration`)  
> **Assigned Owner**: Repository Owner / Antigravity

---

## 🎯 Scope & Purpose

This directory contains integration test suites, contract specifications, and end-to-end verification tools for the Synapsee monorepo.

---

## 🛡️ Decoupled Integration Architecture

As specified in the system design:
1. **No Shared Database**: `apps/cafe` and `apps/promisecheck` maintain independent storage boundaries or zero state.
2. **No Direct API Integration**: PromiseCheck does not communicate with private or backend APIs of the Café.
3. **Autonomous Web Verification**: All verification takes place via **TinyFish remote browser agents** auditing public DOM claims, exactly as a human guest or external compliance auditor would.

---

## 📜 Contract Specification

The service contract is defined in [`specs/cafe-promises-contract.json`](file:///specs/cafe-promises-contract.json). It declares:
- The exact customer commitments published by the Café.
- The keyword and semantic markers required for compliance.
- The assertion rules checked by the integration runner.

---

## 🏃 Running the Integration Tests

To run the full suite locally:

```bash
cd integration
npm test
```

To run against a live public URL (e.g. from Cloudflare Tunnel, localtunnel, or production deployment):

```bash
cd integration
npm test -- --url https://<your-public-cafe-url>
```
