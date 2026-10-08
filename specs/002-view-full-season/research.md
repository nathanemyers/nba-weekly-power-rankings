# Research: View Full Season (Zoom Out)

No `NEEDS CLARIFICATION` items remained in Technical Context. The decisions below cover the
implementation approach the plan depends on.

## 1. Where view-mode state lives

- **Decision**: Lift `zoomedOut` (boolean) state into `App.tsx`, above `RankingsChart`, and pass
  it down as a prop along with a toggle handler.
- **Rationale**: `App.tsx` remounts `RankingsChart` on every season change via `key={season}`
  (`src/App.tsx:116`), which resets all of `Chart.tsx`'s internal `useState`. US3/FR-010 require
  the zoom state to survive a season switch, so it cannot live inside the component that gets
  remounted.
- **Alternatives considered**: Keep `zoomedOut` inside `Chart.tsx` and drop the `key={season}`
  remount — rejected; the remount exists specifically so stale `pinned`/`hover` state from a
  previous season's teams can't leak into the next season, and removing it is a larger, riskier
  change than lifting one piece of state.

## 2. Configurable window width

- **Decision**: Export a `DEFAULT_WINDOW_WEEKS = 10` constant from `Chart.tsx` and accept an
  optional `windowWeeks` prop on `RankingsChart` (defaulting to that constant). Every place that
  currently hard-codes `VISIBLE_WEEKS` (the x-scale denominator, `maxStart`, the zoom-control
  visibility check) reads from this single value instead.
- **Rationale**: FR-004 requires the width to be configurable without touching unrelated
  behavior. A single constant with one override point satisfies this with no new abstraction
  (constitution V, Simplicity) — changing the default, or passing a different `windowWeeks` prop
  from `App.tsx`, changes every dependent calculation consistently.
- **Alternatives considered**: A separate config file/module for chart constants — unnecessary
  indirection for a single value; environment variable — this is a compile-time UI constant, not
  deployment configuration, so it doesn't belong alongside the Vite `base` path config.

## 3. Full-season rendering

- **Decision**: Generalize the x-scale from a fixed `VISIBLE_WEEKS` span to a `span` that is
  `windowWeeks` in windowed mode or `maxWeek - 1` in full-season mode, with `start` pinned to `1`
  whenever `zoomedOut` is true. The `weeks` tick array becomes `[1..maxWeek]` instead of
  `[start..start+windowWeeks]` in that mode.
- **Rationale**: Reuses the exact same `x()`/`y()`/clip-path/grid rendering code for both modes —
  only the inputs change, not the rendering logic, which keeps the diff small and avoids a
  parallel "full season" rendering path that could drift from the windowed one (risking FR-005's
  "identical interactions" requirement).
- **Alternatives considered**: A second, separate `<svg>` block for full-season mode — rejected;
  doubles the surface area to maintain and makes keeping tooltip/hover/pin behavior identical
  (FR-005) harder to guarantee by construction.

## 4. Playoff end-column condition

- **Decision**: Change the existing `start === maxStart` condition that reveals the
  end-of-season playoff-medal column to `zoomedOut || start === maxStart`.
- **Rationale**: FR-006 requires this column to appear in full-season view exactly as it does at
  the last page of the windowed view. Since full-season mode always includes the season's last
  week, the column's existing condition just needs an `||` branch, not new logic.

## 5. Disabling paging while zoomed out

- **Decision**: Keep the Earlier/Later buttons rendered at all times, but `disabled` whenever
  `zoomedOut` is true (in addition to their existing `start === 1`/`start >= maxStart` bounds
  checks); the keyboard-arrow `useEffect` handler stays a no-op when `zoomedOut` is true.
- **Rationale**: FR-009 requires paging to be inactive with no partial window to page through.
  The original design hid the buttons instead of disabling them, but that made the `Controls`
  row's width — and therefore the layout — change on every zoom toggle. Keeping the buttons
  mounted and merely disabled avoids that layout shift, at the cost of a slightly less explicit
  mode signal; FR-002's "clearly indicate the active mode" requirement is still met by the
  `WeekRange` label switching to "Full season" and the zoom button's own label.
- **Alternatives considered**: Hiding the buttons (the original decision) — reverted because it
  caused the controls row to visibly jump width on toggle, which is worse UX than a disabled
  button that simply does nothing.

## 6. Tooltip handling across a mode switch

- **Decision**: Clear `hover` state (but not `pinned`) whenever the zoom toggle fires.
- **Rationale**: The spec's tooltip edge case requires the tooltip to close or update rather
  than point at a stale position. Clearing `hover` is the simplest correct behavior — the next
  real mouse move re-triggers it at the correct position. `pinned` is left untouched because
  FR-008 requires the pinned team to survive the switch, and pinning is independent of cursor
  position.

## 7. Recomputing zoom-control visibility

- **Decision**: Compute `canZoomOut = maxWeek > windowWeeks` directly from the `maxWeek` prop
  passed into `Chart.tsx` on every render — not cached in state, not computed once per season.
- **Rationale**: The spec requires this to be re-evaluated every time a season's data loads
  (including a future in-progress season whose `maxWeek` grows week over week), never fixed at
  first load. Deriving it inline from existing props each render satisfies this by construction,
  with no memoization bug to worry about.

## 8. Test framework and tooling

- **Decision**: Adopt Vitest (explicitly requested) as the project's first test runner,
  configured via the `test` block of `vite.config.ts` (`environment: 'jsdom'`, `globals: true`,
  a `setupFiles` entry registering `@testing-library/jest-dom`). Pair it with
  `@testing-library/react` and `@testing-library/user-event` to test `RankingsChart` by
  simulated user behavior (click the zoom toggle, press arrow keys, hover a data point) rather
  than by reaching into component internals. Add an `npm test` script (`vitest run`).
- **Rationale**: Vitest reuses Vite's existing transform pipeline, so it needs no parallel
  TypeScript/JSX/bundler configuration — the smallest-footprint option for a Vite project
  (constitution V, Simplicity). Most of this feature's functional requirements (FR-002, FR-003,
  FR-005, FR-007–FR-010) describe *interactive* behavior — what a visitor can do and see — not
  pure functions, so meaningfully testing them requires rendering the component and dispatching
  events; Testing Library is the standard, minimal pairing for that with Vitest. All of these are
  dev-only dependencies that never reach the shipped `dist/` bundle, so they don't conflict with
  constitution V's "no new dependencies without justification" for the *runtime* stack.
- **Alternatives considered**: Jest — would require its own TypeScript/JSX transform
  configuration duplicating what Vite already does, for no benefit on a Vite project, and wasn't
  the framework requested. Testing only extracted pure functions (e.g., the x-scale math,
  `canZoomOut`) without rendering components — insufficient on its own, since several FRs are
  only observable through rendered, interactive component behavior (pin persistence across a
  toggle, paging controls disappearing, keyboard panning becoming inert). Playwright/end-to-end
  browser tests — heavier and slower than needed to verify this feature's component-level
  interaction logic; worth reconsidering only if the project later wants real cross-browser or
  full-page coverage.
