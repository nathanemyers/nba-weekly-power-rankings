# Implementation Plan: Playoff Series Badges

**Branch**: `016-playoff-series-badges` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-playoff-series-badges/spec.md`

## Summary

Show each playoff team's run as a row of series badges: opponent logo, games played, round medal, and green or red for won or lost. They appear on team-history season cards and in the chart view when one team is pinned.

1. **Data.** The playoffs data already lists every series' teams and winner for 2003-04 to 2025-26, but not series scores. The playoffs scraper will also read Basketball-Reference's series table, on the same page it already fetches, for each series' score ([research §1](research.md#1-where-the-series-scores-come-from)). One normal run upgrades every saved season ([research §3](research.md#3-upgrading-seasons-that-were-saved-without-scores)).
2. **Build.** `build-rankings.mjs` writes a per-team `playoffSeries` list into each processed season, and checks the rules in [data-model.md](data-model.md).
3. **App.** A `PlayoffSeriesBadges` component, using a shadcn `tooltip` for the full result text and two new theme colour roles, is placed in `ChartView` and `TeamHistory`.

## Technical Context

**Language/Version**: TypeScript ~6.0 with React 19.2 (app). Node ES modules (`.mjs`) for scripts.

**Primary Dependencies**:
- Existing: Tailwind 4, shadcn/ui, Redux Toolkit, Zod.
- New: shadcn `tooltip` component, added via the shadcn CLI. It uses `radix-ui`, which is already installed, so there's no new runtime package.

**Storage**: JSON in `data/raw/basketball-reference/playoffs.json` and `data/processed/seasons/*.json`, committed.

**Testing**: Vitest, with jsdom and Testing Library.

**Target Platform**: The static site on GitHub Pages, plus local Node for the scraper.

**Project Type**: Static single-page web app with build-time data scripts.

**Performance Goals**: Negligible. At most 4 badges per view, or per card in team history.

**Constraints**:
- AGENTS.md: no `useMemo`, minimal `useEffect`, no `Map` or `Set`, Tailwind classes never built from variables, colours only in `src/index.css`, one-sentence comments, never run `build:summaries`.
- Constitution IV: scraper pacing stays at 3 s with the project user agent.

**Scale/Scope**:
- 23 seasons, 345 series, about 2,900 team-series records in processed data.
- One new component, one new shadcn UI file, one new script module.
- Edits to the scraper, the build, the schema, the types, the store loader, two views and the theme.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
|---|---|---|
| I. Static hosting only | Pass | Static JSON and React components. No server. |
| II. Data prepared at build time | Pass | Scores are scraped into `data/raw/`, turned into `playoffSeries` by `build:rankings` in `data/processed/`, and committed. |
| III. Base-path-safe navigation | Pass | No routing or asset-path changes. Logos come through the existing bundled imports. |
| IV. Respectful, offline data collection | Pass | Same Basketball-Reference pages, 3 s crawl delay and user agent. One re-fetch of 23 pages to add scores, then only new seasons. |
| V. Simplicity | Pass | No new runtime packages. The shadcn tooltip builds on the already-installed `radix-ui`. Parsing stays regex-based like the existing scraper. |
| UI & Styling (Tailwind and shadcn) | Pass | The badge uses the shadcn `Badge` and `Tooltip`. Colours are new roles in `src/index.css`, documented in `docs/styling.md`. |
| State and data layer (Redux) | Pass | `playoffSeries` loads through the existing seasons slice (`loadSeasons`). Badges read it through selectors and props. |
| Data validation (Zod) | Pass | `SeriesResultSchema` is added to `SeasonDataSchema`, so invalid data fails validation like the rest of a season. |
| Testing (Vitest) | Pass | New script and component tests, plus App integration tests. |
| Quality gates | Pass | Lint, build and test, plus a `npm run preview` check under the sub-path because bundled data changes. |

**Post-design re-check**: still passes. The design adds no runtime package, no server and no runtime third-party calls.

## Project Structure

### Documentation (this feature)

```text
specs/016-playoff-series-badges/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-and-scripts.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
scripts/
├── lib/
│   ├── playoffs.mjs                 # NEW: SLUG_BY_NAME, parseSeason (+ scores), parseSeriesScores, hasSeriesScores, teamPlayoffRuns
│   └── playoffs.test.mjs            # NEW
├── scrape-playoffs.mjs              # thin loop over lib/playoffs.mjs; re-fetches seasons without scores
└── build-rankings.mjs               # writes playoffSeries

data/
├── raw/basketball-reference/playoffs.json   # + winnerWins / loserWins on every series
└── processed/seasons/*.json                  # + playoffSeries

src/
├── index.css                        # --series-won, --series-lost roles
├── App.tsx                          # TooltipProvider
├── components/
│   ├── ui/tooltip.tsx               # NEW (shadcn CLI, unedited)
│   ├── PlayoffSeriesBadges.tsx      # NEW
│   ├── PlayoffSeriesBadges.test.tsx # NEW
│   └── TeamHistory.tsx              # badges on each season card
├── views/ChartView.tsx              # badges beside TeamHistoryButton when one team is pinned
├── schemas/season.ts                # SeriesResultSchema, playoffSeries
├── types/nba.ts                     # SeriesRound, TeamRankings.playoffSeries
├── store/slices/seasons/loadSeasons.ts   # pass playoffSeries through
└── App.test.tsx, test fixtures      # integration tests + fixture series

docs/styling.md                       # document the two new roles
```

**Structure Decision**: Scraper parsing moves into `scripts/lib/playoffs.mjs`, next to the other shared, tested script modules, so it can be unit-tested and reused by the build. The app keeps its existing layout, with one new component next to the other team-level components.

## Implementation Order

1. **Script module and tests.** Move the parsing into `scripts/lib/playoffs.mjs`, add score parsing, bracket matching and `teamPlayoffRuns`, and test them with synthetic fixtures.
2. **Scraper and data.** Slim `scrape-playoffs.mjs` down to a loop, then run it once (23 requests, about 70 s) and confirm 15 scored series per season.
3. **Build.** Write `playoffSeries`. Check that the existing `playoffs` maps in `data/processed` are unchanged and only the new key differs.
4. **App data path.** Update the schema, types, `loadSeasons` and the test fixtures.
5. **UI.** Add the shadcn `tooltip`, the `TooltipProvider`, the theme roles and the `PlayoffSeriesBadges` component with tests, then place it in `ChartView` and `TeamHistory` with App tests.
6. **Validation.** Run the quickstart spot checks in the production preview at desktop and 375 px, then lint, build and test.

## Complexity Tracking

No constitution violations to justify.
