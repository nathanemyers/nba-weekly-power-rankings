# Quickstart: Validate Animated Chart Transitions (Zoom and Pan)

See [data-model.md](./data-model.md) for the Chart Transition state this feature adds on top of
`002-view-full-season`'s `zoomedOut` toggle and paging.

**Prerequisite**: `002-view-full-season` must be implemented (the zoom toggle and Earlier/Later
paging must exist) before any of this is observable.

## Prerequisites

- `npm ci` completed in a local checkout
- `npm run dev` (or `npm run build && npm run preview`) running

## Scenario 1: Zooming out animates (User Story 1)

1. Load any season; note the current windowed week range.
2. Activate the zoom-out control.

Expected:

- The chart visibly animates from the windowed range out to the full season over a fraction of a
  second — not an instant redraw.
- Watching any one team's line, it moves continuously rather than jumping.
- Once the animation settles, the chart looks exactly like the full-season view from
  `002-view-full-season`'s own quickstart Scenario 1.

## Scenario 2: Zooming in animates back (User Story 2)

1. From full-season view, activate the zoom-in control.

Expected:

- The chart animates smoothly back down to the windowed view.
- Once settled, it looks exactly like the windowed view from `002-view-full-season`'s quickstart.

## Scenario 3: Reduced motion is honored

1. Enable "reduce motion" at the OS level (or emulate it in browser devtools:
   Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce").
2. Toggle zoom in either direction.

Expected: the view changes immediately, with no visible animation.

## Scenario 4: Rapid re-toggling mid-animation

1. Activate zoom-out, then immediately (while it's still animating) activate zoom-in.

Expected: the chart smoothly reverses from wherever it currently was, with no visual glitch,
freeze, or dropped input — not a jump back to the pre-animation state first.

## Scenario 5: Panning animates (User Story 3)

1. In the windowed view, pick a season where at least one visible team isn't ranked in the very
   first week of the current window (so paging will change which week determines its label's
   position — most seasons qualify).
2. Click Later (or press the Right arrow key).

Expected:

- The chart visibly slides to the new week range over a fraction of a second — not an instant
  redraw.
- Any team-name label whose position changes glides smoothly to its new row rather than jumping
  there.
- Once the animation settles, the chart looks exactly like the windowed view at that new
  position would without animation.

## Scenario 6: Rapid re-paging mid-animation

1. Click Later, then immediately (while it's still animating) click Later again (or Earlier).

Expected: the chart smoothly retargets from wherever it currently was — both the lines and any
animating label — with no glitch, freeze, or dropped input.

## Automated test suite

- `npm test` includes: the pure interpolation function's unit tests (progress → `start`/`span`),
  faked-timer tests asserting the animation reaches the exact non-animated target state for both
  the zoom toggle and a pan, a mid-flight-retarget test for each trigger, a mocked-`matchMedia`
  test for the reduced-motion path, and a label-position test (a team whose first-visible-ranked
  week changes across a pan animates rather than jumps).

## Regression check

- `npm run lint`, `npm run build`, and `npm test` all pass.
- `002-view-full-season`'s own quickstart scenarios (hover, pin, tooltip, hidden control,
  keyboard panning) still all pass — this feature must not change any of that behavior, only add
  motion to the transitions between view states.
