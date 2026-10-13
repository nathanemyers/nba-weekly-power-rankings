# Feature Specification: Restore Chart Behavior After Refactor

**Feature Branch**: `refactor`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Restore chart behavior lost in the refactor, while keeping the refactor's new structure."

## Background

The `refactor` branch reorganized the rankings chart: view state (zoom mode, visible week window, pinned teams) now lives at the page level, the chart is a display component driven by the week range, dimensions, and pinned teams it is given, team labels are their own component, and team and playoff-stage identifiers are shared, named values. That reorganization is intentional and stays.

In the process, behaviors delivered by `002-view-full-season`, `003-zoom-transition-animation`, and the original chart stopped working. This spec lists what a visitor must be able to do again. It adds no new visitor-facing capability.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the chart correctly (Priority: P1)

A visitor opens the page and sees each team's name beside the rank it actually held in the first week shown, a tick for every week shown, and a playoff medal beside every team that reached the playoffs.

**Why this priority**: Today the labels sit at the wrong rank, the last week has no tick, most playoff medals are missing, and some seasons can fail to draw at all. A chart that misreports the data is worse than one missing conveniences.

**Independent Test**: Load any season and compare label positions, week ticks, and medals against that season's data.

**Acceptance Scenarios**:

1. **Given** the default weekly window, **When** the chart is shown, **Then** it spans the first 11 weeks (a 10-week span) and every one of those weeks has a tick, including the last.
2. **Given** a team ranked 5th in week 1 and 20th in week 2, **When** the window starts at week 1, **Then** the team's label sits at rank 5; **When** the window starts at week 2, **Then** it sits at rank 20.
3. **Given** a team with no ranking for the first visible week, **When** the chart is shown, **Then** its label sits at its rank in the first visible week it does have, and the chart still draws.
4. **Given** a completed season, **When** the chart is shown, **Then** every team that reached the playoffs has a medal next to its name, including second-round exits and the champion.
5. **Given** the last week of the season is in view, **When** the chart is shown, **Then** a "Playoffs" column at the right edge shows each playoff team's medal at its final visible rank; **When** the last week is not in view, **Then** that column is absent.

---

### User Story 2 - Move around the season (Priority: P1)

A visitor pages through the season a week at a time with on-screen controls or the arrow keys, sees which weeks are in view, and switches between the weekly window and the full season. The chart glides between positions rather than jumping.

**Why this priority**: Navigation is the chart's primary interaction, and the page still tells visitors to "use arrow keys to pan" although that no longer works.

**Independent Test**: Page forward and back with buttons and keys, zoom out and in, and switch seasons, checking the readout, control states, and motion.

**Acceptance Scenarios**:

1. **Given** the weekly window, **When** the visitor presses the right or left arrow key, **Then** the window moves one week later or earlier, stopping at the season's ends.
2. **Given** the weekly window on weeks 3–13, **When** the visitor looks at the controls, **Then** a readout says "Weeks 3–13"; in the full-season view it says "Full season (Weeks 1–N)".
3. **Given** the window is at the first or last possible position, or the full-season view is on, **When** the visitor looks at the paging controls, **Then** the control that cannot move is visible but disabled.
4. **Given** the full-season view, **When** the visitor presses an arrow key, **Then** nothing moves.
5. **Given** the visitor paged the window and then zoomed out, **When** they zoom back in, **Then** the window returns to exactly where they left it.
6. **Given** a season short enough to fit entirely in the weekly window, **When** the chart is shown, **Then** there is no zoom control.
7. **Given** the visitor zooms or pages, **When** the view changes, **Then** lines, ticks, markers, and team labels move continuously to the new position and end exactly where a non-animated change would put them.
8. **Given** a transition is in progress, **When** the visitor zooms or pages again, **Then** the chart continues from where it currently is toward the new target without snapping back.
9. **Given** the visitor's device asks for reduced motion, **When** the view changes, **Then** the chart updates immediately with no animation.
10. **Given** the full-season view is on, **When** the visitor picks another season, **Then** that season opens in the full-season view.
11. **Given** the window is paged to the end of a long season, **When** the visitor picks a shorter season, **Then** the window is within that season and the paging controls reflect its limits.

---

### User Story 3 - Inspect and follow a team (Priority: P2)

A visitor hovers a team to make it stand out and read what was written about it in a given week, and clicks a team to keep it highlighted while exploring.

**Why this priority**: Hover highlighting, tooltips for unpinned teams, and unpinning by clicking the team again all stopped working; the chart is readable without them but far less useful.

**Independent Test**: Hover and click lines, labels, dots, and the chart background and observe highlighting, dots, tooltips, and label styling.

**Acceptance Scenarios**:

1. **Given** no team is pinned, **When** the visitor hovers a team's line or label, **Then** that team's line thickens, its per-week dots appear, its label is emphasized, and other teams dim.
2. **Given** a team's dots are showing, **When** the visitor hovers a dot, **Then** a tooltip shows the rank, the team's full name, its record when available, that week's summary, and the week number.
3. **Given** a tooltip is open, **When** the zoom mode changes, **Then** the tooltip closes.
4. **Given** no team is pinned, **When** the visitor clicks a team's line or label, **Then** that team is pinned: it stays highlighted with a bold label and others stay dimmed when the pointer moves away.
5. **Given** a team is pinned, **When** the visitor clicks that team again or clicks the chart background, **Then** nothing is pinned.
6. **Given** a team is pinned, **When** the visitor hovers a different team, **Then** the pinned team stays the highlighted one and no tooltip appears for the other team.
7. **Given** a team is pinned, **When** the visitor zooms out and back in, **Then** the team is still pinned.

---

### Edge Cases

- A team is missing a week mid-season: its line shows a gap rather than bridging it.
- A season has fewer weeks than the weekly window: the whole season is shown, paging is disabled, and no zoom control appears.
- A season grows past the window size while the page is open: the zoom control appears without a reload.
- The season's playoffs-start marker is shown only while that week is in view, and stays within the plot.
- A team has no ranking in any visible week: it has no label and nothing fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The weekly window MUST default to a 10-week span starting at week 1 and MUST show a tick for every visible week, including the last.
- **FR-002**: The window MUST never extend before week 1 or past the season's last week, including immediately after a season switch.
- **FR-003**: Visitors MUST be able to page the window one week at a time with on-screen controls and with the left and right arrow keys; both MUST be inert in the full-season view.
- **FR-004**: The chart MUST show a readout of the weeks in view, and paging controls MUST be disabled, not hidden, when they cannot move.
- **FR-005**: The zoom control MUST be shown only when the season is longer than the weekly window, evaluated continuously.
- **FR-006**: Zooming out and back in MUST restore the window position and pinned team the visitor had before.
- **FR-007**: The zoom mode MUST carry across a season switch.
- **FR-008**: Zoom and pan changes MUST animate the scale, lines, ticks, and team labels, MUST settle on exactly the non-animated result, MUST retarget from the current position when interrupted, and MUST be instantaneous when reduced motion is requested.
- **FR-009**: Each team's label and medal MUST be placed at the team's rank in the first visible week it was ranked, found by week number, and MUST be omitted when it has no ranking in view.
- **FR-010**: A playoff medal MUST be shown for every playoff stage that occurs in the season data.
- **FR-011**: An end-of-season medal column MUST be shown when, and only when, the season's last week is in view.
- **FR-012**: Hovering a team's line or label MUST highlight that team, dim the others, and show its per-week dots, unless another team is pinned.
- **FR-013**: Hovering a dot MUST show a tooltip with rank, full team name, record when present, summary, and week; the tooltip MUST close when the zoom mode changes.
- **FR-014**: Clicking a team MUST pin it; clicking the pinned team or the chart background MUST unpin it. A pinned team's label MUST be bold and other labels dimmed.
- **FR-015**: A team's line MUST break across weeks it was not ranked.
- **FR-016**: The structural changes on the `refactor` branch MUST be preserved: page-level ownership of zoom, window, and pinned state; the chart's range-and-dimension-driven interface; the separate team-labels component; and the shared team and playoff-stage definitions.
- **FR-017**: The project's lint, build, and test gates MUST pass, with the automated tests exercising the refactored interface and covering every requirement above that was covered before the refactor.

### Key Entities

- **Week window**: The first and last week in view; either a 10-week span the visitor pages, or the whole season.
- **Pinned team**: The team (at most one today) the visitor chose to keep highlighted.
- **Playoff stage**: How far a team went in the playoffs; one of five stages, each with its own medal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every season in the data, every team's label sits at the rank recorded for its first visible week, at every window position.
- **SC-002**: For every completed season, all 16 playoff teams show a medal.
- **SC-003**: Every one of the nine seasons draws without error in both views and at both ends of the window.
- **SC-004**: A visitor can travel from the first week to the last using only the keyboard.
- **SC-005**: Every zoom or page change shows intermediate positions and finishes within about a third of a second, or instantly under reduced motion.
- **SC-006**: All behaviors verified by the pre-refactor automated tests are verified again, and all quality gates pass.

## Assumptions

- Pinned teams are now held at the page level, so a pin persists across a season switch; this is treated as an intended consequence of the refactor.
- Pinned teams remain a list in the new structure to leave room for pinning several teams later, but only one team is pinned at a time for now.
- Paging controls and the zoom control may sit wherever the refactored layout places them, provided they are labeled "Earlier", "Later", and "Zoom out"/"Zoom in" as before.
- The season data files are correct as built; where shared definitions disagree with the data, the definitions change, not the data.
- The project coding rules in `AGENTS.md` (no memoization hooks, minimal effects, no ref-held state, styled components first, objects and arrays only, one-sentence comments) apply to all restored code.
