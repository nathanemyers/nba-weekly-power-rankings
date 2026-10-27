# Feature Specification: Player History Page

**Feature Branch**: `020-player-history-page`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Add a player history page. This should be exposed in react router. When you click on a player in the roster chart route to this page. Use a similar chart to the main roster table but add a column for the team. If a user click on a row in the player history table route back to the main chart page with the team selected."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a player's career history from the roster (Priority: P1)

A visitor reading a team's roster pane wants to see how one player's numbers changed over the years. They click the player's name in the roster and land on a page for that player. The page lists every season the player appears in the site's data, one row per team stint, in the same table style as the roster pane (same stat columns, same color coding, same gray for unrated rows), with an added Team column showing the team's logo and name.

**Why this priority**: It is the page the user asked for and the entry point to it; without it nothing else in this feature exists.

**Independent Test**: Select 2015-16, pin the Golden State Warriors, click Stephen Curry, and confirm a page titled with his name opens listing each season from 2009-10 onward that the site has data for, with a Team column showing Golden State, and points per game matching the roster pane for 2015-16 (30.1).

**Acceptance Scenarios**:

1. **Given** the roster pane is showing, **When** the visitor clicks a player's name, **Then** the player history page for that player opens.
2. **Given** the player history page, **When** it is shown, **Then** it has a heading with the player's name and a table with Season, Team, and the same stat columns as the roster pane (Pos, Age, G, MIN, PTS, REB, AST, STL, BLK, PER).
3. **Given** the player history page, **When** it is shown, **Then** stats are color coded and unrated rows are grayed exactly as they would be for that row in the roster pane.
4. **Given** the player history page, **When** it is shown, **Then** rows are ordered from oldest season to newest.
5. **Given** a player who was traded mid-season, **When** their history is shown, **Then** that season has one row per team, ordered as the player moved (the team they left before the team they joined), each with only that team's stats.
6. **Given** the roster pane, **When** the visitor clicks a mid-season move badge next to a player's name, **Then** the badge keeps its current behavior (selecting that other team) and does not open the player history page.

---

### User Story 2 - Jump from a history row back to that team's season (Priority: P1)

A visitor on a player's history page wants to see how the team did in one of those seasons. They click a row and return to the main chart for that season with that row's team selected, so the chart highlights the team and its roster pane is shown.

**Why this priority**: The user explicitly asked for it, and it makes the page part of a browsing loop instead of a dead end.

**Independent Test**: From Stephen Curry's history, click the 2017-18 row and confirm the main chart for 2017-18 opens with Golden State as the only selected team and its roster pane visible.

**Acceptance Scenarios**:

1. **Given** the player history page, **When** the visitor clicks a row, **Then** the main chart for that row's season opens with only that row's team selected.
2. **Given** a traded player's season with two rows, **When** the visitor clicks the second row, **Then** the chart opens with the second row's team selected, not the first.
3. **Given** the history table, **When** the visitor hovers a row, **Then** the row is highlighted and the pointer shows it is clickable.
4. **Given** a keyboard user, **When** they tab to a row and press Enter, **Then** it behaves the same as clicking the row.

---

### User Story 3 - Share or reload a player history link (Priority: P2)

A visitor wants to send someone a link to a player's history, or reload the page, and see the same player.

**Why this priority**: Shareable links are expected of every view in the site, but the feature is usable without them.

**Independent Test**: Open Stephen Curry's history page, copy the address, open it in a new tab, and confirm the same page appears.

**Acceptance Scenarios**:

1. **Given** a player history page's address, **When** it is opened fresh, **Then** the same player's history is shown.
2. **Given** an address for a player who does not exist in the site's data, **When** it is opened, **Then** a "player not found" error is shown in the site's existing error style, with a way back to the main chart.
3. **Given** the player history page, **When** the visitor uses the browser's back button, **Then** they return to the page they came from.

### Edge Cases

- A player who appears in only one season shows a single row (or one row per team for that season) and the page still works.
- A player with the same name as another player is still identified uniquely, so each name in the roster opens the correct person's history.
- A season row whose PER is missing shows a dash, as in the roster pane.
- A player whose career began before the site's earliest season (2003-04) shows only the seasons the site has data for.
- The table is wider than a phone screen: it scrolls sideways with the Season and Team columns kept visible, matching how the roster pane keeps the player name visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST have a player history page reachable at its own address that identifies one player.
- **FR-002**: Clicking a player's name in the roster pane MUST open that player's history page.
- **FR-003**: Mid-season move badges in the roster pane MUST keep selecting the other team and MUST NOT open the player history page.
- **FR-004**: The player history page MUST show the player's name and a table with one row for each team the player played for in each season the site has data for.
- **FR-005**: The table MUST show Season and Team columns followed by the same stat columns, labels, and tooltips as the roster pane.
- **FR-006**: The Team column MUST show the team's logo and name.
- **FR-007**: Stat color coding and gray for unrated rows MUST follow the same rules as the roster pane, and the page MUST show the same color key.
- **FR-008**: Rows MUST be ordered by season, oldest first; within a season, in the order the player played for the teams.
- **FR-009**: Clicking a row, or pressing Enter on a focused row, MUST open the main chart for that row's season with only that row's team selected.
- **FR-010**: Rows MUST show a hover highlight and a pointer cursor.
- **FR-011**: Opening a player history address directly MUST show the same page as navigating to it.
- **FR-012**: An address for an unknown player MUST show a "player not found" error with a way back.

### Key Entities

- **Player**: A person identified by a stable ID that is the same across every season and team; has a name.
- **Player season stint**: One player's regular season with one team: season, team, and the same stats the roster pane shows (position, age, games, minutes, points, rebounds, assists, steals, blocks, PER) plus whether they joined from or left for another team mid-season.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can go from a team's roster to a player's full history in one click.
- **SC-002**: A visitor can go from any row of a player's history to that team's season chart in one click.
- **SC-003**: For every row, the stats and colors shown match the roster pane for the same team and season exactly.
- **SC-004**: Every season and team the player appears in within the site's data is listed, with none missing or duplicated.
- **SC-005**: A player history link opened in a new tab shows the same player 100% of the time.

## Assumptions

- The player is identified by the same ID the roster data already carries (Basketball-Reference player ID), which stays the same across seasons and teams.
- All player history is built from roster data already shipped with the site; no new data collection is needed.
- History covers regular season stats only, as the roster pane does.
- Returning to the chart from a history row replaces any teams previously selected, matching how the team history page returns to the chart.
- The page has a way back to the main chart, as the team history page does.
- Player history covers every season the site has data for (2003-04 onward).
