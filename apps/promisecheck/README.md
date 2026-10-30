# PromiseCheck delivery audit

Node.js 22+ backend CLI, using the standard library with no npm dependencies.
It audits the public café exclusively through a real TinyFish browser. It starts
at `?scenario=buggy`, reads the delivery advertisement, verifies an empty cart,
adds two Margherita Pizzas and one Extra Dip through UI controls, and reads the
displayed subtotal, delivery and total. It repeats at `?scenario=fixed`, verifying
a clean cart again. It never places an order.

## Configure credentials

Create a key at https://agent.tinyfish.ai/api-keys. In this directory:

```sh
cp .env.example .env
```

Edit `apps/promisecheck/.env` locally and set `TINYFISH_API_KEY`. The CLI loads this
file automatically, independently of the current working directory. An existing
backend process environment variable takes precedence. `.env` and run evidence
are ignored by Git. Never place the key in café HTML, frontend variables, goals,
reports or commits. No key means an explicit error; there is no HTML fallback.

## Check, then run

```sh
# From the repository root:
cd apps/promisecheck
npm test
npm run check -- --url 'https://synapsee-promisecheck.vercel.app/?scenario=buggy'
```

`npm test` runs offline unit tests with **synthetic** data, not live evidence.
`npm run check` is a metered real-browser run. A single run covers both scenarios.
The agent receives the requested product quantities/prices, but no expected cart
totals or scenario-specific delivery fixtures. Observations are accepted only
with displayed amount text, the requested cart, matching item arithmetic,
empty-cart evidence, the observed inclusive Rs 499 advertisement, and TinyFish
step/screenshot metadata.

The evaluator calculates expected subtotal from observed items and expected free
delivery when the observed subtotal meets the advertised inclusive threshold.
Expected and observed values print separately. The legacy `src/promises.json`
keyword catalogue is retained, but is not used as proof of delivery behavior.

Exit codes: `0` = both promises honored; `1` = a completed audit found a violation;
`2` = execution or evidence validation incomplete. The buggy scenario normally
produces exit `1`; this is a detected café defect, not a failed browser run.

Evidence is saved incrementally in `evidence/delivery-<timestamp>.json`, including
the request goal/schema, provider run ID/status/timestamps, raw result, action
steps, screenshot URLs and recording URL when provided, plus computed comparison.
Use `--evidence /absolute/path/report.json` to choose a new file. Existing files
are never overwritten. Recording URLs expire after about 15 minutes; retained run
IDs and steps allow retrieval through TinyFish. A live streaming URL is useful
only while running.

If polling disconnects or times out, recover the same run without repeating cart
actions:

```sh
npm run check -- --run-id RUN_ID --evidence evidence/resumed-run.json
```

If the initial POST times out without an ID, inspect existing runs in TinyFish
before starting again. The client never retries run creation automatically.

## Official API contract

Verified against current official documentation and the published OpenAPI schema
on 2026-10-30:

- [Agent API](https://docs.tinyfish.ai/agent-api): `X-API-Key` authentication.
- [Start automation](https://docs.tinyfish.ai/api-reference/automation/start-automation-asynchronously):
  `POST https://agent.tinyfish.ai/v1/automation/run-async`, with `url`, `goal`,
  `output_schema` and `capture_config`. The CLI waits for completion locally.
- [Runs](https://docs.tinyfish.ai/key-concepts/runs):
  `GET https://agent.tinyfish.ai/v1/runs/{run_id}?screenshots=url`, result validation,
  step evidence and recording lifetime.
- [Official OpenAPI](https://agent.tinyfish.ai/v1/openapi/main).

The API origin is fixed to the official host; the former assumed
`TINYFISH_API_ENDPOINT` and `/agent/audit` route are removed. A `COMPLETED` status
alone is insufficient: missing or inconsistent observations fail explicitly.
