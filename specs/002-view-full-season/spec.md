# Feature Specification: View Full Season (Zoom Out)

**Feature Branch**: `002-view-full-season`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Add a feature that lets you zoom out and view an entire season"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the whole season's trend at a glance (Priority: P1)

A visitor viewing the weekly power-rankings chart, currently limited to a 10-week scrolling
window, wants to zoom out so every week of the selected season is visible on screen at once,
letting them see each team's full-season trajectory without paging through windows.

**Why this priority**: This is the entire value of the feature. Without it, there is nothing to
ship — the other stories only refine this core capability.

**Independent Test**: Load a season, trigger the zoom-out control, and confirm every recorded
week for every team is visible in the chart at once, with no paging controls required to see the
full picture.

**Acceptance Scenarios**:

1. **Given** the chart is showing its default 10-week window, **When** the visitor activates the
   full-season view, **Then** the chart redraws so that week 1 through the season's last
   recorded week are all visible simultaneously, for every team.
2. **Given** the chart is in full-season view, **When** the visitor looks at the playoffs
   marker, **Then** it appears at its correct week position relative to the full season, exactly
   as it does in the windowed view.
3. **Given** a season where every team has not necessarily been ranked every week, **When** the
   full-season view is shown, **Then** each team's line still only connects the weeks it was
   actually ranked, matching the gap behavior of the windowed view.

---

### User Story 2 - Return to the detailed weekly window (Priority: P2)

Having zoomed out, a visitor wants to zoom back in to the normal paged, week-by-week view to
inspect a specific stretch of the season more closely.

**Why this priority**: Zooming out is only useful alongside an easy way back to the detailed
view; without it, the feature would be a one-way door and the chart would lose its original
granular-navigation value.

**Independent Test**: From full-season view, trigger the zoom-in control and confirm the chart
returns to a 10-week paged window with working Earlier/Later navigation.

**Acceptance Scenarios**:

1. **Given** the chart is in full-season view, **When** the visitor activates the zoom-in
   control, **Then** the chart returns to a 10-week window and the Earlier/Later controls and
   arrow-key panning work as before.
2. **Given** the visitor had a team pinned before zooming out, **When** they zoom back in,
   **Then** the same team is still pinned.

---

### User Story 3 - Zoom state carries across season changes (Priority: P3)

A visitor who has zoomed out switches the season selector to a different year and expects the
chart to keep showing the full season rather than silently reverting to the windowed view.

**Why this priority**: Nice-to-have continuity; the feature is already fully usable per-season
without it, so it is the first thing to drop if time is short.

**Independent Test**: Zoom out, switch to a different season in the selector, and confirm the
newly loaded season also renders in full-season view.

**Acceptance Scenarios**:

1. **Given** the chart is in full-season view for one season, **When** the visitor selects a
   different season, **Then** the newly loaded season also renders in full-season view without
   the visitor re-activating the zoom control.

---

### Edge Cases

- A season has notably fewer or more total weeks than others (e.g., a lockout-shortened season):
  full-season view MUST still fit entirely on screen without requiring horizontal scrolling.
- A visitor has a tooltip open (hovering a specific week's data point) when they zoom in or out:
  the tooltip MUST close or update rather than pointing at a stale, now-incorrect position.
- A visitor zooms out, then uses keyboard arrow-key panning: since there is no partial window to
  pan, the key presses MUST have no effect rather than erroring or shifting the view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a visible control that lets a visitor switch the chart
  between the existing 10-week windowed view and a full-season view showing every recorded week
  for the selected season at once.
- **FR-002**: The system MUST clearly indicate which view mode is currently active.
- **FR-003**: In full-season view, all per-team interactions available in the windowed view
  (hover highlighting, click-to-pin, tooltips) MUST continue to work identically.
- **FR-004**: In full-season view, the playoffs marker and the end-of-season playoff-result
  column MUST be positioned and displayed exactly as they are at the last page of the windowed
  view.
- **FR-005**: The system MUST let a visitor return from full-season view to the 10-week windowed
  view, restored to Earlier/Later paging and arrow-key panning.
- **FR-006**: A team pinned before switching view modes MUST remain pinned after the switch.
- **FR-007**: The Earlier/Later paging controls and arrow-key panning MUST be inactive while in
  full-season view, since there is no partial window left to page through.
- **FR-008**: Switching the selected season while in full-season view MUST keep the newly loaded
  season in full-season view (see User Story 3).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can view every week of a season's rankings for every team in a single
  screen, with zero additional paging actions, within one click of the default view.
- **SC-002**: Switching between full-season and windowed view takes exactly one interaction
  (one click or tap), in either direction.
- **SC-003**: 100% of the hover, pin, and tooltip behaviors available in windowed view remain
  available and accurate in full-season view.
- **SC-004**: Full-season view renders with no horizontal scrolling and no clipped data points,
  for every season currently available (21 to 26 weeks).

## Assumptions

- "Zoom out" is a toggle between exactly two view modes (10-week window and full season), not a
  continuous or multi-step zoom level — the feature description asks only for the ability to see
  "an entire season," which a two-state toggle satisfies without added complexity.
- The chart defaults to the existing 10-week windowed view on first load of a season; full-season
  view is an explicit, opt-in action (consistent with current behavior being the baseline).
- View-mode choice is UI state only for the current browser session; it is not persisted across
  page reloads (no existing mechanism persists chart view state today, and the feature
  description does not ask for persistence).
- No new ranking data or data shape changes are required; this feature only changes how already
  available data is rendered and navigated.
