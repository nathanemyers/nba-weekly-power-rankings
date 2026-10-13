# Implementation Plan: Season Rank Swings Pane

**Branch**: `season-ai-summary` (spec dir `008-season-rank-swings`) | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-season-rank-swings/spec.md`

## Summary

For a completed season, show a pane under the chart listing the three biggest risers and three biggest fallers (more when tied), each as a clickable card with a minimap of that team's full-season trend line (colored green, yellow or red by which third of the rankings it is in) plus its first-week and last-week rank. The minimap is a standalone component intended for reuse beyond this pane. The swings are derived in the browser from the rankings the app already loads; no data files or scripts change. Clicking a card goes through the same pin handler the chart uses, and switching seasons now clears the pin.

## Technical Context

**Language/Version**: TypeScript 6.0 + React 19 (React Compiler enabled)

**Primary Dependencies**: Existing stack only (styled-components, lodash); no new dependencies

**Storage**: N/A — derived at render time from `src/data/seasons/<season>.json`

**Testing**: Vitest + Testing Library; pure swing selection unit-tested, pane behavior tested through `App`

**Target Platform**: Static site on GitHub Pages

**Project Type**: Single-page web app with build-time data scripts

**Performance Goals**: Highlight on click with no network request and no perceptible delay; derivation is one pass over at most 30 teams

**Constraints**: No runtime third-party calls; `AGENTS.md` code rules (no `useMemo`, no `Map`/`Set`, styled-components at the top of the file, minimal `useEffect`); pin state stays owned by `App`; the chart component is not modified

**Scale/Scope**: 9 seasons x 30 teams; 6 cards in seven of the stored seasons, 7 or 8 in the two with ties

## Constitution Check

| Principle | Status | Note |
|-----------|--------|------|
| I. Static hosting only | PASS | Pure client-side rendering of already-bundled data |
| II. Data prepared at build time | PASS | No new data; swings are computed from the bundled season JSON, not fetched |
| III. Base-path-safe navigation | PASS | No routing, URL or asset changes |
| IV. Respectful, offline data collection | PASS | No scraping and no script changes |
| V. Simplicity | PASS | No new dependency, no new state, inline SVG for the minimap |
| No secrets in client bundle | PASS | None involved |
| Quality gates | PASS | `npm run lint`, `npm run build`, `npm test` cover the new code |

Re-checked after design: no change.

## Project Structure

### Documentation (this feature)

```text
specs/008-season-rank-swings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rank-swings-ui.md
└── tasks.md              # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                        # `completed` from loadSeason; renders the pane; clears the pin on season change
├── App.test.tsx                   # pane shown/hidden, click pins, season switch clears
├── RankSwings/
│   ├── RankSwings.tsx             # NEW: the pane, two groups of cards
│   ├── utils.ts                   # NEW: getRankSwing, biggestSwings
│   └── utils.test.ts              # NEW
├── Chart/
│   ├── TrendMinimap.tsx           # NEW: miniature full-season trend line, not specific to swings
│   └── TrendMinimap.test.tsx      # NEW
└── test/fixtures.ts               # add a riser and an incomplete season to the fixtures
```

**Structure Decision**: The pane lives in a sibling folder to `Chart/`, mirroring its component + `utils.ts` layout. The minimap lives in `Chart/` because it is a miniature of the chart's zoomed-out line, shares `getYforRank`, and will be reused outside the pane (009 and later), so it carries no rank-swing knowledge. `App` renders the pane between the zoom control and `TeamSummary`, so the summary that appears on click does not push the pane away from the pointer.

## Complexity Tracking

No violations.
