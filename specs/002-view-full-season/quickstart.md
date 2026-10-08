# Quickstart: Validate View Full Season (Zoom Out)

See [contracts/view-mode-interface.md](./contracts/view-mode-interface.md) for the `App.tsx` ↔
`Chart.tsx` prop contract, and [data-model.md](./data-model.md) for the view-mode state shape.

## Prerequisites

- `npm ci` completed in a local checkout
- `npm run dev` (or `npm run build && npm run preview`) running

## Scenario 1: See the whole season at a glance (User Story 1)

1. Open the app; pick any season (all currently have 21–26 recorded weeks).
2. Activate the zoom-out control.

Expected:

- Every recorded week, for every team, is visible at once — no Earlier/Later controls needed.
- The playoffs marker sits at its correct week position, matching where it falls within the full
  season.
- Teams that weren't ranked every week still show gaps instead of connecting lines across the
  missing weeks.
- The end-of-season playoff-medal column appears, matching what's shown at the last page of the
  windowed view.

## Scenario 2: Return to the windowed view (User Story 2)

1. From full-season view, pin a team, then activate the zoom-in control.

Expected:

- The chart returns to the windowed view with Earlier/Later and arrow-key panning working again.
- The same team is still pinned.

## Scenario 3: Zoom state carries across season changes (User Story 3)

1. Zoom out, then switch the season selector to a different year.

Expected:

- The newly loaded season also renders in full-season view immediately, with no need to
  re-activate the zoom control.

## Scenario 4: Hidden control when a season fits the window

Every season shipped today (21–26 weeks) exceeds the default 10-week window, so this can't be
observed with real data yet. To validate the logic ahead of a future in-progress season:

1. Temporarily change `DEFAULT_WINDOW_WEEKS` in `src/Chart/Chart.tsx` to a number larger than the
   selected season's total weeks (e.g., `30`).
2. Reload the app with that season selected.
3. Confirm the zoom-out control is not rendered at all, and the windowed view already shows every
   recorded week (since the window is now wider than the season).
4. Revert the temporary change before committing.

Expected: no zoom-out control when `maxWeek <= windowWeeks`; the chart simply shows the whole
season via the normal windowed rendering path.

## Scenario 5: Tooltip and keyboard behavior across modes

1. Hover a data point to open its tooltip, then activate the zoom control (either direction).
2. While in full-season view, press the Left/Right arrow keys.

Expected:

- The tooltip closes rather than pointing at a stale position after the switch.
- Arrow-key presses have no effect while in full-season view (no partial window to pan).

## Automated test suite

- `npm test` runs the Vitest suite covering this feature: toggling into/out of full-season view,
  the hidden-control case (window width temporarily widened in-test rather than by hand-editing
  source, unlike Scenario 4 above), pin persisting across the toggle, paging/keyboard panning
  becoming inactive while zoomed out, the playoff column appearing, and the tooltip clearing on
  toggle.
- This is the primary way to validate Scenarios 1–5 going forward; the manual steps above remain
  useful for an end-to-end sanity check in a real browser.

## Regression check

- `npm run lint`, `npm run build`, and `npm test` all pass.
- `npm run preview` still serves correctly under `/nba-weekly-power-rankings/` (this feature
  touches no asset paths, but confirm no regression per constitution's quality gates).
