# Implementation Plan: Chart Weekly-Summary Tooltip Fixes

**Branch**: `013-chart-tooltip-fixes` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-chart-tooltip-fixes/spec.md`

## Summary

This feature fixes two tooltip problems in `RankingsChart`.

1. **Pinned tooltips go missing.** Teams are painted in a fixed order, so lines painted after the pinned team can cover its dots. The fix paints the pinned team last, using a stable `sortBy`, which puts its line and dots on top.
2. **Right-edge tooltips are narrow.** These tooltips are anchored with `left`, which leaves them only a sliver of space before the chart edge. The fix anchors them with `right` instead. All tooltips are sized to their content up to a cap that fits on either side, and the side-flip threshold moves from 60% to 50% of the chart width.

Both fixes are confined to [src/components/Chart/Chart.tsx](../../src/components/Chart/Chart.tsx) and its tests.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.2

**Primary Dependencies**: Existing only: lodash (`sortBy`), Tailwind 4. Nothing new.

**Storage**: N/A

**Testing**: Vitest 5 with jsdom and @testing-library/react. jsdom has no layout, so pixel-level checks happen in the browser (see [quickstart.md](quickstart.md)).

**Target Platform**: Modern desktop and mobile browsers on GitHub Pages.

**Project Type**: Single-page static web app.

**Performance Goals**: No measurable change. One stable sort of 30 items per render.

**Constraints**: AGENTS.md rules apply: no `useMemo`, no new `useRef` or `useEffect`, Tailwind utility classes only (never built from variables), and runtime values go in `style`.

**Scale/Scope**: One component and its test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
| --- | --- | --- |
| I. Static Hosting Only | ✅ | Client-side rendering change only. |
| II. Data Prepared at Build Time | ✅ N/A | No data changes. |
| III. Base-Path-Safe Navigation | ✅ N/A | No routing or asset changes. |
| IV. Respectful Data Collection | ✅ N/A | No changes. |
| V. Simplicity | ✅ | No new dependencies. Uses CSS and existing lodash, not measurement code. |
| UI & Styling | ✅ | Tailwind classes are literal strings. Position values go in `style`. |
| State & Data Layer | ✅ | Pinned state still comes from the store through props. Hover stays local to the component. |
| Quality gates | ✅ | `lint`, `test` and `build` are in the quickstart. No routing or asset-path change needs a preview check. |

**Post-design re-check**: Passes. The design adds nothing beyond a sort and changes to the tooltip's style and classes.

## Project Structure

### Documentation (this feature)

```text
specs/013-chart-tooltip-fixes/
├── plan.md
├── research.md            # R1 layering, R2 width, R3 threshold, R4 testing
├── quickstart.md
├── contracts/chart-ui.md  # Observable DOM contract for tests
├── checklists/requirements.md
└── tasks.md               # /speckit-tasks output
```

There is no `data-model.md` because this feature introduces no data or state changes.

### Source Code (repository root)

```text
src/components/Chart/
├── Chart.tsx        # CHANGED: draw pinned teams last; right-anchored, content-sized tooltip; 50% flip
└── Chart.test.tsx   # CHANGED: layering and tooltip-placement tests per contracts/chart-ui.md
```

**Structure Decision**: Single project. All changes live in the existing Chart component folder.

## Complexity Tracking

No violations.
