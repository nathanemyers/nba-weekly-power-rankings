# Feature Specification: Team AI Season Summary

**Feature Branch**: `006-team-ai-summary`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "When the user clicks on a team, I want to show a pre-calculated LLM summary of each of that team's weekly summaries. This should note that it is an AI summary when displayed. This information should be updated during an active season on each weekly scrape. Do not generate new summaries for completed seasons that have summaries. This information will be displayed in a UI element that is yet to be defined."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a team's AI-generated season summary (Priority: P1)

A visitor clicks on a team and sees a short, pre-written summary that pulls together that team's weekly write-ups for the currently selected season into one cohesive narrative, clearly marked as AI-generated.

**Why this priority**: This is the entire value of the feature — a visitor gets a quick, readable season narrative for a team instead of having to read through every week's blurb individually.

**Independent Test**: Select a season, click a team that has weekly summaries recorded, and confirm a labeled AI summary appears reflecting that team's season. Fully testable and valuable on its own, independent of how often it refreshes.

**Acceptance Scenarios**:

1. **Given** a team with recorded weekly summaries for the selected season, **When** the user clicks that team, **Then** a summary synthesizing that team's weekly summaries is shown, clearly labeled as AI-generated.
2. **Given** a team with no recorded weekly summaries for the selected season, **When** the user clicks that team, **Then** no AI summary is shown and no error is displayed.

---

### User Story 2 - Summary stays current during an active season (Priority: P2)

During an ongoing season, a visitor who revisits a team's summary after a new week has been scraped sees a summary that accounts for the latest week, not a stale one.

**Why this priority**: Keeps the feature useful throughout the season rather than only being accurate at a single point in time. Depends on Story 1 already existing.

**Independent Test**: For an active season, trigger the regular weekly scrape, and confirm the affected teams' stored summaries are regenerated to include the newly scraped week, while summaries for completed seasons are left untouched by the same run.

**Acceptance Scenarios**:

1. **Given** a season that is still active, **When** the weekly scrape runs and adds a new week of data for a team, **Then** that team's AI summary is regenerated to reflect all weekly summaries recorded so far, including the new week.
2. **Given** the same scrape run also covers teams or seasons that are already complete, **When** the scrape finishes, **Then** summaries belonging to completed seasons are not regenerated.

---

### User Story 3 - Completed-season summaries stay stable (Priority: P3)

A visitor looking at a team's summary for a season that has already ended sees the same summary every time, even after future scrapes run for other, active seasons.

**Why this priority**: Builds trust that historical information doesn't unexpectedly change, and avoids unnecessary regeneration work for data that will never change. Polish/integrity guarantee layered on top of Stories 1 and 2.

**Independent Test**: Confirm that a completed season's team summary, once generated, remains byte-for-byte identical across multiple subsequent scrape runs.

**Acceptance Scenarios**:

1. **Given** a completed season whose teams already have stored AI summaries, **When** any later weekly scrape runs (for the same or a different season), **Then** those existing summaries are left unchanged.
2. **Given** a completed season whose teams do not yet have a stored AI summary (e.g., an older season being covered by this feature for the first time), **When** summaries are generated for it, **Then** each team's summary is generated once and thereafter treated as locked, following the same rule as other completed seasons.

---

### Edge Cases

- A team has weekly summary data for only part of the season (e.g., was eliminated early, or data collection started late): the AI summary covers only the weeks that exist for that team.
- A team has zero weekly summaries for the selected season: no AI summary is generated or shown; clicking the team shows no summary rather than an error or placeholder implying one is coming.
- The weekly scrape runs but a team had no new data that week (e.g., bye, data gap): that team's summary is only regenerated if its underlying weekly summaries actually changed.
- A season transitions from active to complete between one scrape and the next: the first scrape after completion may still generate/update the summary; from that point forward it is treated as locked per Story 3.
- The user switches between teams or seasons rapidly: each click shows the correct, already pre-calculated summary for the newly selected team/season without noticeable delay, since summaries are pre-calculated rather than generated on click.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide one pre-calculated AI-generated summary per team per season, synthesizing that team's recorded weekly summaries for that season.
- **FR-002**: Users MUST be able to view a team's AI summary by clicking that team for the currently selected season, consistent with how clicking a team already works elsewhere in the app.
- **FR-003**: Wherever an AI summary is shown, it MUST be clearly and visibly labeled as AI-generated.
- **FR-004**: For a season that is still active, the system MUST regenerate an affected team's AI summary after each weekly scrape that adds new weekly summary data for that team.
- **FR-005**: For a season that is complete, the system MUST NOT regenerate a team's AI summary if one is already stored for that team and season.
- **FR-006**: For a completed season where a team does not yet have a stored AI summary, the system MUST be able to generate one; once generated, it becomes subject to the same no-regeneration rule as other completed-season summaries.
- **FR-007**: If a team has no recorded weekly summaries for the selected season, the system MUST NOT generate or display an AI summary for that team/season, and MUST NOT present this as an error.
- **FR-008**: The AI summary MUST be based only on that team's own recorded weekly summaries for the season in question.

### Key Entities

- **Team Season Summary**: A pre-calculated, AI-generated piece of text for one team in one season, synthesizing that team's weekly summaries; carries an AI-generated label and a locked/unlocked state (locked once its season is complete and the summary exists).
- **Weekly Summary** *(existing data)*: The per-week blurb already recorded for a team in a season; serves as the source material the AI summary is built from.
- **Season** *(existing entity)*: Has an active/complete status that determines whether its teams' summaries are eligible for regeneration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking any team with recorded weekly summaries surfaces its AI summary with no page reload and no noticeable delay, since the summary is already pre-calculated.
- **SC-002**: 100% of displayed team summaries are visibly labeled as AI-generated.
- **SC-003**: After a weekly scrape during an active season, every team with new weekly data has an updated summary reflecting that data by the time the scrape process completes.
- **SC-004**: Across repeated scrape runs, 100% of completed-season summaries remain unchanged (byte-for-byte identical) once they exist.
- **SC-005**: Teams or seasons without weekly summary data produce zero errors when selected; the absence of a summary is the only visible effect.

## Assumptions

- The AI summary is scoped to the currently selected season (one summary per team per season), matching how the rest of the app already scopes team data to a season — this is not a cross-season career summary.
- "Weekly scrape" refers to this project's existing periodic data-collection/build process; summary generation is treated as a step that runs alongside that same process while a season is active.
- A season's active/complete status reuses whatever notion of "season is over" already governs the rest of the app's data (e.g., the season is no longer receiving new weekly data); this feature does not introduce a separate definition.
- Historical/completed seasons that predate this feature will have their team summaries generated once as a backfill; after that initial generation, they follow the same locked, no-regeneration rule as any other completed season.
- The specific UI element used to present the summary is intentionally undecided per the feature request and will be determined separately; this spec only requires that the summary becomes viewable as a result of clicking a team.
- The underlying mechanism used to produce the AI-generated text is an implementation detail and out of scope for this specification.
