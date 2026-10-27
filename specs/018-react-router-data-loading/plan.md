# Implementation Plan: URL Routing and On-Demand Season Data

**Branch**: `use-react-router` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/018-react-router-data-loading/spec.md`

## Summary

Move the selected season and current view out of Redux and into hash-based URLs using React
Router's `createHashRouter` (`#/2024-25`, `#/teamHistory/bos`). Split the 22 statically imported
season JSON files into lazily imported chunks. A small generated season index (name, source,
champion) stays in the main bundle. Route loaders return unawaited promises from a cached,
Zod-validating `loadSeason()`, and views read them with `use()` inside keyed `<Suspense>`
boundaries. Redux keeps only the chart slice (pinned teams, zoom window). The `seasons` and `UI`
slices are removed. Details and alternatives are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript ~6 / React 19.2 (React Compiler via Babel preset), Node for build scripts

**Primary Dependencies**: Vite, React Router 8.5 (already added), Redux Toolkit + React Redux,
Zod 4, Tailwind CSS 4 + shadcn/ui

**Storage**: Static JSON under `data/processed/seasons/`, emitted as per-season chunks; in-memory
promise cache per visit

**Testing**: Vitest + Testing Library (jsdom), `createMemoryRouter` for route tests

**Target Platform**: Modern browsers; GitHub Pages under `/nba-weekly-power-rankings/`

**Project Type**: Static single-page web app

**Performance Goals**: The first-load download needed for the first chart is at least 50% smaller
than ≈2.17 MB gzip (SC-002). A not-yet-viewed season renders within 1 s on broadband (SC-003). A
revisited season does no new download (SC-004).

**Constraints**: No server rewrites (hash routing), same-origin static assets only, Zod at every
trust boundary, Suspense for loading, minimal `useEffect`, no `useMemo`, no `Map`/`Set`, never run
`npm run build:summaries`

**Scale/Scope**: 22 seasons (≈250–360 KB raw each), 30 teams, 2 views, ≈15 files touched

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against
constitution v1.5.0.

| Rule | Status | Notes |
|------|--------|-------|
| I. Static Hosting Only | PASS | No backend; chunks are static files in `dist/`. |
| II. Data Prepared at Build Time | PASS | Season chunks are built from committed `data/processed/` JSON; the only runtime requests are same-origin chunks. |
| III. Base-Path-Safe, Server-Free Navigation | PASS | Hash router; chunk URLs come from Vite `base`. Verified with `npm run preview` under the base path (quickstart). |
| IV. Respectful, Offline Data Collection | PASS | App imports only `data/processed/`. `build-rankings.mjs` still writes only to `data/processed/`. |
| V. Simplicity | PASS | React Router is in the named stack (v1.5.0) and justified by URL state plus per-route loading. No other new runtime dependencies. |
| State & Data Layer | PASS | Loaders hold Zod-validated, same-origin season data. Redux keeps shared interaction state only. Season and view come from the URL. Data lives in one place, never copied. |
| Data Validation | PASS | `SeasonDataSchema` on every chunk, `SeasonIndexSchema` on the index, `z.enum(Team)` and an index lookup on URL params. Invalid input falls back to a redirect or an error boundary. |
| Testing / Quality gates | PASS | lint, build and test must pass. Preview under the non-root base is required because routing and loading change. |
| No backend / no third-party runtime calls (Spec Kit check) | PASS | Confirmed. |

**Post-design re-check (after Phase 1)**: PASS, with no new violations. The design adds no
dependencies, and the data contract keeps every chunk same-origin and validated.

## Project Structure

### Documentation (this feature)

```text
specs/018-react-router-data-loading/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── routes.md        # URL contract
│   └── season-index.md  # Generated data module contract
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
scripts/
└── build-rankings.mjs          # MODIFY: emit seasonIndex + lazy seasonLoaders in index.ts

data/processed/seasons/
└── index.ts                    # REGENERATE: new shape (contracts/season-index.md)

src/
├── App.tsx                     # MODIFY: createHashRouter(routes); drop stray "," after RouterProvider
├── routes.tsx                  # NEW: exported route objects, loaders, redirects
├── Root.tsx                    # MODIFY: add HydrateFallback export
├── data/
│   └── seasonData.ts           # NEW: seasonIndex (validated), loadSeason cache, loadAllSeasons, latestSeason
├── hooks/
│   └── useSeason.ts            # NEW: use(useRouteLoaderData('season').season)
├── schemas/season.ts           # MODIFY: add SeasonIndexSchema
├── views/
│   ├── ChartView.tsx           # MODIFY: keyed Suspense, useSeason, maxWeek-aware selectors
│   ├── TeamHistoryView.tsx     # MODIFY: team from useParams, seasons from loader data
│   └── RouteError.tsx          # NEW: route ErrorBoundary (team not found / season failed)
├── components/
│   ├── SeasonSelect.tsx        # MODIFY: options from seasonIndex, value from params, navigate
│   ├── TeamHistoryButton.tsx   # MODIFY: navigate to /teamHistory/:team
│   ├── TeamHistory.tsx         # MODIFY: props.seasons; card click pins team + navigates
│   ├── TrendMinimap/…          # MODIFY: take Season (or rankings) via props
│   ├── RosterPane.tsx, RankSwings.tsx, TeamSeasonSummary.tsx,
│   │   ChartControls.tsx, Chart/useChartControls.ts   # MODIFY: useSeason / maxWeek args
├── store/
│   ├── redux.ts                # MODIFY: reducer { chart } only
│   └── slices/
│       ├── UI/                 # DELETE
│       ├── seasons/            # DELETE slice; move loadSeasons→data/seasonData, analysis→pure fns
│       └── chart/chart.ts      # MODIFY: selectors/thunk take maxWeek; roster lookups take Season
└── test/
    ├── renderWithRouter.tsx    # NEW: memory router + Redux Provider (replaces renderWithStore)
    └── mockSeasons.ts          # MODIFY: new data/seasons mock shape
```

**Structure Decision**: Single static web app. New `src/routes.tsx` holds the route tree so App
and tests share it. Loaded data handling moves from `src/store/slices/seasons/` to
`src/data/seasonData.ts`.

## Complexity Tracking

No constitution violations to justify.
