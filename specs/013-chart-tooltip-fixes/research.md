# Research: Chart Weekly-Summary Tooltip Fixes

## R1. Why pinned tooltips go missing

- **Finding**: In [Chart.tsx](../../src/components/Chart/Chart.tsx), every team is drawn in `props.teams` order, which is the `Teams` order. Each team's group contains, in order:
  - its visible line,
  - a 14 px-wide transparent "hit" path,
  - its dots, when the team is active.

  SVG has no z-index; whatever is painted later sits on top. If a team that comes later in `Teams` has a line near the pinned team's dot, that line's hit path covers the dot, and its `onMouseEnter` sets `hover.teamId` to the other team. The tooltip only shows when `hover.teamId` is in `activeTeams`, so it disappears.

- **Decision**: Paint the pinned team(s) last. Before mapping over the teams, reorder them with lodash `sortBy(props.teams, (t) => props.pinnedTeams.includes(t.teamId))`. `sortBy` is stable, so unpinned teams keep their current order (FR-003), and `false` sorts before `true`.

- **Rationale**:
  - It's one line in the place where the bug happens.
  - React reconciles by `key={team.teamId}`, so a re-pin only moves the DOM groups; no other state is touched.
  - lodash is already a dependency.
  - Hovering the pinned team's own hit path keeps whichever week is already hovered, as it does today. The pinned team's dots come after its own hit path within its group, so they stay hittable.

- **Alternatives**:
  - Draw the dots of every active team in a separate top layer above all the hit paths. Rejected: it duplicates the per-team rendering, and the pinned line itself would still sit under other lines, which goes against FR-001.
  - Set `pointer-events: none` on other teams' hit paths while a team is pinned. Rejected: it removes the hover highlight of other teams while pinned, which existing tests rely on ("keeps the pinned team highlighted while another team is hovered").
  - Also raise the hovered team when nothing is pinned. Rejected: see the spec's Assumptions about flicker.

## R2. Why right-edge tooltips are narrow and tall

- **Finding**: The tooltip is absolutely positioned with `left: x%`. On the right side it is then moved with `translate(calc(-100% - 14px), -50%)`. An absolutely positioned box with `width: auto` shrinks to fit the space between `left` and the containing block's right edge. Transforms are applied after layout, so the translate doesn't give back any width. At the last week (`x` is about 87.5% of the chart width), only about 12% of the width is available. The `max-w-80` cap never applies, and the text wraps into a tall column.

- **Decision**: Anchor the tooltip to the edge it opens away from, and size it to its content up to a cap that always fits.
  - **Right side:** `right: (1 − x/width)%` with `translate(-14px, -50%)`.
  - **Left side:** keep `left: x%` with `translate(14px, -50%)`.
  - **Width:** the class becomes `w-max max-w-[min(20rem,calc(50%-14px))]` in place of `max-w-80`. `w-max` makes the width depend only on the content, and the cap is the same on both sides (FR-005).

- **Rationale**:
  - Percentage `max-width` on an absolutely positioned box is measured against the containing block (the chart wrapper), so the cap does not depend on position.
  - At desktop width (960 px) the cap is 20 rem (320 px), the same as today's `max-w-80`.
  - At phone width it shrinks equally on both sides, so tooltips never overflow (SC-003).

- **Alternatives**:
  - A fixed `w-80`. Rejected: short summaries would get empty space, and it overflows on phones.
  - Measuring the tooltip with a ref or effect and clamping it. Rejected: it adds `useRef` and `useEffect`, which AGENTS.md discourages, when CSS already solves this.

## R3. Flip threshold: 60% → 50%

- **Decision**: Change the side-flip rule from `x > 0.6 × width` to `x > 0.5 × width`. This updates the spec's Assumption.
- **Rationale**: To guarantee that a tooltip of at most `50% − 14px` fits on its opening side (SC-003), the side it opens toward must always have at least 50% of the width free. That only holds with a 50% threshold. With 60%, a dot at 59% opens right with only 41% of the width free.
  - The plot spans about 19.8%–87.5% of the chart, and its midpoint is about 54%. On desktop the effect is small: dots just right of the middle now open to the left.
- **Alternatives**: Keep 60% and lower the cap to `40% − 14px`. Rejected: on phones that makes every tooltip about 20% narrower, just so one rule can stay as it is.

## R4. Testability in jsdom

- **Decision**: jsdom does no layout and no hit-testing, so the tests check structure, not pixels:
  - (a) The pinned team's group is the last child of the plot group.
  - (b) A tooltip on the right side has an inline `right` style and no `left`, and it has the `w-max` class.
  - (c) A tooltip on the left side keeps `left`.

  Real overlap and width are checked in the browser using the steps in [quickstart.md](quickstart.md).

- **Note**: The test helper `hitPath(container, index)` selects by DOM index. Pinning moves a team's group to the end, so tests that pin a team and then index hit paths must use the new order. The existing pinned test indexes Boston (0), which doesn't move.
