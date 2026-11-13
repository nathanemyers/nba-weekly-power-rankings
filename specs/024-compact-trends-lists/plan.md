# Implementation Plan: Compact Trends Lists

**Branch**: `024-compact-trends-lists` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-compact-trends-lists/spec.md`

## Summary

Replace the Trends tab's large logo-plus-minimap cards (3 risers, 3 fallers, wrapped horizontally) with two compact vertical lists of exactly 5 teams each. Each row is a single-line toggle: small logo (`size-5`, matching storylines and player history), team name, a shrunken `TrendMinimap`, and a signed rank-change number. Lists sit side by side from the `sm` breakpoint and stack (improving first) below it. The change is confined to `RankSwings.tsx`, the two ranking helpers in `src/data/analysis.ts`, and the Trends availability check in `DetailTabs.tsx`.

## Technical Context

**Language/Version**: TypeScript 5 / React 19

**Primary Dependencies**: Tailwind CSS, shadcn/ui (`Toggle`), Redux Toolkit (pinned teams slice), existing `TrendMinimap` and `TeamLogo` components

**Storage**: N/A (reads already-loaded season data from the route loader)

**Testing**: Vitest + Testing Library (`npm test`)

**Target Platform**: Static site on GitHub Pages, modern desktop and mobile browsers

**Project Type**: Single-page web app (frontend only)

**Performance Goals**: N/A; at most 10 rows of trivial SVG

**Constraints**: No horizontal overflow at 375px; no new colors outside `src/index.css`; no Tailwind class names built from variables; `cursor-pointer` on rows

**Scale/Scope**: 1 component rewritten, 2 helpers adjusted, 1 availability check changed, tests updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Static Hosting Only | Pass | Pure client rendering; no backend. |
| II. Data Prepared at Build Time | Pass | Uses existing processed season data; no runtime third-party calls. |
| III. Base-Path-Safe Navigation | Pass | No routing or asset path changes. |
| IV. Respectful Data Collection | Pass | No scraping changes. |
| V. Simplicity | Pass | No new dependencies; reuses `Toggle`, `TeamLogo`, `TrendMinimap`, existing `rank-*` colors. |
| Tech constraints (Tailwind + shadcn, Redux for pinned teams, Zod at boundaries) | Pass | Selection still flows through `setPinnedTeams`; no new trust boundary. |

Post-design re-check: still passes; design adds no dependencies, routes, or data files.

## Project Structure

### Documentation (this feature)

```text
specs/024-compact-trends-lists/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── trends-lists-ui.md
└── tasks.md             # /speckit-tasks output
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── analysis.ts              # 5-team default, deterministic tie-break, single-ranking guard
│   └── analysis.test.ts         # new: ordering, count, tie-break
├── components/
│   ├── RankSwings.tsx           # rewritten as two compact vertical lists
│   ├── RankSwings.test.tsx      # new: rows, order, selection, layout classes
│   ├── DetailTabs.tsx           # Trends available whenever season has teams
│   ├── DetailTabs.test.tsx      # adjust Trends availability / pin test if needed
│   └── TrendMinimap/            # unchanged; sized by caller via className/width/height
```

**Structure Decision**: Single frontend project; all changes live in existing `src/components` and `src/data` files plus colocated tests.

## Complexity Tracking

No constitution violations.
