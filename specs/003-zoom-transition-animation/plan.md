# Implementation Plan: Animated Chart Transitions (Zoom and Pan)

**Branch**: `003-zoom-transition-animation` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-zoom-transition-animation/spec.md`

**Depends on**: `002-view-full-season` — this feature animates the zoom toggle and the
Earlier/Later/arrow-key panning that spec introduces (`zoomedOut`/`start`, windowed ↔
full-season rendering). `002` is fully implemented and merged into this branch
(`src/Chart/Chart.tsx` has `zoomedOut`/`onToggleZoom`/`windowWeeks` props, and the generalized
scale already computes `effectiveStart`/`effectiveSpan` exactly as anticipated below), so `003`
is unblocked and can proceed straight to implementation.

**Amendment**: This plan originally covered only the zoom toggle. It's now revised to also cover
panning and team-label repositioning, per the spec's own amendment — see research.md §1 and §8
for the resulting design, which turned out to unify both triggers under one mechanism rather than
needing two.

## Summary

Animate the chart's visible week window — whether it changes because the visitor toggled zoom
or paged with Earlier/Later/arrow keys — by tweening the x-scale's own parameters, `Chart.tsx`'s
`effectiveStart` and `effectiveSpan`, over a short duration using `requestAnimationFrame`,
instead of snapping to the new values instantly. Because every frame of the animation calls the
exact same `x()`/`y()` coordinate functions already used for static rendering, the animated end
state is guaranteed identical to the non-animated target state (FR-004) with no separate code
path to keep in sync. Team-name labels, whose position is a discrete "first visible ranked week"
lookup rather than a continuous function of the scale, get their own from/to/progress
interpolation using the same timing (research.md §8), so they glide to their new position
instead of jumping. No animation library or new runtime dependency is introduced — only the
browser's native `requestAnimationFrame` and `prefers-reduced-motion` media query. This is purely
internal to `Chart.tsx`; it does not change the `App.tsx` ↔ `Chart.tsx` prop contract `002`
defined, and the Earlier/Later `onClick`/keyboard handlers need no changes at all — only how
`Chart.tsx` renders the resulting target changes, from instant to tweened.

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
end state (for both the zoom toggle and panning) and that `prefers-reduced-motion` skips it; a
separate test fixture with a team whose first-visible-ranked-week changes across a pan verifies
its label animates rather than jumps

**Target Platform**: Modern desktop and mobile browsers, served statically via GitHub Pages
(unchanged)

**Project Type**: Single-page static web application (unchanged)

**Performance Goals**: Sustain a visually smooth transition (no dropped-frame stutter perceptible
to a visitor) for ~30 teams' lines plus up to 30 labels over a sub-second duration — well within
`requestAnimationFrame` + SVG capability at this data scale; this is the one genuinely new
performance concern this feature introduces, since prior features never re-rendered on every
animation frame

**Constraints**: No new runtime dependency (constitution V) — animation uses only native
browser APIs, not a charting/animation library; must not alter the final rendered state defined
by `002-view-full-season` (FR-004); must honor `prefers-reduced-motion` (FR-005, FR-009); must
not change the `App.tsx` ↔ `Chart.tsx` prop contract from `002-view-full-season`'s
`contracts/view-mode-interface.md`; must not require any change to the Earlier/Later `onClick`
handlers or the keyboard-arrow effect (research.md §1)

**Scale/Scope**: Entirely within `src/Chart/Chart.tsx` and a new co-located hook (plus their test
file); no changes to `App.tsx`, no new data entities, no new cross-component contract

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Static Hosting Only | Pure client-side animation state; no server code, no new runtime calls | PASS |
| II. Data Prepared at Build Time | No new or changed data | PASS |
| III. Base-Path-Safe Navigation | Animation is in-memory render state, not a route; no server rewrites needed | PASS |
| IV. Respectful, Offline Collection | Not implicated | PASS |
| V. Simplicity | No new dependency of any kind — explicitly rejected an animation library in favor of native `requestAnimationFrame`/`matchMedia` (research.md §3); unifying zoom and pan under one tween mechanism (§1) and deriving label motion from that same hook's output (§8) avoids a second, parallel animation system | PASS |
| Quality gates | `npm run lint`, `npm run build`, and `npm test` (constitution v1.1.0) must pass; this feature adds tests for the tween logic (zoom and pan), the reduced-motion branch, and label-position interpolation | PASS |

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
change within `Chart.tsx`, reusing `002-view-full-season`'s existing `zoomedOut`/`start` state as
its trigger. `002`'s `contracts/view-mode-interface.md` still fully describes that boundary and
needs no amendment.

### Source Code (repository root)

```text
src/Chart/
├── Chart.tsx              # EDIT: feed the target (effectiveStart, effectiveSpan) pair — which
│                          #       changes from either the zoomedOut prop or the start state —
│                          #       into useChartTransition; render each frame using its
│                          #       interpolated start/span via the existing x()/y() functions;
│                          #       compute each team-label's fromY/toY once per transition and
│                          #       render lerp(fromY, toY, progress) (research.md §8); skip to the
│                          #       target immediately when prefers-reduced-motion is set
├── Chart.test.tsx         # EDIT: add animation-specific tests (reaches correct end state for
│                          #       both zoom and pan, reduced-motion skips it, re-triggering
│                          #       mid-animation retargets smoothly, a label with a changing
│                          #       first-visible-week animates rather than jumps) alongside the
│                          #       `002` interaction tests already there
└── useChartTransition.ts  # NEW: small hook/pure-function pair — progress→interpolated
                           #       start/span math (unit-testable in isolation) plus the rAF loop
                           #       that drives it, extracted out of Chart.tsx to keep the tween
                           #       logic testable without rendering the whole component for every
                           #       test. Renamed from the originally-planned
                           #       `useZoomTransition.ts` now that it also drives pan animation.
```

**Structure Decision**: Keep the existing single-project Vite/React layout. The only new file is
a small, co-located hook (`useChartTransition.ts`) extracting the interpolation math and
animation-frame loop out of `Chart.tsx`, so the math can be unit-tested directly and `Chart.tsx`
stays focused on rendering (including the label-position math, which depends on `teams` data the
hook itself doesn't need to know about). No new top-level directories, no changes outside
`src/Chart/`.

## Complexity Tracking

No constitution violations; section intentionally empty.
