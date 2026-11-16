# Implementation Plan: Current Season Support and Weekly Rankings Refresh

**Branch**: `025-current-season-weekly-scrape` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/025-current-season-weekly-scrape/spec.md`

## Summary

Bring the 2026-27 season into the site, and keep it current with a GitHub Actions job that runs twice a week. The app already opens the newest season with data, so most of the work is in the data pipeline:

- Teach the NBA.com scraper to read the HTML-only format NBA.com used for 2026-27 Week 1.
- Reject partial weeks.
- Stop the article index from losing old seasons as its year window slides.
- Let the roster scraper fetch the current season.
- Add one `refresh:current` command that runs locally and in CI.

The workflow runs that command. If anything is new, it opens or updates a pull request, runs lint, tests, and the build, then merges the pull request and starts the deploy. It needs no secrets and no repo-setting changes (research R5). The UI only gains an "In progress" label in the season picker, plus a check of every view with the in-progress season.

## Technical Context

**Language/Version**: TypeScript 5 / React 19 (app); Node 22 ES modules (`scripts/`)

**Primary Dependencies**: Existing only: React Router, Redux Toolkit, Zod, Tailwind, shadcn/ui; `gh` CLI (preinstalled on GitHub runners) in the workflow

**Storage**: Committed JSON under `data/raw/` and `data/processed/`

**Testing**: Vitest (`npm test`), covering `src/**` and `scripts/**/*.test.mjs`

**Target Platform**: GitHub Pages (static site); GitHub Actions `ubuntu-latest` for the job

**Project Type**: Static single-page web app with build-time data scripts

**Performance Goals**: A new week is live within 7 days of NBA.com publishing it (SC-003). A run with nothing new finishes in a few minutes with only listing requests.

**Constraints**: No backend. No runtime calls to third parties. Follow crawl delays and use the project's user agent. No API-token spend. The `master` ruleset requires changes through a pull request. Events from `GITHUB_TOKEN` don't trigger other workflows.

**Scale/Scope**: About 25 weeks per season, 30 teams, about 2 runs a week, 3–5 requests to NBA.com and about 3 to Basketball-Reference per run that finds something new.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static hosting only | ✅ | The job runs in CI. The site stays static files. |
| II. Data prepared at build time | ✅ | The job commits `data/raw/` and `data/processed/`. A clean checkout builds offline. |
| III. Base-path-safe navigation | ✅ | No routing changes. `/2026-27` gets a generated entry page from the existing preview build. |
| IV. Respectful, offline collection | ✅ | Reuses the existing scrapers with their user agent and delays, fetches only unsaved articles, and re-fetches only the current season's rosters, and only when there's a new week. No browser user agent spoofing (R7). Raw data goes to `data/raw/`, processed to `data/processed/`. |
| V. Simplicity | ✅ | No new dependencies, secrets, or services. One script and one workflow. |
| Stack constraints (Tailwind/shadcn, routing from the URL, Zod) | ✅ | The picker label uses existing Tailwind tokens. The current season is still derived from the URL and index. |
| AGENTS.md: no `build:summaries` | ✅ | The job never calls summary or storyline scripts and gets no API key (R9). |

Post-design re-check: still all ✅. The design adds no runtime code paths beyond the picker label.

## Project Structure

### Documentation (this feature)

```text
specs/025-current-season-weekly-scrape/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── refresh-command.md
│   └── weekly-refresh-workflow.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
.github/workflows/
└── weekly-refresh.yml                    # NEW: schedule + dispatch, PR, checks, merge, dispatch deploy

scripts/
├── refresh-current-season.mjs            # NEW: scrape → (rosters → build:rankings) when new weeks exist
├── nba-power-rankings-scraper/
│   ├── articlePage.mjs                   # HTML fallback for numbered weekly articles
│   ├── articlePage.test.mjs              # NEW: structured, HTML-only, partial fixtures
│   ├── scrape.mjs                        # 30-team check; index keeps saved articles outside the window
│   ├── cli.mjs                           # non-zero exit on any failed article
│   └── README.md                         # document fallback + validation
└── scrape-rosters.mjs                    # LAST_END_YEAR from the date

data/
├── raw/nba/                              # 2026-27 weeks 1–N, index.json
├── raw/basketball-reference/rosters/2026-27.json
└── processed/seasons/                    # 2026-27.json, index.ts

src/
├── components/SeasonSelect.tsx           # "In progress" label when no champion
├── data/seasonData.test.ts               # current season = newest with data; ordering
└── App.test.tsx / routes tests           # / → newest season; unknown season → newest

package.json                              # "refresh:current" script
README.md                                 # weekly job section (FR-018)
```

**Structure Decision**: Keep the existing single-project layout. Scraping changes stay inside the existing scraper modules. The new orchestration is one script in `scripts/` plus one workflow next to `ci.yml` and `deploy.yml`.

## Implementation Notes

- **HTML fallback** (R1): split `contentFiltered` on `<h4>#(\d+)`. Get the team ID from `/logos/nba/(\d+)/` in the header and the team name from the header's `<a>` text. The write-up is the HTML up to the next `<h4>` or the end, run through `htmlToText`. Only for slugs matching `^power-rankings-\d{4}-\d{2}-week-\d+$`.
- **Index fix** (R3): for listing items outside the window, look up the saved file. If it exists, read it and add its index row. If not, skip it as now.
- **No-op guarantee** (contract step 3): `scrape.mjs` writes `index.json` only if the serialized content changed.
- **Season picker**: show a muted "In progress" text next to an entry with no `champion`. Use theme tokens from `src/index.css` only.
- **In-progress audit**: walk every view for 2026-27 (chart and tooltip, trends, roster, awards, storylines, team history, player history, link preview cards) and fix any blank or misleading state found (FR-004, SC-007).
- **Data commit**: the first data refresh (re-fetching Week 1, adding weeks 2–N and the 2026-27 rosters, rebuilding) is done locally and committed on the feature branch. That way the site shows 2026-27 as soon as the branch merges, before the first scheduled run.

## Complexity Tracking

No constitution violations to justify.
