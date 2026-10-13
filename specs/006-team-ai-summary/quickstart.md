# Quickstart: Validate Team AI Season Summary

Prerequisites: `npm ci`; an `ANTHROPIC_API_KEY` in the environment for the generating steps.

## 1. Plan without spending anything

```bash
npm run build:summaries -- --dry-run
```

Expected on first run: every team with weekly data in each season listed as "generate"; nothing written.

## 2. Backfill one season, then rebuild app data

```bash
npm run build:summaries -- --season 2024-25
npm run build:rankings
```

Expected: `data/summaries/2024-25.json` has 30 entries; `src/data/seasons/2024-25.json` has a `summaries` object.

## 3. Completed seasons are locked (SC-004)

```bash
npm run build:summaries -- --season 2024-25
git diff --stat data/summaries/2024-25.json
```

Expected: 30 "skipped (locked)", no diff, and no network calls.

## 4. Active season refresh (SC-003)

With a season that has no champion in `data/playoffs.json`: run once, add a new week's article, run again. Expected: only teams in the new article are regenerated; a third run reports all "skipped (unchanged)".

## 5. In the app

```bash
npm run lint && npm run build && npm test
npm run dev
```

- Click a team: a panel under the chart shows its name, "AI-generated summary", and the paragraph, with no network request.
- Click the team again or the background: the panel disappears.
- Switch to a season without summaries with a team pinned: no panel, no error.
