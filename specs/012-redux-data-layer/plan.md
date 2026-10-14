# Implementation Plan: Centralized Data Layer

**Branch**: `012-redux-data-layer` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-redux-data-layer/spec.md`

## Summary

App.tsx currently holds four pieces of shared state: the selected season, zoom mode, the week window and pinned teams. This feature moves them into a Redux Toolkit store made of four slices: `seasons`, `navigation`, `chartView` and `selection`.

The bundled season JSON is checked with Zod schemas when the store is created. Seasons that fail are reported and left out of the picker. The `SeasonData` and `WeekRanking` types are then derived from those schemas.

The derived values App computes today become plain selectors that return primitives. This avoids memoization, per AGENTS.md. What visitors see does not change.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.2

**Primary Dependencies**: New: `@reduxjs/toolkit` ^2.13, `react-redux` ^9.3, `zod` ^4.6. Existing: Vite 8, Tailwind 4, shadcn/ui, lodash.

**Storage**: In-memory store only. Season data is bundled JSON under `src/data/seasons/`.

**Testing**: Vitest 5 with jsdom and @testing-library/react.

**Target Platform**: Modern browsers, served as static files from GitHub Pages under `/nba-weekly-power-rankings/`.

**Project Type**: Single-page static web app.

**Performance Goals**: Switching seasons and paging feel instant. Validating 9 seasons at startup takes well under 50 ms.

**Constraints**: No backend and no runtime third-party requests. AGENTS.md rules apply: no `useMemo`, minimal `useEffect`, no `Map`/`Set`, and comments of at most one sentence.

**Scale/Scope**: 9 seasons × 30 teams × ~25 weeks. Roughly 10 new source files. App.tsx, index.tsx, the season data index and App.test.tsx change.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
| --- | --- | --- |
| I. Static Hosting Only | ✅ | Client-only store. No server and no persistence added (FR-011). |
| II. Data Prepared at Build Time | ✅ | Validates the already-bundled JSON. No runtime fetches and no RTK Query. |
| III. Base-Path-Safe Navigation | ✅ | No routing changes. `navigation` slice is in memory only for now. |
| IV. Respectful Data Collection | ✅ N/A | Scrapers are untouched. |
| V. Simplicity | ✅ | The three new dependencies are named by constitution v1.3.0. No other libraries are added. |
| State & Data Layer | ✅ | `createSlice` slices with selectors. Shared state and loaded data live in the store, and transient hover/tween state stays local. |
| Data Validation | ✅ | Data is checked with Zod before it enters the store. Invalid seasons are excluded rather than crashing the page. Types come from `z.infer`. |
| Quality gates | ✅ | `lint`, `build`, `test` and `preview` checks are listed in [quickstart.md](quickstart.md). |

**Post-design re-check**: Still passes. The design adds no backend, no runtime network requests, and no dependencies beyond the three named above.

## Project Structure

### Documentation (this feature)

```text
specs/012-redux-data-layer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/store-api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output
```

### Source Code (repository root)

```text
src/
├── schemas/
│   └── season.ts               # NEW: Zod schemas and inferred SeasonData/WeekRanking types
├── store/
│   ├── index.ts                # NEW: makeStore, RootState, AppStore, AppDispatch
│   ├── hooks.ts                # NEW: useAppSelector, useAppDispatch
│   ├── loadSeasons.ts          # NEW: validate and build SeasonView per season
│   ├── seasons.ts              # NEW: static slice and its selectors
│   ├── navigation.ts           # NEW: selected season
│   ├── chartView.ts            # NEW: zoom, window, pageWindow thunk, week selectors
│   ├── selection.ts            # NEW: pinned teams, clears on seasonSelected
│   └── *.test.ts               # NEW: reducer, selector and loader tests
├── data/seasons/index.ts       # CHANGED: drop SeasonData casts; export unknown records
├── types/nba.ts                # CHANGED: re-export SeasonData/WeekRanking from schemas
├── test/renderWithStore.tsx    # NEW: render helper with a fresh store
├── index.tsx                   # CHANGED: wrap App in Provider
├── App.tsx                     # CHANGED: read selectors, dispatch actions; no useState
└── App.test.tsx                # CHANGED: render → renderWithStore
```

**Structure Decision**: Single project. The store and schemas get their own top-level folders under `src/`, next to the existing `components/`, `data/` and `types/`. Chart, RankSwings and TeamSummary keep their prop interfaces, so only App changes how it supplies them.

## Complexity Tracking

No violations. Nothing to justify.
