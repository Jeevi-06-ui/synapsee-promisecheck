# Codex Agent Scope & Operational Instructions

> **Directory**: `apps/promisecheck/`  
> **Assigned Agent**: Codex  
> **Team Member**: Jeevith (`feature/promisecheck`)

---

## 🔒 Scope Responsibility & Permissions

1. **Responsibility**: Codex has responsibility for `apps/promisecheck/`.
2. **Hard Boundaries**:
   - **Do NOT** read or modify files in `apps/cafe/`.
   - **Do NOT** modify files in `integration/` or the root `README.md`.
   - **Do NOT** add shared databases, shared internal libraries, or direct internal API routes linking to the Café.

---

## 🎯 PromiseCheck Responsibilities

- Build and maintain the **PromiseCheck** verification engine.
- PromiseCheck initially runs locally on the developer's laptop.
- Orchestrates **TinyFish web agents** to visit the Café's public URL remotely and audit its public claims and promises.
- Evaluates the web agent's findings against expected promise contracts (e.g., verifying that claims of organic coffee, opening hours, and gluten-free preparation are visibly published and consistent).

---

## 🌐 TinyFish Cloud Reachability Contract

- PromiseCheck dispatches TinyFish browser agents running in the cloud.
- Because TinyFish runs remotely, PromiseCheck must supply TinyFish with a **publicly reachable URL** (e.g. from Cloudflare Tunnel, localtunnel, ngrok, or production deployment) rather than `http://localhost`.
