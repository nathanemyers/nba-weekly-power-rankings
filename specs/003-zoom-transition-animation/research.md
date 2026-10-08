# Research: Animated Zoom Transition

No `NEEDS CLARIFICATION` items remained in Technical Context. The decisions below cover the
animation technique and its edge-case handling.

## 1. Animating by tweening scale parameters, not visuals

- **Decision**: Animate by interpolating the x-scale's own inputs — `start` (first visible week)
  and `span` (how many weeks the plot width currently represents) — from their pre-toggle values
  to their post-toggle values over a fixed duration, re-rendering each frame with the same
  `x()`/`y()` coordinate functions `Chart.tsx` already uses for static rendering.
- **Rationale**: Since both the windowed and full-season renderings already come from the same
  `x()`/`y()` functions (per `002-view-full-season`'s research §3 — it generalized the scale
  rather than building a parallel rendering path), tweening their *inputs* means every
  intermediate frame is rendered by the exact same code as the two static end states. This
  guarantees FR-004 (identical end state) by construction — there's no second "animated"
  geometry that could drift from the real one. It also keeps text labels, tick marks, and stroke
  widths at their normal, correctly computed sizes throughout the animation, since nothing is
  being visually stretched — only the underlying week/rank numbers feeding the plot change.
- **Alternatives considered**: Animate an SVG `transform` (`scale`/`translate`) on a wrapping
  `<g>` around statically-computed full-season coordinates — rejected because team labels, tick
  text, and stroke widths would scale along with the data unless individually counter-scaled,
  adding real complexity for a cosmetic trade that the scale-parameter approach avoids outright.
  Animating the `d` attribute of each line path directly via the newer CSS `d` property — rejected
  due to inconsistent/newer browser support for path-level CSS animation versus the universal
  support for re-rendering numbers every frame; also harder to unit test than a plain
  interpolation function.

## 2. Where the tween logic lives

- **Decision**: Extract the interpolation math (`progress: number -> { start, span }`) and the
  `requestAnimationFrame` loop driving it into a new `useZoomTransition.ts` hook, consumed by
  `Chart.tsx`. The hook watches the `zoomedOut` prop (already defined by `002`) and starts a tween
  whenever it changes.
- **Rationale**: Keeps `Chart.tsx` focused on rendering, and makes the actual math — the part
  with real edge cases (easing, retargeting mid-flight, reduced motion) — unit-testable as a pure
  function without rendering the full chart component for every test case.
- **Alternatives considered**: Inline `useEffect`/`useState` directly in `Chart.tsx` — would work,
  but mixes animation bookkeeping into an already-large component and makes the interpolation math
  harder to test in isolation.

## 3. No animation library

- **Decision**: Use only native `requestAnimationFrame`/`cancelAnimationFrame` for the loop and
  a simple eased interpolation (e.g., ease-in-out) computed by hand — no `d3-transition`,
  `framer-motion`, `react-spring`, or similar.
- **Rationale**: The entire animation is "interpolate two numbers over a few hundred
  milliseconds," which a few lines of math and a `requestAnimationFrame` loop handle completely.
  Constitution V requires new dependencies to be justified by a need the current stack can't
  reasonably meet — that bar isn't met here.
- **Alternatives considered**: `framer-motion` or `react-spring` — both are general-purpose
  animation libraries whose value (spring physics, gesture handling, layout animation) is far
  beyond what a single numeric tween needs; `d3-transition` — would pull in d3 for one interpolate
  call, when the project otherwise has no d3 dependency at all.

## 4. Reduced motion

- **Decision**: Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` when a
  tween would start; if true, set `start`/`span` to their target values immediately (duration 0)
  instead of animating.
- **Rationale**: This is the standard, zero-dependency way browsers expose this preference, and
  directly satisfies FR-005/SC-003 with a single conditional.
- **Alternatives considered**: An in-app "reduce motion" toggle — out of scope per spec
  Assumptions; this project has no settings surface today and the OS/browser signal already
  covers the need.

## 5. Interrupting an in-progress animation

- **Decision**: Store the animation's current, continuously-updated `start`/`span` (not just its
  original starting values) in the hook's state. When `zoomedOut` changes again before a tween
  finishes, the next tween's "from" values are read from wherever the current one left off, and
  it retargets toward the new destination from there — rather than queuing, blocking, or jumping
  back to the pre-animation state first.
- **Rationale**: This is the standard "interruptible tween" pattern and directly satisfies
  FR-006: the chart always animates smoothly from its true current visual state toward whatever
  the latest toggle requested, with no stacked or stale animations.
- **Alternatives considered**: Ignoring new toggle input until the current animation finishes —
  rejected; FR-006 explicitly requires the new input to be handled smoothly, not dropped.
  Snapping instantly back to the pre-animation state before starting the reverse tween — rejected;
  it would reintroduce exactly the jump-cut feeling this feature exists to remove.

## 6. Test strategy for time-based behavior

- **Decision**: Unit-test the pure `progress -> { start, span }` interpolation function directly
  (no timers needed — it's a plain function of a number). For the `requestAnimationFrame` loop
  itself, use Vitest's fake timers together with a mocked `requestAnimationFrame` (stepping it
  manually in tests) to assert: the animation reaches exactly the target `start`/`span` when
  finished, a mid-flight retarget produces continuous (not jumpy) values, and
  `prefers-reduced-motion: reduce` (mocked via `matchMedia`) skips straight to the target.
- **Rationale**: Matches the constitution's testing requirement (v1.1.0) without making the
  suite slow or flaky — no real `setTimeout`/animation-frame delays run during tests.
