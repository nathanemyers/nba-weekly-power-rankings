# Feature Specification: Roster Blocks and Minutes

**Feature Branch**: `019-roster-blocks-minutes`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "adjust some of the roster information. I want to add blocks and remove turnovers. Use the same color coding break points as the other stats. I would also like to add average minutes played and gray out the stats of players who do not qualify for color coded stats" Follow-up: "change the sorting from games to minutes played" Follow-up: "sort by minutes per game, not total minutes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See blocks instead of turnovers (Priority: P1)

A visitor reading a team's roster pane wants to see who protected the rim. The turnovers column is replaced by a blocks-per-game column, color coded like the other stats: red for the bottom quarter of regular rotation players since 2003-04, yellow for the middle half, green for the rest of the top quarter, and purple for the top 10%.

**Why this priority**: It is the main change the user asked for and swaps a stat they no longer want for one they do.

**Independent Test**: Select 2015-16, pin the Golden State Warriors, and confirm there is a BLK column and no TOV column, Draymond Green's 1.4 blocks are purple, Andrew Bogut's 1.6 blocks are purple, and Stephen Curry's 0.2 blocks are yellow.

**Acceptance Scenarios**:

1. **Given** the roster pane, **When** it is shown, **Then** it has a blocks-per-game column and no turnovers column.
2. **Given** a qualifying player, **When** the pane is shown, **Then** their blocks are red below 0.2, yellow from 0.2 up to 0.6, green from 0.6 up to 1.0, and purple from 1.0 up.
3. **Given** the color key, **When** a visitor or screen reader reads it, **Then** it no longer mentions turnovers rating in reverse.

---

### User Story 2 - See how many minutes each player played (Priority: P1)

A visitor wants to tell starters from end-of-bench players at a glance. Each row shows the player's average minutes per game with the team, next to games played.

**Why this priority**: Minutes is what decides whether a player's stats are color coded, so showing it explains the coloring, and it is useful context on its own.

**Independent Test**: Select 2015-16, pin Golden State, and confirm Stephen Curry shows 34.2 minutes per game, matching Basketball-Reference.

**Acceptance Scenarios**:

1. **Given** the roster pane, **When** it is shown, **Then** each row shows minutes per game, to one decimal place, directly after games played.
2. **Given** a traded player, **When** their row is shown, **Then** minutes per game covers only their games with this team.

---

### User Story 3 - Tell which players are too small a sample to rate (Priority: P2)

A visitor scanning the colors wants to know that a plain-looking stat line means "not enough games or minutes to rate", not "average". Players with fewer than 10 games or fewer than 10 minutes per game for the team have their stat values shown in a muted gray instead of the normal text color.

**Why this priority**: It removes confusion about uncolored rows, but the pane works without it.

**Independent Test**: Select 2015-16, pin Golden State, and confirm Kevon Looney (5 games) has gray stat values while Stephen Curry's are colored.

**Acceptance Scenarios**:

1. **Given** a player with fewer than 10 games or fewer than 10 minutes per game, **When** the pane is shown, **Then** their points, rebounds, assists, steals, blocks and PER values are gray.
2. **Given** a player with at least 10 games and 10 minutes per game, **When** the pane is shown, **Then** their stats are color coded as before and nothing in the row is gray.
3. **Given** a gray row, **When** a visitor reads it, **Then** the player's name, position, age, games and minutes remain in the normal text color, so the reason for the gray (low games or minutes) is easy to read.
4. **Given** a qualifying player with a missing value (for example no PER), **When** the pane is shown, **Then** the dash is shown uncolored as before and is not mistaken for the gray non-qualifying style.

---

### Edge Cases

- **Player right at the cutoff.** A player with exactly 10 games and exactly 10.0 minutes per game qualifies and is colored, not gray.
- **Minutes rounding.** A player averaging 9.96 minutes shows "10.0" but does not qualify; the gray style must follow the real value, not the rounded display.
- **Missing values for non-qualifying players.** A dash in a gray row is gray too.
- **Small screens.** Adding the minutes column must not make the page scroll horizontally at phone width; the table may scroll inside the pane as it does today.
- **Old saved views.** Nothing about turnovers is saved in links or browser storage, so removing it breaks no shared links.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The roster pane MUST show a blocks-per-game column, labeled "BLK" with a full "Blocks per game" description, in the position the turnovers column had (after steals, before PER).
- **FR-002**: The roster pane MUST NOT show a turnovers column.
- **FR-003**: Blocks MUST be color coded with breakpoints (low, high, elite) of 0.2, 0.6 and 1.0, where higher is better, using the same red, yellow, green and purple ratings as the other stats.
- **FR-004**: The roster pane MUST show minutes per game, labeled "MIN" with a full "Minutes per game" description, to one decimal place, directly after games played. Minutes are not color coded.
- **FR-005**: For players who do not qualify for color coding (fewer than 10 games or fewer than 10 minutes per game for the team), the points, rebounds, assists, steals, blocks and PER values MUST be shown in a muted gray from the site theme.
- **FR-006**: Qualifying players' stats MUST be colored exactly as before for points, rebounds, assists, steals and PER.
- **FR-007**: The color key's text equivalent MUST list the rated stats as points, rebounds, assists, steals, blocks and PER and MUST NOT say that fewer turnovers rate higher. It SHOULD say that players with fewer than 10 games or 10 minutes per game are shown in gray and not rated.
- **FR-008**: Turnovers MAY remain in the stored data; this feature changes only what the pane shows and rates.
- **FR-010**: Players MUST be listed by minutes per game for the team that season, most first, breaking ties by games played, most first, then by name. This replaces the games-played order from feature 017 (FR-005).
- **FR-009**: Everything else in the roster pane (mid-season move badges, head coaches, color key bar) MUST keep working as before.

### Key Entities

- **Rated stat**: A per-game stat that is color coded. After this change: points, rebounds, assists, steals, blocks and PER. Each has low, high and elite breakpoints.
- **Rating qualification**: Whether a player's line with a team is large enough to rate: at least 10 games and at least 10 minutes per game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Among players with 10+ games and 10+ minutes per game from 2003-04 onward, blocks split roughly like the other stats: red and green-plus-purple each between 22% and 32%, purple alone between 8% and 12%.
- **SC-002**: Spot checks of at least five players across different seasons show blocks and minutes per game matching the source for their games with that team.
- **SC-003**: In every roster, every player is either color coded or gray; no qualifying player is gray and no non-qualifying player is colored.
- **SC-004**: The roster pane still fits a phone-width screen without making the page scroll horizontally.

## Assumptions

- "Same color coding break points" means the same method as the other stats: the 25th, 75th and 90th percentiles of every 2003-04 to 2025-26 player-team season with 10+ games and 10+ minutes per game. Measured on 2026-10-26 these are 0.2, 0.6 and 1.0 blocks per game, giving about 23% red, 49% yellow, 16% green and 12% purple. Blocks are recorded to one decimal, so the split cannot be exactly 25/50/15/10.
- Blocks and minutes per game are already in the app's season data, so no new scraping is needed.
- "Gray out the stats" applies to the six rated stat values only. Name, position, age, games and minutes stay normal so the reason a row is gray stays readable.
- The color key bar keeps its existing 25/50/15/10 shares; they describe the rating scheme, not blocks specifically.
- "Sort by minutes played" (follow-ups) means minutes per game with the team, as confirmed by the user, so the order matches the MIN column. A player with only a few long games can rank high. Sorting is done when the season data is built, not in the browser.
