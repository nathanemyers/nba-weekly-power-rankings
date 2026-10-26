# Feature Specification: Playoff Series Badges

**Feature Branch**: `016-playoff-series-badges`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "add more detailed playoff results. For postseason data, I want a series of badges that will show how far a team got. the badge should show the team logo of the team they played, the number of games the series went (between 4 and 7), the corresponding medal for that playoff stage (bronze, silver, gold, cup, and crown), and be either green or red depending if they won or lost the series. We will need full playoff results in the data for all seasons we have data on if we do not already. If we do not we will need to build a scraper and store that data."

## Clarifications

### Session 2026-10-26

- Q: Where should the series badges appear? → A: Both: on each season card in the team history, and in the chart view when exactly one team is pinned.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a team's playoff run series by series (Priority: P1)

A visitor looking at a team's season wants to know how its playoff run went, not just how far it got. They see one badge per playoff series the team played, in the order the rounds were played. Each badge shows the opponent's logo, how many games the series took, the medal for that round, and is green if the team won the series or red if it lost. A team that lost in the second round shows a green first-round badge followed by a red second-round badge; a champion shows four green badges ending in a crown.

Badges appear in two places. Each season card in a team's history shows that season's badges. The chart view shows the pinned team's badges for the selected season whenever exactly one team is pinned.

**Why this priority**: This is the feature. The current single medal only says where a team's run ended; the badges tell the story of the run.

**Independent Test**: Pick a season and team with a known playoff run, such as the 2015-16 Cleveland Cavaliers, and confirm the badges read: Detroit (4 games, bronze, green), Atlanta (4, silver, green), Toronto (6, gold, green), Golden State (7, crown, green).

**Acceptance Scenarios**:

1. **Given** a team that played in the playoffs, **When** its badges are shown, **Then** there is exactly one badge per series it played, ordered first round to Finals.
2. **Given** a series badge, **When** a visitor looks at it, **Then** it shows the opponent's logo, the number of games played (4 to 7), and the medal for that round: bronze for the first round, silver for the second round, gold for the conference finals, cup for the Finals, or crown for a Finals the team won.
3. **Given** a series the team won, **When** its badge is shown, **Then** the badge is green. **Given** a series the team lost, **Then** it is red.
4. **Given** a series badge, **When** a visitor hovers or focuses it, or uses a screen reader, **Then** it reads out the full result in words, for example "Conference finals: beat Toronto Raptors 4-2".
5. **Given** a team that missed the playoffs that season, **When** the badges would be shown, **Then** no badges appear and nothing implies a playoff run.
6. **Given** the chart view with exactly one team pinned, **When** the selected season's playoffs are complete, **Then** that team's badges for the season appear in the chart view. **When** no team or more than one team is pinned, **Then** no badges appear there.
7. **Given** a team's history, **When** it shows, **Then** each season card shows that season's badges for the team. Clicking a badge doesn't trigger the card's own click, which switches to the chart.

---

### User Story 2 - Complete series results for every season in the app (Priority: P1)

The maintainer needs the full result of every playoff series, including how many games it went, for every season the app shows (2003-04 to 2015-16 and 2017-18 onward). Today the playoffs data only records who played and who won each series. The maintainer runs the playoffs scraper and it stores, for every series, both teams, the winner, and the series score.

**Why this priority**: The badges can't show game counts without this data, so it blocks User Story 1.

**Independent Test**: Run the playoffs scraper and confirm every season from 2003-04 has 15 series (8 first round, 4 second round, 2 conference finals, 1 Finals), each with a winner and a series score whose winner has 4 wins and whose loser has 0 to 3.

**Acceptance Scenarios**:

1. **Given** the existing playoffs data without game counts, **When** the maintainer runs the playoffs scraper, **Then** every saved season is updated with series scores, even though those seasons were already saved.
2. **Given** an updated season, **When** the maintainer inspects any series, **Then** it records both teams, the winner, and the number of games each team won.
3. **Given** a later run, **When** every season already has series scores, **Then** the scraper only fetches seasons it doesn't have, as it does today.
4. **Given** the updated data, **When** the app data is rebuilt, **Then** the existing playoff medals and champions are unchanged.

---

### Edge Cases

- **Missed the playoffs.** No badges, and no empty placeholder space that suggests missing data.
- **Season still in progress.** If the playoffs haven't finished, show the series that are complete. A series still being played isn't shown. Seasons with no playoff data show no badges.
- **Play-in tournament (2019-20 onward).** Play-in games are not a series and don't get a badge. A team eliminated in the play-in shows no badges.
- **2019-20 bubble.** It was played as normal best-of-seven series, so it's treated like any other season.
- **Relocated or renamed franchises.** The opponent's logo is the franchise's current logo, matching how teams appear elsewhere in the app (for example the 2007-08 Seattle SuperSonics show as Oklahoma City).
- **Series score sanity.** A series must have a winner with 4 wins and a loser with 0 to 3. Data that breaks this is rejected by the build, not shown.
- **Small screens.** Four badges side by side must fit at phone width without horizontal scrolling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The playoffs data MUST record, for every series in every season from 2003-04 onward: the round, both teams, the winner, and how many games each team won.
- **FR-002**: The playoffs scraper MUST collect series scores and MUST update seasons that were saved before this field existed. It MUST keep skipping seasons that are already complete in the new format, and keep its current request pacing and identification.
- **FR-003**: The app data for each season MUST include each playoff team's series in round order: round, opponent, games won by each side, and whether the team won.
- **FR-004**: For each series a team played, the app MUST show a badge with the opponent's logo, the number of games played, and the round's medal. The badges MUST appear on each season card of the team's history, and in the chart view for the selected season whenever exactly one team is pinned.
- **FR-005**: Badge medals MUST be: first round bronze, second round silver, conference finals gold, Finals cup if lost, Finals crown if won.
- **FR-006**: A badge MUST be green when the team won the series and red when it lost, using colors defined in the site's theme, and MUST stay readable in the site's dark theme.
- **FR-007**: Each badge MUST expose the full result in words (round, won or lost, opponent's full name, series score) to hover, keyboard focus and screen readers, so color is not the only signal of a win or loss.
- **FR-008**: Teams with no series in a season MUST show no badges.
- **FR-009**: Play-in games MUST NOT produce badges.
- **FR-010**: Existing playoff features (the champion logo in the season dropdown, the playoff medals on the chart, and Season Trends) MUST keep working and show the same results as before.
- **FR-011**: Series data that fails the sanity rules (a winner without 4 wins, a loser with 4 or more, a series count other than 15 for a completed season) MUST stop the data build with an error naming the season and series.

### Key Entities

- **Playoff series**: One best-of-seven matchup in a season. Attributes: round, the two teams, the winner, and games won by each team.
- **Team's playoff run**: The ordered list of series one team played in one season, from its first-round series to the series it was eliminated in (or the Finals it won).
- **Series badge**: The visual summary of one series from one team's point of view: opponent logo, games played, round medal, and won or lost.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every completed season the app shows has all 15 playoff series with scores: 22 seasons, 330 series.
- **SC-002**: For every playoff team in every season, the number of badges equals the number of series it played, and the last badge's medal matches the team's existing playoff medal.
- **SC-003**: Spot checks of at least five well-known runs (including a sweep, a seven-game Finals, and a team eliminated in each round) match the published results exactly.
- **SC-004**: A visitor can tell how a team's playoff run went (each opponent, each round, each result, each series length) without leaving the page or reading any text other than the badges.
- **SC-005**: Win or loss is distinguishable without relying on color alone, for example through the medal, the hover or focus text, and the screen reader label.

## Assumptions

- "All seasons we have data on" means every season shown in the app: 2003-04 to 2015-16 and 2017-18 to 2025-26. 2016-17 has playoff data but no rankings, so it gets series scores in the data but no badges. The season in progress (2026-27) has no playoffs yet.
- The existing playoffs data comes from Basketball-Reference, which also publishes each series' result and score on the same season pages. Extending the existing playoffs scraper is enough; no new data source is needed.
- Every playoff series in these seasons is best-of-seven (the first round became best-of-seven in 2002-03), so series last 4 to 7 games.
- "Number of games the series went" is the total games played (4 to 7). The hover text gives the series score (for example 4-2).
- The badge medal follows the round, not the result, except the Finals: a Finals loss gets the cup and a Finals win gets the crown. This matches the app's existing medals, where the cup means "runner-up in the Finals" and the crown means "champion".
- Team logos use the existing logo set, so relocated franchises show their current logo.
- Re-fetching every season once to add series scores is acceptable. It's about 23 pages at the scraper's existing 3-second spacing.
