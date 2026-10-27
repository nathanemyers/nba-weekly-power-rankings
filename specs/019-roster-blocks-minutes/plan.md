# Implementation Plan: Roster Blocks and Minutes

**Branch**: `019-roster-blocks-minutes` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-roster-blocks-minutes/spec.md`

## Summary

Change the roster pane's columns and rating rules: replace the TOV column with a rated BLK column (breakpoints 0.2 / 0.6 / 1.0), add an unrated MIN column after G, and show the rated stat values of players under the 10-game / 10-minute cutoff in `text-muted-foreground`. Blocks and minutes per game are already in the processed season data and the Zod schema, so this is a UI and rating-module change only: `src/components/statRating.ts`, `src/components/RosterPane.tsx` and their tests.

## Technical Context

**Language/Version**: TypeScript 5, React 19

**Primary Dependencies**: Tailwind CSS, shadcn/ui `Table`, existing `statRating` module

**Storage**: N/A (reads existing `data/processed/seasons/*.json`; no data changes)

**Testing**: Vitest + Testing Library (`npm test`)

**Target Platform**: Static site on GitHub Pages, modern browsers

**Project Type**: Single-page web app

**Performance Goals**: N/A (one extra column on a table of ≤ ~25 rows)

**Constraints**: No horizontal page scroll at phone width; colors only from `src/index.css` tokens; no Tailwind class names built from variables

**Scale/Scope**: 2 source files, 2 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static Hosting Only | Pass | Client-side rendering change only; no backend. |
| II. Data Prepared at Build Time | Pass | Uses `blk` and `mpg` already in committed processed data; no runtime third-party calls. |
| III. Base-Path-Safe Navigation | Pass | No routing or asset path changes. |
| IV. Respectful Data Collection | Pass | No scraping; no raw data read by app code. |
| V. Simplicity | Pass | No new dependencies. Removes the now-unused `lowerIsBetter` branch. |
| UI & Styling | Pass | Gray uses existing `text-muted-foreground` token; no new colors. |
| Data Validation | Pass | Schema unchanged; `blk` and `mpg` are already validated. |

Confirmed: the feature requires no backend and no runtime third-party calls.

**Post-design re-check**: Pass, no changes.

## Project Structure

### Documentation (this feature)

```text
specs/019-roster-blocks-minutes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── roster-pane.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/components/
├── statRating.ts         # RatedStat: tov → blk; blk breakpoints; isRatable(); drop lowerIsBetter
├── statRating.test.ts    # blk thresholds; isRatable cutoffs; remove tov cases
├── RosterPane.tsx        # MIN column; BLK replaces TOV; gray unrated cells; key text
└── RosterPane.test.tsx   # columns, gray cells, key accessible name
```

**Structure Decision**: Existing single-project layout; all changes in `src/components/`.

## Complexity Tracking

No violations.
