# Feature Specification: Compact Trends Lists

**Feature Branch**: `024-compact-trends-lists`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "I want to clean up what the chart trends look like. I want a top 5 best improving and worst declining vertical list that uses smaller UI. The team logos should match the sizing elsewhere. On mobile just show the best improving and worst declining one after the other"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor scans the top 5 risers and fallers as compact lists (Priority: P1)

A visitor opens the Trends tab for a season and sees two short, vertical, ranked lists of exactly 5 teams each: the 5 most improved teams and the 5 most declined teams. Each row is compact (a small team logo, the team's name or abbreviation, its small trend line, and its rank change), so both lists fit comfortably next to each other without the oversized cards used today.

**Why this priority**: This is the whole visual cleanup the request is about. Showing 5 teams per direction in a tighter layout is the core change.

**Independent Test**: Open the Trends tab for any season with rankings data and confirm there are two vertical lists labeled for improving and declining teams, each with exactly 5 rows ordered from biggest change to smallest, using compact rows.

**Acceptance Scenarios**:

1. **Given** a season with weekly rankings, **When** a visitor opens the Trends tab on a wide screen, **Then** they see a "most improved" list and a "most declined" list side by side, each a vertical list of exactly 5 teams.
2. **Given** the lists are shown, **When** the visitor reads a row, **Then** they can see the team's logo, which team it is, a small trend line of its season, and how many places it moved, all on one line.
3. **Given** the improving list is shown, **When** the visitor reads it from top to bottom, **Then** teams are ordered from the largest rise to the smallest; the declining list is ordered from the largest fall to the smallest.
4. **Given** the lists are shown, **When** the visitor compares the team logos to team logos in other list views of the app (e.g., storylines, roster), **Then** the logos are the same size.

---

### User Story 2 - Mobile visitor sees the lists stacked (Priority: P1)

A visitor on a phone opens the Trends tab and sees the full improving list first, followed by the full declining list below it, each still in the same compact row style.

**Why this priority**: Explicitly requested, and the phone layout is a primary way the site is used.

**Independent Test**: View the Trends tab at a phone-width screen and confirm the improving list appears in full, then the declining list appears below it, with no horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** a phone-width screen, **When** the visitor opens the Trends tab, **Then** the improving list is shown first and the declining list is shown directly after it, one above the other.
2. **Given** a phone-width screen, **When** the lists are shown, **Then** no row overflows the screen width or requires horizontal scrolling.

---

### User Story 3 - Clicking a row still highlights that team in the chart (Priority: P2)

A visitor clicks a team in either list and that team becomes the highlighted team in the main chart, as it does today. The row shows that it is the selected one.

**Why this priority**: Preserves existing behavior through the redesign; it is not new functionality but must not regress.

**Independent Test**: Click a row in either list and confirm the chart highlights that team alone and the row appears selected; click a different row and confirm the selection moves.

**Acceptance Scenarios**:

1. **Given** the lists are shown, **When** the visitor clicks a team row, **Then** that team becomes the single highlighted team in the chart and its row shows a selected state.
2. **Given** a team is selected from a row, **When** the visitor clicks a different row, **Then** the highlight and selected state move to the newly clicked team.
3. **Given** the visitor hovers a row with a pointer, **Then** the pointer shows that the row is clickable.

---

### Edge Cases

- A season has fewer than 5 teams that moved in one direction: that list still shows 5 rows, filled with the next teams in order (a team with no net change, or even a small move in the other direction, shows its actual change).
- A team appears in both lists: avoided; with 5 rows per list and 30 teams, the lists never overlap.
- A season with no rankings data: the Trends tab is unavailable, as it is today.
- Long team names on narrow screens: the row stays on one line and the name shortens (for example, to the team abbreviation) instead of wrapping or overflowing.
- Teams tied on rank change at the 5th position: the list shows exactly 5 rows, using a consistent tie-break order so the same season always shows the same teams.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Trends tab MUST show a list of exactly 5 most improved teams and a list of exactly 5 most declined teams for the selected season.
- **FR-002**: Each list MUST be a vertical list with one team per row, ordered from largest change to smallest change in its direction.
- **FR-003**: Each list MUST have a short heading identifying it as the improving or declining list.
- **FR-004**: Each row MUST show, on a single line, the team's logo, a team label, a small trend line of the team's season, and the team's net rank change with its direction.
- **FR-005**: Team logos in the rows MUST be the same size as team logos in the app's other list rows (storylines, roster, player history).
- **FR-006**: Rows MUST be visibly smaller than the current trend cards (less padding, smaller logo, smaller trend line), so that a 5-row list is about as tall as the current 3-card stack or shorter.
- **FR-007**: On wide screens, the two lists MUST appear side by side, improving on the left and declining on the right.
- **FR-008**: On phone-width screens, the improving list MUST appear first with the declining list directly below it, and nothing may scroll horizontally.
- **FR-009**: Each list MUST always contain exactly 5 rows, even when fewer than 5 teams moved in that list's direction; each row shows the team's actual net change.
- **FR-010**: Clicking a row MUST make that team the single highlighted team in the main chart, and the row of the currently highlighted team MUST show a selected state.
- **FR-011**: Rows MUST show a pointer cursor on hover to indicate they are clickable.
- **FR-012**: The rule for when the Trends tab is available MUST stay the same: available when at least one team improved or declined.

### Key Entities

- **Trend entry**: A team plus its net rank change from its first in-season ranking to its last ranking in the selected season. Positive means improving, negative means declining.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every season with rankings data, the Trends tab shows exactly 5 rows in each list.
- **SC-002**: On a wide screen, both lists are fully visible together without scrolling within the Trends tab.
- **SC-003**: At a 375px-wide screen, both lists are readable in full one after the other with zero horizontal overflow.
- **SC-004**: Logo size in Trends rows is identical to logo size in the storylines list.
- **SC-005**: A visitor can identify the single biggest riser and biggest faller of a season within 3 seconds of opening the tab.

## Assumptions

- "Chart trends" refers to the existing Trends tab under the main chart, which today shows the 3 biggest risers and 3 biggest fallers as large logo-plus-minimap cards.
- The existing season-change rule (first in-season ranking compared with the final ranking, skipping the preseason ranking) stays as is; only the count (3 to a fixed 5) and presentation change.
- The "sizing elsewhere" for logos means the small inline logos used in list rows (storylines, player history, playoff badges), not the large logos used in page headers.
- The small trend line (minimap) is kept in each row, at a reduced size, because it is the at-a-glance visual the Trends tab was built around; the rank-change number is added so the row is useful without reading the line.
- The team label is the team's full name where space allows and its abbreviation where it doesn't.
- The Trends tab keeps its current position and availability rules in the detail tabs.
