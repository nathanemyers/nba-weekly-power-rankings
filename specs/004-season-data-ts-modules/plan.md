# Implementation Plan: Season & Postseason Data as Plain JS/TS Modules

**Branch**: `004-season-data-ts-modules` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-season-data-ts-modules/spec.md`

## Summary

Replace the JSON-based storage for per-season rankings (`src/data/seasons/*.json`) and postseason
bracket results (`data/playoffs.json`) with plain JS/TS modules, and replace the app's dynamic
`import.meta.glob`-based async loading with plain static ES module imports (via a generated
barrel module), so selecting a season renders instantly with no loading state. The two generator
scripts (`scripts/build-rankings.mjs`, `scripts/scrape-playoffs.mjs`) are updated to emit the new
file formats; their maintainer-facing workflow is unchanged.

## Technical Context

**Language/Version**: TypeScript ~6.0.2 (app code), Node.js ESM `.mjs` (build/scrape scripts) —
both already in use, unchanged by this feature.

**Primary Dependencies**: Vite 8 (bundler; currently provides `import.meta.glob`, being dropped
in favor of plain static imports), React 19, styled-components. No new runtime or dev dependency
is introduced.

**Storage**: Source-controlled files — one `.ts` module per season under `src/data/seasons/`, a
generated `src/data/seasons/index.ts` barrel, and `data/playoffs.js` for postseason brackets. All
committed to the repo (replacing the equivalent `.json` files 1:1), consistent with Constitution
Principle II.

**Testing**: Vitest (`npm test`), already configured. No new test tooling needed; existing/added
tests verify data-shape parity (see `quickstart.md` §4).

**Target Platform**: Static site served by GitHub Pages (browser), plus Node.js for the two
build-time data-generation scripts. Unchanged.

**Project Type**: Single-page web app (Vite + React) with Node build scripts — existing structure,
no new project/package introduced.

**Performance Goals**: Season switch in the UI renders on the same tick as the click (no
network/microtask wait for data), per spec SC-001.

**Constraints**: Must keep working as a fully static GitHub Pages deployment with all data
committed and build-time-generated (Constitution I, II); no new runtime dependency (Constitution
V); maintainer regeneration workflow (`npm run build:rankings` after scraping) must take the same
number of steps as before (FR-005, SC-003).

**Scale/Scope**: 9 seasons today, growing by roughly one per year; ~30 teams; all seasons' data
now ships in the main bundle instead of being code-split per season (explicitly acceptable per
spec Assumptions — bundle size is not a concern).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Static Hosting Only | No server, function, or runtime API is introduced; data continues to ship as static files bundled into `dist/`. | PASS |
| II. Data Is Prepared at Build Time | Season/postseason data is still produced ahead of time by `scripts/*.mjs` and committed to the repo; only the file format (`.ts`/`.js` instead of `.json`) changes — the principle's `.json` reference is an example ("e.g."), not a requirement. | PASS |
| III. Base-Path-Safe, Server-Free Navigation | No URL, routing, or asset-path behavior changes; season data moves from a fetched asset to a bundled module, which is strictly simpler for this principle. | PASS |
| IV. Respectful, Offline Data Collection | Scraping scripts and their cadence are unchanged; raw bracket input continues to live under `data/` (now `data/playoffs.js` instead of `.json`). | PASS |
| V. Simplicity | Removes a bundler-specific dynamic-loading mechanism (`import.meta.glob` + async state) in favor of plain static imports already native to the stack; no new dependency. | PASS |

No violations — Complexity Tracking is not needed for this feature.

## Project Structure

### Documentation (this feature)

```text
specs/004-season-data-ts-modules/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory: this feature has no external interface (no API, CLI surface, or
component prop change) — it's a purely internal storage/loading-mechanism change within the
existing single-page app. The module shapes it does introduce (season module, generated barrel,
postseason module) are documented in `data-model.md` instead.

### Source Code (repository root)

This is an existing single Vite + React app with Node build scripts (no frontend/backend split,
no new project). Only the files below are touched; everything else in the tree is unaffected.

```text
data/
└── playoffs.js                  # was playoffs.json — raw postseason brackets, written by scrape-playoffs.mjs

src/
├── App.tsx                      # season picker + chart host — drops import.meta.glob/async loading
├── Chart/
│   └── types.ts                 # SeasonData/WeekRanking/PlayoffStage — unchanged, now the type for each season module
└── data/
    └── seasons/
        ├── <season>.ts          # one per season, was <season>.json — e.g. 2024-25.ts
        └── index.ts             # NEW — generated barrel: static imports + seasonData map + sorted seasons list

scripts/
├── build-rankings.mjs           # emits src/data/seasons/*.ts + index.ts; reads data/playoffs.js via static import
└── scrape-playoffs.mjs          # emits data/playoffs.js instead of data/playoffs.json
```

**Structure Decision**: No new top-level areas. `src/data/seasons/` and `data/playoffs.*` keep
their current locations; only their file extensions/export syntax change, plus the new generated
`src/data/seasons/index.ts` barrel that lets `App.tsx` reach all season data through one static
import (see `research.md` Decision 1). `scripts/build-rankings.mjs` and
`scripts/scrape-playoffs.mjs` keep their current responsibilities and are invoked the same way
(`npm run build:rankings`, `npm run scrape:playoffs`).

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
