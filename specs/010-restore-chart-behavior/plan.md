# Implementation Plan: Restore Chart Behavior After Refactor

**Branch**: `refactor` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-restore-chart-behavior/spec.md`

## Summary

The `refactor` branch moved view state into `App`, turned `RankingsChart` into a prop-driven display component, extracted `TeamLabels`, and introduced shared enums in `src/types.ts`. Along the way it dropped the transition hook, keyboard panning, the week readout, hover highlighting, unpinning, week-number label lookup, two playoff-stage values, and the right-edge medal column, and left the test suite on the old API. This plan re-attaches each lost behavior to the place the new structure says it belongs, without moving state back into the chart.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19

**Primary Dependencies**: Vite, styled-components, lodash (already added by the refactor)

**Storage**: N/A (bundled JSON under `src/data/seasons/`)

**Testing**: Vitest + Testing Library (jsdom)

**Target Platform**: Static site on GitHub Pages

**Project Type**: Single-page web app

**Performance Goals**: 300 ms transitions at display refresh rate

**Constraints**: `AGENTS.md` code rules — no `useMemo`, minimal `useEffect`, no `useRef` state, styled-components at top of file, objects/arrays only, one-sentence comments

**Scale/Scope**: 4 source files, 2 test files; 30 teams x ~25 weeks x 9 seasons

## Constitution Check

| Principle | Status | Note |
|-----------|--------|------|
| I. Static hosting only | PASS | Client-only changes |
| II. Data prepared at build time | PASS | Data files untouched; the enum is corrected to match them |
| III. Base-path-safe navigation | PASS | No routing or asset changes |
| IV. Respectful data collection | PASS | No scraper changes |
| V. Simplicity | PASS | No new dependencies; reuses the existing transition hook |
| Quality gates | PASS (target) | `npm run lint`, `npm run build`, `npm test` currently fail and must pass |

Re-checked after design: no change.

## Project Structure

### Documentation (this feature)

```text
specs/010-restore-chart-behavior/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/chart-props.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── App.tsx                   # owns season, zoomedOut, zoomedInStartWeek/zoomedInEndWeek, pinnedTeams; paging/zoom controls; arrow keys
├── App.test.tsx              # NEW: navigation, pinning, season switch (season data mocked with fixtures)
├── types.ts                  # PlayoffStage values corrected to match data
└── Chart/
    ├── Chart.tsx             # display component; runs useChartTransition on startWeek/endWeek; hover + tooltip
    ├── Chart.test.tsx        # rewritten against the prop-driven API
    ├── TeamLabels.tsx        # labels + left medals, positioned from the transition endpoints
    ├── useChartTransition.ts # unchanged
    └── utils.ts              # getYforRank, PLAYOFF_MEDALS, firstRankingInRange
```

**Structure Decision**: Keep the refactor's layout exactly; the only new file is `src/App.test.tsx`, because navigation state now lives in `App` and must be tested there.

## Complexity Tracking

No violations.
