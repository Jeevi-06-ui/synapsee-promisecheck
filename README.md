# synapsee-promisecheck

Repository structure:

```text
synapsee-promisecheck/
  apps/
    cafe/
    promisecheck/
  integration/
  README.md
```

## Ownership and access

- Gemini: `apps/cafe` only
- Codex: `apps/promisecheck`
- Integration + root README owner: repository owner

## Branch guidance (if working on separate computers)

- Neha: `feature/cafe`
- Jeevith: `feature/promisecheck`
- Likitha: `test/integration`

## Deployment and reachability notes

- The café app must be publicly reachable so TinyFish can visit it remotely.
- PromiseCheck can initially run locally on a laptop.
- A localhost café URL on a personal machine is not reachable from TinyFish’s remote browser.

## Integration boundary

The two websites do not need a shared database or direct API integration.