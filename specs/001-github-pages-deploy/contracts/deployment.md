# Contract: Published Site & Deployment Workflow

## Public URL contract

| Item | Value |
|------|-------|
| Site root | `https://nathanemyers.github.io/nba-weekly-power-rankings/` |
| Entry document | `<root>index.html` (served for `<root>`) |
| Asset prefix | `<root>assets/` |
| Routing | None. Single page; no paths beyond the root are required to resolve |
| External runtime requests | None (all requests are same-origin under `<root>`) |

Guarantees:

- Loading `<root>` in a fresh browser produces zero 4xx/5xx responses for site-owned resources.
- Every season present in `src/data/seasons/` at the deployed commit is selectable and renders.

## Workflow interface (`.github/workflows/deploy.yml`)

| Aspect | Contract |
|--------|----------|
| Triggers | `push` on `master`; `workflow_dispatch` |
| Permissions | `contents: read`, `pages: write`, `id-token: write` (no other secrets) |
| Concurrency | group `pages`, `cancel-in-progress: false` |
| Gates (in order) | `npm ci` → `npm run lint` → `npm run build` → `dist/index.html` exists |
| Artifact | `dist/` via `actions/upload-pages-artifact` |
| Deploy | `actions/deploy-pages` in environment `github-pages`; job output `page_url` |
| Failure behavior | Any gate failure ends the run red; no deploy job runs; live site unchanged |

## Repository setting (one-time, manual)

Settings → Pages → Build and deployment → Source: **GitHub Actions**.
