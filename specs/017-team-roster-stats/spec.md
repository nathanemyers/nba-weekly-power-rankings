# Feature Specification: Team Roster Stats

**Feature Branch**: `017-team-roster-stats`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "For each team in a series I want to add roster information. We will need to scrape this information from basketball reference. You can be liberal with the amount of data scraped, but I am interested in regular seasons data, and mostly focused on the per game stats. I want to sort players by the most games played and I want to know their position, age, points, rebounds, assists, steals, turnovers, as well as PER from the advanced stats. If possible I want to know if they were traded to or from the team during the season. This data will be displayed in a pane under the chart when a single team is selected. A future goal is to add a photo headshot for each player." Follow-up: "I also want to add the head coach information." Follow-up: "I want to add some color coding for points, rebounds, assists, steals, turnovers and PER… I am going to use red, yellow, and green color coding."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See who played for a team that season (Priority: P1)

A visitor pins a single team on the chart and wants to know who was actually on the floor. A roster pane appears under the chart listing every player who appeared for that team in the selected regular season, with the players who played the most games at the top. Each row shows the player's name, position, age, games played, and per-game points, rebounds, assists, steals and turnovers, plus their PER.

**Why this priority**: This is the feature. It connects a team's ranking line to the people who produced it.

**Independent Test**: Select the 2015-16 season, pin the Golden State Warriors, and confirm the pane lists the Warriors' 2015-16 regular-season players, ordered by games played, with Stephen Curry showing 79 games, 30.1 points, 5.4 rebounds, 6.7 assists, 2.1 steals, 3.3 turnovers and a PER of 31.5, matching Basketball-Reference.

**Acceptance Scenarios**:

1. **Given** the chart view with exactly one team pinned, **When** the selected season has roster data for that team, **Then** a roster pane appears under the chart listing every player who appeared for that team in that regular season.
2. **Given** the roster pane, **When** it is shown, **Then** players are ordered by games played for that team, most first; players with equal games are ordered by total minutes played, most first.
3. **Given** a player row, **When** a visitor reads it, **Then** it shows name, position, age, games played, and per-game points, rebounds, assists, steals and turnovers, plus PER.
4. **Given** no team or more than one team pinned, **When** the chart view is shown, **Then** no roster pane appears.
5. **Given** a team is pinned, **When** the visitor changes the selected season or pins a different team, **Then** the pane updates to that team and season.
6. **Given** a pinned team with no roster data for the selected season, **When** the chart view is shown, **Then** no pane appears and nothing suggests a broken or empty roster.

---

### User Story 2 - See who joined or left mid-season (Priority: P2)

A visitor wants to know which players were traded to or away from the team during the season, since a midseason trade often explains a jump or drop in the rankings. Players who joined the team partway through the season are marked as arrivals, and players who left partway through are marked as departures. Where known, the mark names the other team.

**Why this priority**: The user asked for it "if possible". It adds a lot of context but the roster is useful without it.

**Independent Test**: Select 2018-19, pin the Toronto Raptors, and confirm Marc Gasol is marked as arriving from Memphis and Jonas Valančiūnas is marked as leaving for Memphis.

**Acceptance Scenarios**:

1. **Given** a player who played for the team after playing for another team earlier in the same season, **When** the roster pane is shown, **Then** the player is marked as having joined mid-season, and the mark names the team they came from when known.
2. **Given** a player who played for the team and then for another team later in the same season, **When** the roster pane is shown, **Then** the player is marked as having left mid-season, and the mark names the team they went to when known.
3. **Given** a player who played for three or more teams in a season, **When** the pane is shown, **Then** both marks can apply to the same player (joined from one team, left for another).
4. **Given** a player who spent the whole season with the team, **When** the pane is shown, **Then** no mark appears.
5. **Given** a mark, **When** a visitor hovers or focuses it, or uses a screen reader, **Then** it reads out what happened in words, for example "Joined from Memphis Grizzlies mid-season".
6. **Given** a traded player, **When** their row is shown, **Then** their stats are only the games they played for this team, not their season totals across teams.

---

### User Story 3 - See who coached the team that season (Priority: P2)

A visitor pinning a team also wants to know who was coaching it, since a coaching change often lines up with a turn in the rankings. The roster pane names the team's head coach for the selected regular season, with that coach's win-loss record. If the team changed coaches during the season, every head coach is listed in the order they coached, each with their own record for this team that season.

**Why this priority**: The user asked for it alongside the roster. It adds context but the pane is useful without it.

**Independent Test**: Select 2018-19, pin the Chicago Bulls, and confirm the pane lists Fred Hoiberg (5-19) followed by Jim Boylen (17-41). Pin the Toronto Raptors and confirm it lists only Nick Nurse (58-24).

**Acceptance Scenarios**:

1. **Given** the roster pane for a team and season, **When** it is shown, **Then** it names the team's head coach and their regular-season win-loss record with the team that season.
2. **Given** a team that changed head coaches during the season, **When** the pane is shown, **Then** every head coach is listed in the order they coached, each with their own record, and it is clear that the later coach replaced the earlier one.
3. **Given** a team-season with coaching data but no roster data, **When** the chart view is shown, **Then** the pane follows the roster rule (FR-010) and does not appear.
4. **Given** the saved data, **When** the maintainer inspects a coach, **Then** it records a stable coach identifier from the source alongside name and record, so a photo or coach page can be added later.

---

### User Story 4 - Roster and coaching data for every season in the app (Priority: P1)

The maintainer needs roster, stats and head coach data for every team in every season the app shows. They run a roster scraper that collects each team's regular-season roster, per-game stats, advanced stats and head coaches from Basketball-Reference and stores them with the app's other raw data. The data build then turns it into app data.

**Why this priority**: The pane can't show anything without this data, so it blocks User Stories 1, 2 and 3.

**Independent Test**: Run the roster scraper, then confirm every team in every season from 2003-04 onward has a roster whose players' games played add up to plausible totals (no team has zero players, every player has at least one game).

**Acceptance Scenarios**:

1. **Given** no roster data, **When** the maintainer runs the roster scraper, **Then** it collects roster, stats and head coach data for every team in every season the app shows.
2. **Given** a later run, **When** some team-seasons are already saved, **Then** the scraper only fetches the ones it doesn't have, unless told to re-fetch.
3. **Given** the season in progress, **When** the maintainer re-runs the scraper with a re-fetch option for that season, **Then** its rosters are refreshed with the latest stats.
4. **Given** the saved data, **When** the maintainer inspects a player, **Then** it records a stable player identifier from the source alongside name and stats, so a headshot can be added later without re-scraping.
5. **Given** the scraper is running, **Then** it paces requests to the source's crawl delay and identifies itself, like the existing playoffs scraper.

---

### User Story 5 - See at a glance who stood out (Priority: P3)

A visitor scanning a roster wants to spot the standout and struggling stat lines without comparing numbers in their head. Points, rebounds, assists, steals, turnovers and PER are colored green, yellow or red by how they compare with every regular rotation player since 2003-04: green for the top quarter, red for the bottom quarter, yellow in between. For turnovers fewer is better, so a low turnover rate is green.

**Why this priority**: It makes the pane faster to read but adds no new information; the numbers are already there.

**Independent Test**: Select 2015-16, pin Golden State, and confirm Stephen Curry's points, assists, steals and PER are green, his rebounds yellow and his turnovers red. Confirm Kevon Looney (5 games) has no colors.

**Acceptance Scenarios**:

1. **Given** a player with at least 10 games and 10 minutes per game, **When** the pane is shown, **Then** each of points, rebounds, assists, steals and PER is red below its low breakpoint, yellow from the low breakpoint up to the high one, and green from the high breakpoint up.
2. **Given** the same player's turnovers, **When** the pane is shown, **Then** they are green below the low breakpoint, yellow up to the high one, and red from the high breakpoint up.
3. **Given** a player with fewer than 10 games or fewer than 10 minutes per game, **When** the pane is shown, **Then** none of their stats are colored.
4. **Given** a missing PER, **When** the pane is shown, **Then** the dash is not colored.
5. **Given** the pane, **When** a visitor wonders what the colors mean, **Then** a short note under the table explains them, so the colors never stand alone.

---

### Edge Cases

- **Relocated or renamed franchises.** Roster data is matched to the franchise as it appears in the app. The 2007-08 Seattle SuperSonics roster appears when Oklahoma City is pinned in 2007-08, and the Charlotte Bobcats and New Orleans Hornets rosters appear under their current franchises.
- **Players with missing values.** Some stats can be blank in the source (for example PER for a player with very few minutes). The row shows a dash instead of a zero or an error.
- **Very short stints.** A player who appeared in one game for one minute still appears, at the bottom of the list.
- **Two-way and 10-day contracts.** Treated like any other player who appeared in a game. Players on the roster who never played a game are not shown.
- **Season in progress.** The pane shows the roster as of the last scrape. Ages and stats reflect that point in time.
- **Long rosters.** Some team-seasons have 20+ players. The pane stays readable and does not push the page into horizontal scrolling.
- **Small screens.** At phone width, the pane fits without horizontal page scroll; if all columns don't fit, the table may scroll horizontally inside the pane while the player name stays visible.
- **Same name, different players.** Players are identified by the source's player identifier, not by name.
- **Interim coaches.** An interim head coach is listed like any other head coach, with their own record.
- **Coach who returns.** If the source lists the same coach twice for one team in a season, each stint is shown separately in order.
- **Trades where the other team is unknown.** A player marked as joining or leaving without a known other team shows the mark without a team name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The raw data MUST include, for every team in every season the app shows, each player who appeared for that team in the regular season with: source player identifier, name, position, age, games played, games started, minutes, and per-game stats (at least points, rebounds, assists, steals, blocks, turnovers, fouls, and shooting splits), plus advanced stats including PER.
- **FR-002**: The roster scraper MUST collect only regular-season player stats, MUST skip team-seasons already saved unless asked to re-fetch, and MUST honor the source's crawl delay and identify itself with a descriptive user agent.
- **FR-003**: The app data for each season MUST include, for each team, its roster with: player identifier, name, position, age, games played, minutes, per-game points, rebounds, assists, steals and turnovers, PER, and any mid-season arrival or departure with the other team when known.
- **FR-004**: When exactly one team is pinned in the chart view and that team has roster data for the selected season, the app MUST show a roster pane under the chart.
- **FR-005**: The roster pane MUST list players in order of games played for the team, most first, breaking ties by total minutes, most first.
- **FR-006**: Each player row MUST show name, position, age, games played, per-game points, rebounds, assists, steals and turnovers, and PER.
- **FR-007**: Each player's stats MUST be only those from games played for that team.
- **FR-008**: A player who joined the team mid-season MUST be marked as an arrival, and a player who left mid-season MUST be marked as a departure, naming the other team when known. The mark MUST be readable as text by hover, keyboard focus and screen readers.
- **FR-009**: Missing stat values MUST be shown as a dash.
- **FR-010**: The roster pane MUST NOT appear when zero or more than one team is pinned, or when the pinned team has no roster data for the season.
- **FR-011**: Roster data that fails sanity rules (a team-season with no players, a player with zero games, a per-game value that is negative) MUST stop the data build with an error naming the team, season and player.
- **FR-012**: Existing chart view features (playoff series badges, team summary, rank swings, team history) MUST keep working as before.
- **FR-013**: The raw data MUST include, for every team in every season the app shows, each head coach who coached the team that regular season, in the order they coached, with: source coach identifier, name, regular-season games, wins and losses with the team that season, and, when the source provides them, playoff record that season and franchise and career totals.
- **FR-014**: The app data for each season MUST include, for each team, its head coaches in order with identifier, name, and regular-season wins and losses with the team that season.
- **FR-015**: The roster pane MUST show the team's head coach or coaches for the season, in order, each with their regular-season win-loss record with the team.
- **FR-016**: Coaching data that fails sanity rules (a team-season with no head coach, or coaches whose games add up to more than an 82-game season, or a coach with zero games) MUST stop the data build with an error naming the team and season.

- **FR-017**: The pane MUST color points, rebounds, assists, steals, turnovers and PER using these breakpoints (low, high): points 6, 13.5; rebounds 2.5, 5.5; assists 1, 3; steals 0.5, 1; turnovers 0.9, 1.8; PER 11, 17. A value below low is red (green for turnovers), from low up to high is yellow, and from high up is green (red for turnovers).
- **FR-018**: Stats MUST NOT be colored for players with fewer than 10 games or fewer than 10 minutes per game for the team, or for a missing value.
- **FR-019**: The pane MUST explain the colors in text under the table, including which players are colored and that fewer turnovers rate higher.
- **FR-020**: Colors MUST come from the site theme, and only the six listed stats are colored.

### Key Entities

- **Player**: A person who played in the NBA, identified by the source's stable player identifier. Attributes: name, and (later) a headshot.
- **Roster entry**: One player's regular season with one team. Attributes: position, age, games played, games started, minutes, per-game stats, advanced stats including PER, and any mid-season arrival or departure.
- **Team roster**: All roster entries for one team in one season, ordered by games played.
- **Head coach stint**: One coach's time as a team's head coach within one season. Attributes: coach identifier, name, order within the season, regular-season games, wins and losses.
- **Mid-season move**: A player joining from, or leaving for, another team during the season. Attributes: direction (joined or left) and the other team when known.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every team in every season the app shows has a roster: 22 completed seasons plus the season in progress, about 30 teams each.
- **SC-002**: Spot checks of at least five players across different seasons, including at least two traded players, match the source's per-game stats and PER exactly for their games with that team.
- **SC-003**: Spot checks of at least five well-known midseason trades show the correct arrival and departure marks on both teams involved.
- **SC-004**: A visitor can see who a pinned team's main players and head coach were in a season, and who joined or left, without leaving the chart view.
- **SC-006**: Spot checks of at least three mid-season coaching changes list the coaches in the right order with records matching the source.
- **SC-007**: Among players with 10+ games and 10+ minutes per game, each colored stat splits roughly a quarter red, half yellow and a quarter green across all seasons (each band within 22% to 32% at the ends).
- **SC-005**: The roster pane fits a phone-width screen without making the page scroll horizontally.

## Assumptions

- "For each team in a series" is read as "for each team in a season": every team in every season the app shows (2003-04 to 2015-16, 2017-18 to 2025-26, and the season in progress), not only playoff teams.
- Basketball-Reference team season pages publish the roster, per-game and advanced stats for the team, and the source shows which teams a player played for during a season, in order. Order of stints is enough to tell arrivals from departures; the exact transaction (trade vs. waiver signing) is not required, so "traded" is shown as "joined" or "left" mid-season.
- Basketball-Reference's league-wide season pages list every player's stats for each team they played for that season, in the order they played for them, and its league coaches page lists every team's head coaches in the order they coached. A full scrape is three pages per season (69 pages, about 3.5 minutes at a 3-second crawl delay). Re-runs skip saved data.
- "Head coach information" means who the head coach was and their record that season. Assistant coaches and coaching staff are out of scope. Coach photos are out of scope, but the stored coach identifier is what a future photo feature would use.
- Age is the player's age as the source reports it for that season.
- Rebounds means total rebounds per game.
- The pane is shown in the chart view only. Adding rosters to the team history view is out of scope.
- Sorting by other columns is out of scope; games played is the only sort order.
- Color breakpoints are the 25th and 75th percentiles of every 2003-04 to 2025-26 player-team season with 10+ games and 10+ minutes per game, chosen by the maintainer from the distributions on 2026-10-26. They are fixed values, not recalculated per season, so a 15-point scorer is green in any era. Recalculating them after new seasons are added is a manual step.
- Player headshots are out of scope, but the stored player identifier is what a future headshot feature will use.
- Playoff stats are out of scope; only regular-season data is collected and shown.
