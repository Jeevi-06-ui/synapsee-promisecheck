# Gemini Agent Scope & Operational Instructions

> **Directory**: `apps/cafe/`  
> **Assigned Agent**: Gemini  
> **Team Member**: Neha (`feature/cafe`)

---

## 🔒 Scope Boundary & Permissions

1. **Access Scope**: Gemini is strictly granted access to `apps/cafe/` **only**.
2. **Hard Boundaries**:
   - **Do NOT** read or modify files in `apps/promisecheck/`.
   - **Do NOT** modify files in `integration/` or the root `README.md`.
   - **Do NOT** add shared databases, shared internal libraries, or direct internal API routes linking to PromiseCheck.

---

## 🎯 Café Application Responsibilities

- Build and maintain the **Synapsee Café** web application.
- Present clear, unambiguous customer-facing claims and promises (e.g., store hours, dietary compliance, prices, allergen guarantees).
- Ensure the application is lightweight, responsive, and easily parseable by web browsers and autonomous web agents like TinyFish.

---

## 🌐 Public Reachability Constraint for TinyFish

- **Crucial Rule**: The Café must be reachable over the public internet.
- **Why**: TinyFish uses cloud-hosted browser agents that execute in remote datacenters. TinyFish's browser **cannot** resolve or navigate to `http://localhost:3000` on a local Mac.
- **How to provide public reachability**:
  1. **Tunneling**: Run `npm run tunnel` (using localtunnel or cloudflared) to generate a public HTTPS URL while testing locally.
  2. **Cloud Deployment**: Deploy the web app to Vercel, Netlify, or Cloudflare Pages for a permanent public URL.
