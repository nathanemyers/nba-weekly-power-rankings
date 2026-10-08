# Implementation Plan: Animated Zoom Transition

**Branch**: `003-zoom-transition-animation` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-zoom-transition-animation/spec.md`

**Depends on**: `002-view-full-season` must be implemented first — this feature animates the
zoom toggle that spec introduces (`zoomedOut` prop, windowed ↔ full-season rendering). As of
this plan, `002`'s code changes have not yet landed in `src/Chart/Chart.tsx`/`src/App.tsx` (only
its spec/plan artifacts exist); implementation of `003` is blocked on `002`'s implementation.

## Summary

Animate the chart's existing (per `002-view-full-season`) toggle between windowed and
full-season view by tweening the x-scale's own parameters — the visible week range (`start` and
`span`) — over a short duration using `requestAnimationFrame`, instead of snapping to the new
values instantly. Because every frame of the animation calls the exact same coordinate functions
already used for static rendering, the animated end state is guaranteed identical to the
non-animated target state (FR-004) with no separate code path to keep in sync. No animation
library or new runtime dependency is introduced — only the browser's native `requestAnimationFrame`
and `prefers-reduced-motion` media query. This is purely internal to `Chart.tsx`; it does not
change the `App.tsx` ↔ `Chart.tsx` prop contract `002` defined.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19 (unchanged)

**Primary Dependencies**: React 19, styled-components 6 — no new dependencies, runtime or dev.
Uses only native `requestAnimationFrame`/`cancelAnimationFrame` and
`window.matchMedia('(prefers-reduced-motion: reduce)')`

**Storage**: N/A — no data or persisted state; animation progress is transient in-memory
component state

**Testing**: Vitest + `@testing-library/react`/`user-event` (constitution v1.1.0, introduced by
`002-view-full-season`). The tween's pure math (progress → interpolated `start`/`span`) is
extracted into a plain function so it can be unit-tested without faking timers; a small number of
component tests fake `requestAnimationFrame`/time to assert the animation reaches the correct
end state and that `prefers-reduced-motion` skips it

**Target Platform**: Modern desktop and mobile browsers, served statically via GitHub Pages
(unchanged)

**Project Type**: Single-page static web application (unchanged)

**Performance Goals**: Sustain a visually smooth transition (no dropped-frame stutter perceptible
to a visitor) for ~30 teams' lines over a sub-second duration — well within `requestAnimationFrame`
+ SVG capability at this data scale; this is the one genuinely new performance concern this
feature introduces, since prior features never re-rendered on every animation frame

**Constraints**: No new runtime dependency (constitution V) — animation uses only native
browser APIs, not a charting/animation library; must not alter the final rendered state defined
by `002-view-full-season` (FR-004); must honor `prefers-reduced-motion` (FR-005); must not
change the `App.tsx` ↔ `Chart.tsx` prop contract from `002-view-full-season`'s
`contracts/view-mode-interface.md`

**Scale/Scope**: Entirely within `src/Chart/Chart.tsx` (plus its test file); no changes to
`App.tsx`, no new data entities, no new cross-component contract

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Static Hosting Only | Pure client-side animation state; no server code, no new runtime calls | PASS |
| II. Data Prepared at Build Time | No new or changed data | PASS |
| III. Base-Path-Safe Navigation | Animation is in-memory render state, not a route; no server rewrites needed | PASS |
| IV. Respectful, Offline Collection | Not implicated | PASS |
| V. Simplicity | No new dependency of any kind — explicitly rejected an animation library in favor of native `requestAnimationFrame`/`matchMedia` (research.md §1, §3) | PASS |
| Quality gates | `npm run lint`, `npm run build`, and `npm test` (constitution v1.1.0) must pass; this feature adds tests for the new tween logic and reduced-motion branch | PASS |

**Post-design re-check (after Phase 1)**: All gates still PASS. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-zoom-transition-animation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
└── quickstart.md        # Phase 1 output
```

No `contracts/` directory: this feature introduces no new interface crossing the `App.tsx` ↔
`Chart.tsx` boundary (or any other component boundary) — it's an internal rendering behavior
change within `Chart.tsx`, reusing `002-view-full-season`'s existing `zoomedOut` prop as its
trigger. `002`'s `contracts/view-mode-interface.md` still fully describes that boundary and
needs no amendment.

### Source Code (repository root)

```text
src/Chart/
├── Chart.tsx             # EDIT: on `zoomedOut` prop change, tween the x-scale's `start`/`span`
│                         #       from their current values to the new mode's target values over
│                         #       a short duration via requestAnimationFrame, re-rendering each
│                         #       frame with the existing x()/y() functions; skip the tween (jump
│                         #       straight to target) when prefers-reduced-motion is set
├── Chart.test.tsx        # EDIT: add animation-specific tests (reaches correct end state,
│                         #       reduced-motion skips it, re-toggling mid-animation retargets
│                         #       smoothly) alongside the `002` interaction tests already there
└── useZoomTransition.ts  # NEW: small hook/pure-function pair — progress→interpolated params
                          #       math (unit-testable in isolation) plus the rAF loop that drives
                          #       it, extracted out of Chart.tsx to keep the tween logic testable
                          #       without rendering the whole component for every test
```

**Structure Decision**: Keep the existing single-project Vite/React layout. The only new file is
a small, co-located hook (`useZoomTransition.ts`) extracting the interpolation math and
animation-frame loop out of `Chart.tsx`, so the math can be unit-tested directly and `Chart.tsx`
stays focused on rendering. No new top-level directories, no changes outside `src/Chart/`.

## Complexity Tracking

No constitution violations; section intentionally empty.
