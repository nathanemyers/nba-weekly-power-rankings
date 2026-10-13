# Feature Specification: Season Rank Swings Pane

**Feature Branch**: `008-season-rank-swings`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "For completed seasons, I want to provide a pane that highlights teams that have had either seasons where they started high and went low, or started low and went high. This will involve building a new component that shows the overall rank changes as a small infographic. When the user clicks on one of these teams, highlight it in the main chart."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor sees the biggest risers and fallers for a completed season (Priority: P1)

A visitor viewing a season that has already finished sees a dedicated pane that highlights the teams whose ranking swung the most over the course of that season — teams that started near the top and ended low, and teams that started low and ended near the top — each shown as a small, at-a-glance visual of their overall rank change.

**Why this priority**: This is the core payoff of the feature. Without it, there's nothing to look at or interact with; everything else builds on this view existing.

**Independent Test**: Open a completed season and confirm the pane shows a set of teams with notably large start-to-end rank changes in both directions, each presented as a simple before/after visual. Fully testable and valuable without any click interaction.

**Acceptance Scenarios**:

1. **Given** a completed season with recorded weekly rankings, **When** a visitor views that season, **Then** a pane appears showing teams with the largest rank improvements and the largest rank declines from the start to the end of that season.
2. **Given** the pane is shown, **When** a visitor looks at any highlighted team, **Then** they can see that team's starting rank, ending rank, and the direction of change at a glance, without needing to open the main chart.
3. **Given** a season that has not completed, **When** a visitor views that season, **Then** the pane does not appear.

---

### User Story 2 - Clicking a team in the pane highlights it in the chart (Priority: P2)

A visitor clicks one of the teams shown in the rank-swings pane and sees that team highlighted in the main weekly power-rankings chart, so they can see exactly how and when that swing happened across the season.

**Why this priority**: This connects the new pane back to the app's main chart, turning a static observation into an investigable one. It depends on the pane (P1) already existing.

**Independent Test**: With the pane visible for a completed season, click one of its teams and confirm that exact team becomes highlighted in the chart, independent of any other team's selection state.

**Acceptance Scenarios**:

1. **Given** the pane is visible, **When** the visitor clicks a team shown in it, **Then** that team is highlighted in the main chart for the same season.
2. **Given** a team from the pane is already highlighted, **When** the visitor clicks a different team in the pane, **Then** the chart highlight updates to the newly clicked team.

---

### User Story 3 - Pane and highlight stay correct when switching seasons (Priority: P3)

A visitor who has the pane open and a team highlighted switches to a different season and sees the pane (and any highlight) update to match the newly selected season rather than showing stale information.

**Why this priority**: Prevents a confusing experience where a prior season's swings or highlight linger after switching seasons. Lower priority because it's a correctness guarantee on top of Stories 1 and 2, not new functionality.

**Independent Test**: With a team highlighted via the pane for Season A, switch to Season B and confirm the pane now reflects Season B's own biggest risers/fallers and the Season A highlight is gone.

**Acceptance Scenarios**:

1. **Given** a team is highlighted via the pane for Season A, **When** the visitor switches to Season B, **Then** the Season A highlight is cleared and the pane shows Season B's own data (or disappears if Season B hasn't completed).
2. **Given** the visitor switches to a season with no recorded weekly rankings, **When** the view updates, **Then** the pane does not appear and no error is shown.

---

### Edge Cases

- A season has only mildly fluctuating teams (no dramatic swings): the pane still shows the teams with the largest relative rank change for that season, even if the swings are modest in absolute terms.
- Multiple teams are tied for the largest rank change at the edge of what's highlighted: all tied teams are included rather than arbitrarily dropping some.
- A team's recorded data for the season starts later than week 1 or ends earlier than the season's last week (e.g., sparse historical data): that team's "start" and "end" are based on its own first and last recorded weeks, not a fixed week number.
- A team has only a single recorded week of ranking data for the season: it has no meaningful rank change and is excluded from consideration for the pane.
- A season has no playoff/completion data at all: the pane does not appear, consistent with other completed-season-only features in this app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For each completed season, system MUST display a pane highlighting the teams with the largest rank change between the start and end of that season, covering both teams that rose and teams that fell.
- **FR-002**: System MUST NOT display this pane for a season that has not completed.
- **FR-003**: The pane MUST present each highlighted team's rank change as a small, at-a-glance visual showing its starting rank, ending rank, and the direction of the change.
- **FR-004**: Users MUST be able to click a team shown in the pane.
- **FR-005**: Clicking a team in the pane MUST highlight that team in the main rankings chart for the currently selected season.
- **FR-006**: Clicking a different team in the pane MUST replace any existing chart highlight with the highlight for the newly clicked team.
- **FR-007**: Switching the selected season MUST update the pane to reflect the newly selected season's own data (or hide the pane if that season hasn't completed) and MUST clear any chart highlight that came from the previous season's pane.
- **FR-008**: A team's starting and ending rank for the purpose of this pane MUST be based on that team's own first and last recorded weeks within the season, not a fixed week number.
- **FR-009**: When multiple teams are tied in rank-change magnitude at the boundary of what would be highlighted, the system MUST include all tied teams rather than arbitrarily excluding some.
- **FR-010**: A team with fewer than two recorded weeks of ranking data in a season MUST be excluded from this pane's calculations for that season.

### Key Entities

- **Team Season Rank Swing**: A derived value per team per season representing that team's starting rank, ending rank, and the magnitude/direction of change between them; used to determine which teams appear in the pane.
- **Season** *(existing entity)*: Has a completion status that determines whether the pane is computed and shown at all.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any completed season, a visitor can identify the teams with the biggest rank rises and the biggest rank falls within 5 seconds of viewing the pane.
- **SC-002**: Clicking a team in the pane highlights the correct team in the chart immediately (perceived as instant, well under 1 second), with no page reload.
- **SC-003**: Switching seasons always shows a pane (or its absence) that matches the newly selected season, with no leftover data or highlight from a prior season.
- **SC-004**: The pane never appears for a season without completed, recorded weekly rankings, and never produces an error when such a season is viewed.
- **SC-005**: Ties in rank-change magnitude are never silently dropped — 100% of teams tied at the highlighted boundary are represented in the pane.

## Assumptions

- "Started high and went low" / "started low and went high" is measured as the net change between a team's rank in its first recorded week and its rank in its last recorded week of the season — not the full range of its ups and downs during the season.
- The pane highlights a small, fixed-size set of teams in each direction (the largest risers and the largest fallers) rather than ranking all teams; the exact number shown is a presentation detail to be decided during planning.
- "Completed season" uses the same definition already established for the other completed-season features in this app (005-playoff-bracket, 006-team-ai-summary, 007-season-storylines).
- Clicking a team in this pane reuses the existing single-team highlight/pin behavior already present in the main chart, simply adding this pane as another entry point into it.
- The pane's exact visual design (the "small infographic") and its placement relative to the chart and other completed-season panes are layout/design decisions for planning, not this spec.
