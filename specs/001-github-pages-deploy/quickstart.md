# Quickstart: Validate GitHub Pages Deployment

See [contracts/deployment.md](./contracts/deployment.md) for the URL and workflow contract.

## Prerequisites

- Node.js 22 and `npm ci` completed in a local checkout
- Repository admin access (for the one-time Pages setting)

## Scenario 1: Production-like local preview (User Story 3)

```bash
npm run lint
npm run build
npm run preview
```

Expected:

- Preview prints a URL ending in `/nba-weekly-power-rankings/`.
- Opening it shows the chart; switching through every season loads data.
- Browser devtools Network tab shows no failed requests.
- `grep -o 'src="[^"]*"\|href="[^"]*"' dist/index.html` lists only URLs beginning with
  `/nba-weekly-power-rankings/` or `data:` (the inline 🏀 favicon needs no file, so it never
  causes a failed request).

## Scenario 2: First publish (User Story 1)

1. In GitHub: Settings → Pages → Source: **GitHub Actions**.
2. Merge the feature into `master` (or run the "Deploy" workflow via **Run workflow**).
3. Wait for the workflow run to go green; the deploy job shows the page URL.

Expected: `https://nathanemyers.github.io/nba-weekly-power-rankings/` renders the chart with the
latest season, all seasons selectable, zero failed requests (SC-001).

## Scenario 3: Automatic update (User Story 2)

1. Merge a small visible change (e.g., the page title text) into `master`.
2. Without further action, reload the live site after the run completes.

Expected: the change is live within 10 minutes of merge (SC-002).

## Scenario 4: Failed build does not publish (FR-006)

1. Push a commit with a deliberate lint error to `master` in a fork with Pages enabled (or
   confirm by inspection that the `deploy` job `needs: build`).
2. Observe the run fails at the lint step and no deploy job runs.

Expected: live site unchanged (SC-003).
