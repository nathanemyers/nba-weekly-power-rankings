# Research: Animated Chart Transitions (Zoom and Pan)

No `NEEDS CLARIFICATION` items remained in Technical Context. The decisions below cover the
animation technique and its edge-case handling, including the scope amendment that extended this
feature from the zoom toggle alone to also cover panning (Earlier/Later and arrow-key
navigation) and team-label repositioning.

## 1. One trigger condition covers both zoom and pan

- **Decision**: Don't special-case "zoom toggled" vs. "panned" as two different triggers. Each
  render, `Chart.tsx` already computes a target `(effectiveStart, effectiveSpan)` pair from
  `zoomedOut`/`start`/`windowWeeks`/`maxWeek` (per `002-view-full-season`'s research §3). Animate
  by interpolating *to whatever this target pair currently is*, from wherever the chart was
  previously rendered, over a fixed duration using `requestAnimationFrame` and re-rendering each
  frame with the same `x()`/`y()` coordinate functions used for static rendering. Whether the
  target changed because `zoomedOut` flipped or because `start` was paged makes no difference to
  the animation itself.
- **Rationale**: This one mechanism satisfies FR-001/FR-002 (zoom) and FR-007 (pan) identically,
  with no duplicated logic. Because every intermediate frame is rendered by the exact same code
  as the two static end states, the animated end state is guaranteed identical to the
  non-animated target (FR-004) by construction. It also means the Earlier/Later `onClick`
  handlers and the keyboard-arrow `useEffect` in `Chart.tsx` need **no changes at all** — they
  already call `setStart` synchronously and immediately (so button-disabled bounds and "where the
  visitor currently is" stay instantly correct); only the *rendering* layer changes from reading
  that target directly to reading an animated approach toward it.
- **Alternatives considered**: Animate an SVG `transform` (`scale`/`translate`) on a wrapping
  `<g>` around statically-computed full-season coordinates — rejected because team labels, tick
  text, and stroke widths would scale along with the data unless individually counter-scaled.
  Animating the `d` attribute of each line path directly via the newer CSS `d` property —
  rejected due to inconsistent/newer browser support versus the universal support for
  re-rendering numbers every frame; also harder to unit test than a plain interpolation
  function. Treating pan and zoom as two separate tween state machines — rejected as needless
  duplication once it was clear both reduce to "animate toward the current target pair."

## 2. Where the tween logic lives

- **Decision**: Extract the interpolation math and the `requestAnimationFrame` loop into a new
  `useChartTransition.ts` hook (renamed from the zoom-only `useZoomTransition` originally
  planned, to reflect the broadened scope), consumed by `Chart.tsx`. The hook watches the
  computed target `(start, span)` pair described in §1 and starts or retargets a tween whenever
  it changes. It exposes `{ fromStart, fromSpan, toStart, toSpan, progress, reducedMotion }` —
  not just the live-interpolated `start`/`span` — so `Chart.tsx` can also use `fromStart`/
  `fromSpan`/`toStart`/`toSpan`/`progress` to interpolate team-label positions itself (§8), which
  need different math than the scale does.
- **Rationale**: Keeps `Chart.tsx` focused on rendering, and makes the actual math — the part
  with real edge cases (easing, retargeting mid-flight, reduced motion) — unit-testable as a pure
  function without rendering the full chart component for every test case. Exposing the raw
  from/to/progress fields (rather than only a pre-computed `start`/`span`) is what lets the same
  hook drive two different kinds of interpolation (continuous scale math, and discrete-lookup
  label math) without duplicating the timing/easing/interruption logic for each.
- **Alternatives considered**: Inline `useEffect`/`useState` directly in `Chart.tsx` — would work,
  but mixes animation bookkeeping into an already-large component and makes the interpolation math
  harder to test in isolation. A hook that only returns the final interpolated `start`/`span` —
  rejected once label tweening (§8) turned out to need the from/to endpoints and raw `progress`
  too, not just the live scale values.

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
  original starting values) in the hook's state. When the target pair (§1) changes again before
  a tween finishes — whether from the zoom toggle or another pan — the next tween's "from" values
  are read from wherever the current one left off, and it retargets toward the new destination
  from there — rather than queuing, blocking, or jumping back to the pre-animation state first.
  The same rule applies to label positions (§8): a retarget re-reads each label's *currently
  interpolated* Y as its new starting point, not its pre-transition Y.
- **Rationale**: This is the standard "interruptible tween" pattern and directly satisfies
  FR-006 (zoom) and FR-010 (pan): the chart always animates smoothly from its true current visual
  state toward whatever the latest toggle or pan requested, with no stacked or stale animations.
- **Alternatives considered**: Ignoring new input until the current animation finishes — rejected;
  FR-006/FR-010 explicitly require new input to be handled smoothly, not dropped. Snapping
  instantly back to the pre-animation state before starting the reverse tween — rejected; it
  would reintroduce exactly the jump-cut feeling this feature exists to remove.

## 6. Test strategy for time-based behavior

- **Decision**: Unit-test the pure `progress -> { start, span }` interpolation function directly
  (no timers needed — it's a plain function of a number). For the `requestAnimationFrame` loop
  itself, use Vitest's fake timers together with a mocked `requestAnimationFrame` (stepping it
  manually in tests) to assert: the animation reaches exactly the target `start`/`span` when
  finished, a mid-flight retarget produces continuous (not jumpy) values, and
  `prefers-reduced-motion: reduce` (mocked via `matchMedia`) skips straight to the target.
- **Rationale**: Matches the constitution's testing requirement (v1.1.0) without making the
  suite slow or flaky — no real `setTimeout`/animation-frame delays run during tests.

## 7. Avoiding the `set-state-in-effect` lint failure `002` already hit

- **Decision**: Only call `setState` from inside the `requestAnimationFrame` callback itself
  (an async callback fired by an external system — the browser's frame scheduler), never
  synchronously in the body of the effect that starts the loop.
- **Rationale**: Implementing `002-view-full-season`'s hover-clearing logic as a plain
  `useEffect(() => { setHover(null) }, [zoomedOut])` tripped
  `eslint-plugin-react-hooks`'s `set-state-in-effect` rule, which specifically flags synchronous
  `setState` in an effect body and was resolved there by switching to a render-time state
  adjustment instead. A `requestAnimationFrame` loop is different: the effect's job is to
  *subscribe* to the browser's frame callback (`window.requestAnimationFrame`) and call
  `cancelAnimationFrame` on cleanup — exactly the "subscribe for updates from an external system,
  call setState in a callback" pattern the rule's own message recommends — so calling `setState`
  inside each frame's callback (not in the effect body) should not retrigger that rule. Calling
  out this precedent now avoids rediscovering the same lint failure mid-implementation.
- **Alternatives considered**: None — this is a documented constraint carried over from this
  exact codebase, not an open design choice.

## 8. Team-label position tweening is a separate interpolation from the line scale

- **Decision**: A team-name label's vertical position comes from `team.rankings.find(r =>
  inWindow(r.week))` — the team's *first ranked week currently in view* — which is a discrete
  lookup over integer weeks, not a continuous function of `start`/`span` the way `x()` is for
  line points. Sweeping `effectiveStart` smoothly through the tween does *not* make this lookup's
  result change smoothly — it changes in a single jump at whichever instant the sweeping window
  boundary crosses an integer week. So label motion is tweened as its own, separate interpolation:
  when a transition begins, `Chart.tsx` computes each team's `fromY` (using the window in effect
  *before* this transition) and `toY` (using the target window it's animating *to*) once, and
  then renders `lerp(fromY, toY, easedProgress)` every frame using the same `progress` the hook
  already exposes (§2) — independent of exactly when the discrete week-boundary crossing would
  "naturally" happen.
- **Rationale**: FR-008 requires labels to "animate smoothly ... rather than jumping immediately."
  A label whose position merely fell out of the swept scale would jump once, abruptly, mid-tween
  — satisfying "it eventually gets there" but not "smoothly." Decoupling label position into its
  own from/to/progress interpolation, reusing the exact same `progress` curve as the scale tween,
  makes both animations start and finish in lockstep while each uses the math appropriate to its
  own data shape.
- **Scope beyond FR-008's literal wording**: FR-008 is written in terms of panning, but the same
  discrete-lookup issue equally affects the *zoom* toggle (switching to full-season view can also
  change which week is a team's first in view). This plan applies the identical label-tweening
  mechanism to both triggers — it's the same few lines of math either way, and leaving zoom-toggle
  labels jumping while pan labels glide would be an inconsistent, lower-quality result for no
  implementation savings.
- **Alternatives considered**: Letting label position fall out incidentally from the swept scale
  (no separate tween) — rejected per the jump-not-glide problem above. Tweening every team's
  `rank` value directly instead of its pixel `y` — equivalent in effect since `y()` is linear in
  `rank`, but tweening the already-computed pixel value is one fewer function call per frame and
  avoids re-deriving `rank` from an interpolated, possibly-fractional intermediate value that was
  never actually "a rank."
