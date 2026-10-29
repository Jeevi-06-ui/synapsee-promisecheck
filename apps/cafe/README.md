# ☕ Synapsee Café Application

> **Directory**: `apps/cafe/`  
> **Assigned Team Member**: Neha (`feature/cafe`)  
> **Assigned AI Agent**: Gemini (`apps/cafe/GEMINI.md`)

---

## Overview

Synapsee Café is the public customer-facing web application. It showcases the café's menu, operating hours, and published customer commitments (organic coffee, daily bakes, dedicated gluten-free kitchen, complimentary gigabit Wi-Fi).

---

## ⚠️ Critical Deployment Constraint: TinyFish Reachability

> [!IMPORTANT]
> **TinyFish Remote Browser Requirement:**
> TinyFish operates cloud-hosted autonomous web agents running in remote datacenters.
> When TinyFish attempts to audit the café, it connects to a **publicly resolvable HTTPS URL**.
> **`http://localhost:3000` on your Mac is unreachable from TinyFish's cloud browsers.**

### Exposing the Local Server to the Public Internet
During local development, use one of the tunnel commands below to give TinyFish an HTTPS URL:

```bash
# 1. Start the café server
npm start
# Server listens at http://localhost:3000

# 2. In a separate terminal, launch a public tunnel
npm run tunnel
# Outputs: your url is: https://funny-otter-42.loca.lt
```

Other tunnel options:
- **Cloudflare Tunnel (No install required)**:
  ```bash
  npm run tunnel:cloudflare
  ```
- **ngrok**:
  ```bash
  npm run tunnel:ngrok
  ```

---

## Production Deployment (Permanent Public URL)

For a permanent public URL, you can deploy this static/Node application with a single command to:
- **Vercel**: `npx vercel`
- **Netlify**: `npx netlify deploy --prod`
- **Cloudflare Pages / Render**

---

## Scripts

- `npm start`: Starts the local HTTP server on port 3000.
- `npm run dev`: Starts the server in watch mode.
- `npm run tunnel`: Launches a public tunnel via `localtunnel`.
- `npm run tunnel:cloudflare`: Launches a Cloudflare quick tunnel.
