# Implementation Plan: Team Roster Stats

**Branch**: `017-team-roster-stats` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-team-roster-stats/spec.md`

## Summary

Show a roster pane under the chart when exactly one team is pinned: the team's head coach or coaches with their records, and every player who appeared for that team in the selected regular season, ordered by games played, with position, age, games, per-game points, rebounds, assists, steals and turnovers, PER, and marks for players who joined or left mid-season. Points, rebounds, assists, steals, turnovers and PER are colored red, yellow or green against fixed league-wide breakpoints (research R10).

A new scraper fetches Basketball-Reference's league-wide per-game, advanced and coaches pages (3 per season, 69 total) into `data/raw/basketball-reference/rosters/`. Those pages list a multi-team player's stints in the order played, which gives "joined from" and "left for" without extra requests. The coaches page lists each team's head coaches in the order they coached. `build-rankings.mjs` joins the player tables, sorts and validates each team's roster and coaches, and adds it to the season JSON the app already bundles. The app reads it through the existing `seasons` slice and renders it with a shadcn `Table`.

## Technical Context

**Language/Version**: TypeScript 6 (app), Node ESM `.mjs` (scripts)

**Primary Dependencies**: React 19, Redux Toolkit, Zod 4, Tailwind CSS 4, shadcn/ui (adds the generated `table` component), lucide-react (already installed). No new runtime packages.

**Storage**: JSON files. Raw: `data/raw/basketball-reference/rosters/{season}.json` (players and coaches). Processed: `rosters` and `coaches` fields in `data/processed/seasons/{season}.json`.

**Testing**: Vitest (`npm test`): parser tests with HTML fixtures in `scripts/lib/rosters.test.mjs`, schema/loader tests alongside `loadSeasons.test.ts`, a component test for the pane, and the existing `realData.test.ts` covering the real built data.

**Target Platform**: Static site on GitHub Pages under `/nba-weekly-power-rankings/`

**Project Type**: Single-page web app with offline data scripts

**Performance Goals**: Pane appears with the pin, no loading state (data is already in memory)

**Constraints**: No runtime third-party requests; scraper honors the 3-second crawl delay; bundled season JSON grows by about 2.3 MB raw / 0.5 MB gzipped (research R5)

**Scale/Scope**: 23 scraped seasons (22 shown), about 700 player-team rows and 30–36 coach rows per season, about 15–20 rows per team pane

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static hosting only | ✅ | Pane renders from bundled JSON; no server |
| II. Data prepared at build time | ✅ | Rosters built by `build-rankings.mjs` into `data/processed/seasons/`, committed. No runtime fetch to Basketball-Reference |
| III. Base-path-safe navigation | ✅ | No new routes or asset URLs; data comes in through existing imports |
| IV. Respectful offline collection | ✅ | Scraper runs locally, 3-second delay, project user agent, skips saved seasons, writes only to `data/raw/`. 69 requests for a full run. Pages scraped are allowed by `robots.txt` |
| V. Simplicity | ✅ | No new runtime dependency; regex parsing like `scripts/lib/playoffs.mjs`; reuses `seasons` slice instead of a new slice and async loading |
| Tailwind + shadcn/ui | ✅ | shadcn `table` and `tooltip`; colors only from `src/index.css` |
| Redux data layer | ✅ | Roster data reaches components through the `seasons` slice and a selector |
| Zod at trust boundary | ✅ | `RosterEntrySchema` and `CoachStintSchema` inside `SeasonDataSchema` |
| Spec Kit check: no backend, no runtime third-party calls | ✅ | Confirmed |

**Post-design re-check**: still passes. The one cost worth watching is bundle size (R5); the fallback, per-season lazy files, stays inside the constitution if needed.

## Project Structure

### Documentation (this feature)

```text
specs/017-team-roster-stats/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── raw-rosters.md
│   ├── season-rosters.md
│   └── roster-pane.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
scripts/
├── scrape-rosters.mjs          # new: CLI, crawl delay, skip/force/--season
├── build-rankings.mjs          # modified: read raw rosters, add `rosters` and `coaches` to season JSON
└── lib/
    ├── rosters.mjs             # new: parseStatsTable, parseCoachesTable, slugForAbbr, teamRosters, teamCoaches
    └── rosters.test.mjs        # new: fixture-based parser and builder tests

data/
├── raw/basketball-reference/rosters/{season}.json   # new, committed
└── processed/seasons/{season}.json                   # regenerated with `rosters`

src/
├── schemas/season.ts           # modified: RosterEntrySchema, CoachStintSchema, SeasonDataSchema.rosters/coaches
├── types/nba.ts                # modified: TeamRankings.roster/coaches, RosterEntry and CoachStint type exports
├── store/slices/seasons/
│   ├── loadSeasons.ts          # modified: copy roster and coaches onto each team
│   └── loadSeasons.test.ts     # modified
├── store/slices/chart/chart.ts # modified: getPinnedTeamRoster, getPinnedTeamCoaches selectors
├── components/
│   ├── RosterPane.tsx          # new
│   ├── RosterPane.test.tsx     # new
│   ├── statRating.ts           # new: stat color breakpoints and rating
│   ├── statRating.test.ts      # new
│   └── ui/table.tsx            # new, generated by shadcn
├── views/ChartView.tsx         # modified: render RosterPane under the chart
└── index.css                   # modified: stat-good, stat-fair, stat-poor color tokens

package.json                    # modified: "scrape:rosters" script
```

**Structure Decision**: Follow the existing single-project layout. The scraper mirrors `scrape-playoffs.mjs` + `lib/playoffs.mjs`, and roster data rides the same build → season JSON → `seasons` slice path as `playoffSeries`.

## Complexity Tracking

No constitution violations.
