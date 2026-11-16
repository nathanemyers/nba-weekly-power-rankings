# Quickstart: Validating Current Season Support and the Weekly Refresh

## Prerequisites

- Node 22, `npm install`, Google Chrome (needed for `npm run build` previews).
- Never run `npm run build:summaries`. Nothing in this guide needs it.

## 1. Week 1 HTML fallback and 30-team check (R1, R2)

```bash
npm test -- scripts/nba-power-rankings-scraper
```

Expected: the parser tests pass for a structured article, an HTML-only article (30 teams, ranks 1–30, `previousRank: null`), and a partial article (rejected).

Re-fetch the saved Week 1 once:

```bash
rm data/raw/nba/articles/2026-27/power-rankings-2026-27-week-1.json
```

```bash
npm run scrape:powerRankings
```

Expected: Week 1 is saved with `hasStructuredRankings: true` and 30 `rankings`, weeks 2+ are fetched, the exit code is 0, and `git diff --stat data/raw/nba/index.json` shows only added or changed 2026-27 rows. No older rows are removed (R3).

## 2. Current-season build (User Story 1)

```bash
npm run scrape:rosters -- --season 2026-27
```

```bash
npm run build:rankings
```

Expected: the output includes `2026-27: N weeks, 30 teams`, and `data/processed/seasons/index.ts` lists `2026-27` first.

## 3. App behavior (User Stories 1 and 2)

```bash
npm run dev
```

- Open `/`. It redirects to `/2026-27` (SC-001).
- The season picker lists 2026-27 first, labelled "In progress" (FR-005).
- The chart shows weeks 1–N for 30 teams. Week 1 tooltips show no record.
- Pin a team: Roster works. Storylines and Awards are disabled or explained, never blank (FR-004, SC-007).
- Team history (`/teamHistory/sas`) and a player's history include 2026-27.
- Open `/2018-19`: it stays on 2018-19. Open `/1999-00`: it redirects to `/2026-27` (FR-007).

```bash
npm test && npm run lint && npm run build
```

Expected: everything passes, and `dist/2026-27/index.html` exists with its own preview.

## 4. Refresh command (User Story 3)

```bash
npm run refresh:current
```

Run straight after step 1, it should print `refresh: changed=false ...` and `git status --porcelain data/` should be empty (SC-005). To simulate a new week, delete the latest week file and its index row, then run again. Expected: `changed=true season=2026-27 weeks=<n>`, with rosters and the season rebuilt.

## 5. Workflow (after merging to `master`)

1. Actions → **Weekly refresh** → Run workflow.
2. If nothing is new: a green run, no pull request.
3. If something is new: a pull request from `data/weekly-refresh` opens, the checks pass, it is merged, and a **Deploy to GitHub Pages** run starts. The new week shows at `https://nathanemyers.github.io/nba-weekly-power-rankings/2026-27`.
4. If the run fails while fetching from NBA.com or Basketball-Reference (for example, the site blocks GitHub's runners, R7), run step 4 locally and open the pull request by hand. Note the blocking in the README.
5. Next season: if GitHub turned off the schedule during the offseason, turn it back on under Actions → Weekly refresh.
