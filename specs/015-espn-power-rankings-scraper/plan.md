# Implementation Plan: ESPN Power Rankings Scraper (2003-04 to 2015-16)

**Branch**: `015-espn-power-rankings-scraper` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-espn-power-rankings-scraper/spec.md`

## Summary

This feature adds a second rankings scraper for ESPN's Marc Stein Power Rankings, covering 2003-04 to 2015-16. It also gives each raw data source its own folder.

1. **ESPN scraper.** A new `scripts/espn-power-rankings-scraper/` mirrors the NBA.com scraper: `cli.mjs`, a scrape loop with on-disk caching, one JSON file per edition grouped by season, and an `index.json`.
   - **Finding editions:** fetch each season's default page, which is the final edition, and read the week dropdown for the rest ([research §1](research.md#1-how-to-find-every-edition-in-a-season)).
   - **Missing weeks:** a 3xx redirect means the week was never published.
   - **Parsing:** regular expressions over ESPN's stable `table.tablehead` markup.
   - **Teams:** mapped to NBA.com franchise IDs, using link abbreviations first and printed names for relocated franchises.
2. **Shared helpers.** `http.mjs` and `htmlToText.mjs` move to `scripts/lib/`. Both scrapers then send a descriptive user agent, and `htmlToText` decodes Windows-1252 numeric entities.
3. **Raw data move.** NBA.com data moves to `data/raw/nba/` and `playoffs.json` moves to `data/raw/basketball-reference/`. The NBA.com scraper, playoffs scraper and both build scripts point at the new paths, and the processed output stays byte-identical.
4. **ESPN seasons in the app** (User Story 5). `build-rankings.mjs` merges ESPN weekly editions with the NBA.com articles and records each season's `source`. The app validates `source` with Zod, and `DataSourceBadge` shows it beside the season dropdown and on team-history cards. The AI Summary button and badge are hidden or disabled when a season has no summary.
5. **Playoffs back to 2003-04** (User Story 6). `scrape-playoffs.mjs` gets its own franchise-name map (the `src/Chart/teams.ts` it read no longer exists), starts at 2003-04, and keeps saved seasons unless `--force` is passed.
6. **Wayback recovery** (User Story 7). `wayback.mjs` and `legacyEditionPage.mjs` recover the 20 editions espn.com no longer serves from archive.org's copies of the 2003-05 site ([research §11](research.md#11-recovering-editions-espn-no-longer-serves-convergence-2026-10-25)). `scripts/lib/http.mjs` gains a lenient UTF-8 decoder for ESPN's stray Windows-1252 bytes ([research §12](research.md#12-character-encoding-of-live-espn-pages-convergence-2026-10-25)).

## Technical Context

**Language/Version**: Node.js ES modules (`.mjs`), plain JavaScript with no TypeScript, like the other scripts in `scripts/`. Uses the built-in `fetch`.

**Primary Dependencies**: None new. Node built-ins only (`node:fs/promises`, `node:path`, `node:url`).

**Storage**: JSON files under `data/raw/espn/`, `data/raw/nba/` and `data/raw/basketball-reference/`, committed to git ([data-model.md](data-model.md)).

**Testing**: Vitest (`npm test`), with `*.test.mjs` next to the modules, like `scripts/lib/summary-plan.test.mjs`. Fixtures are small synthetic HTML strings in ESPN's markup shape, not copied ESPN pages.

**Target Platform**: The maintainer's machine (Linux/macOS, Node 24). It never runs in the deployed site.

**Project Type**: CLI data-collection scripts inside a static web app repo.

**Performance Goals**: A full run takes under an hour (SC-004). Expect about 330 requests at a 1 s default delay, so roughly 6 to 10 minutes.

**Constraints**:
- Constitution IV: pace requests, send a descriptive user agent, don't re-fetch.
- AGENTS.md: comments are 1 sentence at most, no `Map` or `Set`, and never run `build:summaries`.

**Scale/Scope**: 13 seasons, 329 editions (20 recovered from the Wayback Machine), 9,815 team entries. App: one new component, schema and store field, and two view edits. 22 seasons in the app instead of 9.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
|---|---|---|
| I. Static hosting only | Pass | Scrapers stay local. The app change is static: more bundled season JSON and a badge component. |
| II. Data prepared at build time | Pass | ESPN seasons reach the app only through `build:rankings` → `data/processed/seasons/`, committed to the repo. The move alone left `data/processed/` unchanged (SC-006). |
| III. Base-path-safe navigation | Pass | No routing changes. Badge links are absolute external URLs. Checked with `npm run preview` under `/nba-weekly-power-rankings/`. |
| IV. Respectful, offline data collection | Pass | ESPN at 1 s, archive.org and Basketball-Reference at 3 s, all with the project user agent. Saved editions and playoff seasons are reused. Raw data stays under `data/raw/`, and app code still imports only `data/processed/`. |
| V. Simplicity | Pass | No new dependencies. Regex parsing like the existing scrapers. Shared helpers go in the existing `scripts/lib/`. |
| Data pipeline (`scrape:*` → `data/raw/`) | Pass | New `npm run scrape:espnPowerRankings`. All raw outputs stay inside `data/raw/`, so the constitution text needs no amendment. |
| Testing (Vitest) | Pass | New unit tests run under `npm test`. |
| No backend, no runtime third-party calls | Pass | ESPN and archive.org are only contacted by local scripts. The source badges are plain links, with no requests at runtime. |
| Data validation (Zod) | Pass | The new `source` field is part of `SeasonDataSchema`. |

**Post-design re-check (after Phase 1)**: still passes. The design adds no runtime dependencies and keeps every output under `data/raw/`.

**Re-check after convergence (2026-10-25)**: still passes with the app integration, playoffs extension and Wayback recovery added (rows above updated).

## Project Structure

### Documentation (this feature)

```text
specs/015-espn-power-rankings-scraper/
├── plan.md              # This file
├── research.md          # Phase 0: ESPN page structure, edition discovery, team mapping
├── data-model.md        # Phase 1: edition, team entry and index shapes, raw layout
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   └── cli.md           # Phase 1: CLI options, exit codes, shared module interfaces
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
scripts/
├── lib/
│   ├── articles.mjs                 # comment updated to data/raw/nba
│   ├── http.mjs                     # MOVED from nba-power-rankings-scraper/, adds user agent + redirect detection
│   ├── htmlToText.mjs               # MOVED from nba-power-rankings-scraper/, adds Windows-1252 entities
│   ├── htmlToText.test.mjs          # NEW
│   └── http.test.mjs                # NEW (lenient UTF-8 decoder)
├── nba-power-rankings-scraper/
│   ├── cli.mjs                      # default --out → data/raw/nba
│   ├── articlePage.mjs, contentApi.mjs, scrape.mjs   # imports → ../lib/
│   └── README.md                    # paths
├── espn-power-rankings-scraper/     # NEW
│   ├── cli.mjs                      # args, season-range validation, help; shebang + executable
│   ├── seasonPage.mjs               # season default page → final edition + list of other editions
│   ├── editionPage.mjs              # edition HTML → EspnEdition
│   ├── teams.mjs                    # ESPN abbreviation / printed name → NBA.com team ID
│   ├── scrape.mjs                   # loop, caching, missing/failed counts, index.json
│   ├── editionPage.test.mjs         # NEW
│   ├── seasonPage.test.mjs          # NEW
│   ├── teams.test.mjs               # NEW
│   ├── seasonRange.mjs + test       # NEW: --from/--to validation
│   ├── wayback.mjs                  # NEW: recover missing editions from the Wayback Machine
│   ├── legacyEditionPage.mjs + test # NEW: parser for the 2003-05 page layout
│   └── README.md
├── scrape-playoffs.mjs              # output → data/raw/basketball-reference/playoffs.json; 2003-04 onward, own name map, --force
├── build-rankings.mjs               # read paths split; merges ESPN seasons; writes `source`
└── build-summaries.mjs              # same path change only; never run

data/raw/
├── nba/{index.json,articles/}       # git mv from data/raw/
├── basketball-reference/playoffs.json   # git mv from data/raw/
└── espn/{index.json,articles/}      # NEW, produced by the full run

data/processed/seasons/               # 13 ESPN seasons added; `source` on every season

src/
├── types/nba.ts                      # DataSource enum
├── schemas/season.ts                 # `source` validated
├── store/slices/seasons/             # Season.source
├── components/DataSourceBadge.tsx + test   # NEW
├── components/TeamHistory.tsx        # source badge; AI badge only with a summary
├── components/TeamSeasonSummary.tsx  # disabled without a summary
└── views/ChartView.tsx               # source badge beside the season select

package.json                          # add "scrape:espnPowerRankings"
README.md                             # data/raw paths
.claude/launch.json                   # `preview` entry for checking the production build
```

**Structure Decision**: The ESPN scraper gets its own folder alongside `nba-power-rankings-scraper/`, with the same file roles: `cli.mjs` and `scrape.mjs`, plus `seasonPage.mjs` and `editionPage.mjs` in place of `contentApi.mjs` and `articlePage.mjs`. Only source-independent helpers move to `scripts/lib/`.

## Implementation Order

1. **Move the raw data and update paths** (User Story 4). `git mv` the files, update `build-rankings.mjs`, `build-summaries.mjs`, `scrape-playoffs.mjs`, the NBA.com `cli.mjs` and the READMEs. Check with `npm run build:rankings` and a clean `git status data/processed`. Commit this step on its own, so a regression traces back to the move.
2. **Shared helpers.** Move `http.mjs` and `htmlToText.mjs` to `scripts/lib/`, add the user agent, `allowRedirect` and Windows-1252 handling, fix the NBA.com scraper's imports, and add `htmlToText.test.mjs`.
3. **ESPN parsing.** Write `teams.mjs`, `editionPage.mjs` and `seasonPage.mjs` with their tests, driven by synthetic fixtures.
4. **ESPN orchestration.** Write `scrape.mjs`, `cli.mjs`, the `package.json` script and the README.
5. **Validation.** Run a single-season smoke test, then the full run (needs the maintainer's approval, since it sends about 330 requests to ESPN), the re-run check, then `npm run lint`, `npm run build` and `npm test`. Commit the `data/raw/espn/` output.

## Risks

| Risk | Mitigation |
|---|---|
| ESPN serves a different layout for some seasons that weren't sampled (2005-06, 2009-10, 2014-15) | Validation compares the heading's season with the requested one and requires ranks 1..N. Failures are counted and printed, never saved wrong. The single-season smoke test runs before the full run. |
| An unexpected team name appears | It's saved with `teamId: null` and a warning. SC-002 tracks this, and the fix is one line in `teams.mjs`. |
| ESPN rate-limits or blocks requests | Retries with backoff, `--delay-ms` can be raised, and re-runs resume from disk. |
| The move breaks the summaries build, which can't be run to check | Its only raw-data reads are the two paths changed alongside `build-rankings.mjs`, which is run. The quickstart notes the maintainer can run `build:summaries --dry-run` themselves. |

## Complexity Tracking

No constitution violations to justify.
