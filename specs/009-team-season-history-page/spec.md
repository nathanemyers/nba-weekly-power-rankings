# Feature Specification: Team Season History Page

**Feature Branch**: `009-team-season-history-page`

**Created**: 2026-10-12

**Status**: Implemented (#18, built without plan.md or tasks.md)

**Input**: User description: "I want to create a page for each team that shows their performance for each season we have data on. For each season show a small overview infographic, the same one used in spec008. Also display the AI generated summary. When the user clicks on one of these seasons, update the chart to show that season with the given team highlighted."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor browses a team's season-by-season history (Priority: P1)

A visitor opens a page dedicated to a single team and sees every season that team has recorded data for, each represented by a small rank-change infographic (the same style used for the biggest-movers pane) and, where available, the AI-generated summary of that team's season.

**Why this priority**: This is the core value of the page — a single place to see a team's whole recorded history at a glance. Nothing else in this feature matters without it.

**Independent Test**: Open a given team's page and confirm it lists every season that team has ranking data for, each with its rank-change infographic and, when one exists, its AI summary — fully testable without any click interaction.

**Acceptance Scenarios**:

1. **Given** a team with recorded ranking data across multiple seasons, **When** a visitor opens that team's page, **Then** every one of those seasons appears, each showing a small rank-change infographic for that team in that season.
2. **Given** a season on the team's page that has a generated AI summary for that team, **When** the visitor views that season's entry, **Then** the summary is shown, clearly labeled as AI-generated.
3. **Given** a season on the team's page that has no generated AI summary yet for that team, **When** the visitor views that season's entry, **Then** the infographic still appears and no summary, error, or misleading placeholder is shown in its place.
4. **Given** a season for which the team has no recorded ranking data at all, **When** the visitor views that team's page, **Then** that season does not appear.

---

### User Story 2 - Clicking a season jumps to it in the main chart (Priority: P2)

A visitor clicks one of the seasons listed on a team's page and the main weekly power-rankings chart updates to show that season, with the team highlighted, so they can see the season's week-by-week detail behind the summary view.

**Why this priority**: This turns the season-history page from a read-only summary into a jumping-off point back into the app's primary chart experience. It depends on the page (P1) already listing seasons to click.

**Independent Test**: From a team's page, click any listed season and confirm the main chart updates to that season with the team highlighted, independent of which other seasons exist on the page.

**Acceptance Scenarios**:

1. **Given** a team's page listing multiple seasons, **When** the visitor clicks one of those seasons, **Then** the main chart updates to show that season with this team highlighted.
2. **Given** the visitor has just highlighted a team via one season, **When** they click a different season on the same team's page, **Then** the chart updates to the newly clicked season, still with the same team highlighted.

---

### Edge Cases

- A team has data for only one season: that team's page shows just that one season rather than an empty or broken list.
- A team's active (in-progress) season has only one recorded week so far: that season still appears on the page, with its rank-change infographic reflecting whatever single data point exists, and with an AI summary if one has already been generated for it.
- A season existed for the league but the specific team has no recorded data for it (e.g., an expansion team that didn't yet exist): that season is simply absent from this team's page.
- A team has a very long recorded history (many seasons): the page lists all of them rather than silently truncating.
- The visitor clicks a season for a team that, for some reason, isn't present in that season's chart data: the chart updates to the season, and the highlight has no visible effect for that team, consistent with how team highlighting already behaves elsewhere when a team has no chart data for a season.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a page for each team that lists every season for which that team has recorded ranking data.
- **FR-002**: System MUST exclude from a team's page any season for which that team has no recorded ranking data.
- **FR-003**: For each season listed on a team's page, system MUST show a small rank-change infographic for that team in that season, in the same style used for the season rank-swings pane.
- **FR-004**: For each season listed, if an AI-generated summary exists for that team and season, system MUST display it, clearly labeled as AI-generated.
- **FR-005**: For each season listed, if no AI-generated summary exists yet for that team and season, system MUST omit the summary rather than showing an error or a placeholder implying one exists.
- **FR-006**: A team's page MUST include its currently active (in-progress) season, provided the team has at least one recorded week of data for it.
- **FR-007**: Users MUST be able to click any season listed on a team's page.
- **FR-008**: Clicking a season on a team's page MUST update the main rankings chart to show that season with the given team highlighted.
- **FR-009**: Seasons on a team's page MUST be listed in a consistent order, with the most recent season first.

### Key Entities

- **Team Page**: A view dedicated to one team, listing every season that team has recorded data for.
- **Team Season Entry**: One item within a team's page, representing that team's data for a single season — its rank-change infographic and, if available, its AI-generated summary.
- **Team Season Rank Swing** *(existing concept, reused)*: The start/end rank-change data and infographic style introduced in 008-season-rank-swings, applied per team/season here regardless of whether that season is complete.
- **Team Season Summary** *(existing concept, reused)*: The AI-generated summary introduced in 006-team-ai-summary, displayed here when available for a given team/season.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a single team's page, a visitor can see every season that team has data for, each with its rank-change infographic, without additional navigation.
- **SC-002**: Wherever an AI summary appears on a team's page, it is clearly labeled as AI-generated in 100% of cases.
- **SC-003**: Clicking any season on a team's page updates the main chart to the correct season with the correct team highlighted, with no page reload, perceived as instant (well under 1 second).
- **SC-004**: Seasons for which a team has no recorded data never appear on that team's page.
- **SC-005**: Seasons without a generated AI summary still display their rank-change infographic correctly, with zero errors or misleading placeholders.

## Assumptions

- The rank-change infographic reuses the visual introduced in 008-season-rank-swings, but applies it to every season a team has data for (including the current active season), rather than being limited to completed seasons the way that feature's league-wide "biggest movers" pane is.
- For the active/in-progress season, the rank-change infographic reflects the team's rank as of its most recently recorded week, not a final season result, since that season has not concluded.
- The AI summary shown here reuses 006-team-ai-summary as-is, including its AI-generated labeling requirement and its rule that a team/season without a summary simply shows none — this spec does not change how or when those summaries are generated.
- A team can have a season entry on its page even with just one recorded week of data (e.g., very early in an active season); this differs from 008's rank-swings pane, which requires at least two recorded weeks before a team is considered for that league-wide ranking.
- How a visitor navigates to a given team's page in the first place (e.g., from a team list or label elsewhere in the app) is left to planning; this spec only requires that such a page exists and is reachable.
- Clicking a season to highlight the team in the chart reuses the existing single-team highlight/pin mechanism already used by related features (005-playoff-bracket, 008-season-rank-swings).
