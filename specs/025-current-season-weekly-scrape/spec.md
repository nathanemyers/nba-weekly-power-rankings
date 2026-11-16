# Feature Specification: Current Season Support and Weekly Rankings Refresh

**Feature Branch**: `025-current-season-weekly-scrape`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "add support for the current season and set up a weekly job to scrape new power rankings. updating storylines will be a separate task. the default view when a user loads the page should be the current season"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the current season's rankings (Priority: P1)

A fan opens the site during the 2026-27 season and sees this season's weekly power rankings: every week published so far, each team's line, and the usual chart, trends, and team details. The season works like any past season, except that it is still in progress and some data does not exist yet.

**Why this priority**: The site currently stops at 2025-26. Without the current season, nothing else in this feature means anything.

**Independent Test**: Load the current season's rankings into the site by hand, open the 2026-27 address, and confirm every published week appears and every view loads without errors or empty panels.

**Acceptance Scenarios**:

1. **Given** NBA.com has published N weekly rankings for 2026-27, **When** a visitor opens the 2026-27 season, **Then** the chart shows weeks 1 through N for all 30 teams.
2. **Given** the current season has no champion, AI summaries, or storylines yet, **When** a visitor opens any view of that season, **Then** the views that depend on that data show a clear "season in progress" or "not available yet" state rather than errors, blank areas, or wrong data from another season.
3. **Given** a visitor opens a team's history or a player's history, **When** the team or player appears in the current season, **Then** the current season is included alongside past seasons.
4. **Given** the current season is listed in the season picker, **When** a visitor opens the picker, **Then** 2026-27 appears first and is marked as in progress.

---

### User Story 2 - Land on the current season by default (Priority: P1)

A visitor opens the site's root address and lands directly on the current season, with no extra clicks.

**Why this priority**: Most visitors come for this week's rankings. This is the user's explicit requirement and costs little once Story 1 exists.

**Independent Test**: With the current season's data present, open the site's root address in a fresh browser and confirm the current season shows.

**Acceptance Scenarios**:

1. **Given** current-season data exists, **When** a visitor opens the root address, **Then** the current season's view shows.
2. **Given** a visitor opens a link to a specific past season, **When** the page loads, **Then** that past season shows, not the current one.
3. **Given** a visitor opens an address for a season that does not exist, **When** the page loads, **Then** they are sent to the current season.
4. **Given** the new season has started but its first ranking has not been published yet, **When** a visitor opens the root address, **Then** the most recent season with at least one published week shows.

---

### User Story 3 - New rankings appear each week without manual work (Priority: P2)

The maintainer no longer has to scrape, rebuild, and publish the data by hand each week. A scheduled job picks up each new ranking and opens a pull request with it, which merges itself once its checks pass. The maintainer can review it but does not have to.

**Why this priority**: Stories 1 and 2 already deliver value with a manual refresh. Automation keeps the site current without the maintainer's time.

**Independent Test**: Trigger the job by hand after a new article is published and confirm a pull request with the new week appears, merges itself once its checks pass, and the new week appears on the live site. Trigger it again with nothing new and confirm nothing changes.

**Acceptance Scenarios**:

1. **Given** NBA.com published a new weekly ranking since the last run, **When** the scheduled job runs, **Then** the new week is collected, the season data is rebuilt, and a pull request with the new week is opened. Once its checks pass it merges itself, and the live site shows the new week.
2. **Given** no new ranking has been published since the last run, **When** the job runs, **Then** it makes no data changes and opens no pull request.
3. **Given** the source is unreachable or an article cannot be parsed, **When** the job runs, **Then** it fails visibly to the maintainer, opens no pull request, and the live site keeps showing the last good data.
4. **Given** the maintainer wants a refresh outside the schedule, **When** they start the job by hand, **Then** it behaves the same as a scheduled run.

---

### Edge Cases

- **Format change in the source**: The 2026-27 Week 1 article already in the repository was saved without per-team rankings, only raw text. Current-season articles must yield all 30 teams' ranks and write-ups. An article that yields fewer than 30 teams must fail the run instead of proposing a partial week.
- **Preseason and offseason articles**: Articles like the offseason rankings published between seasons must not appear as numbered weeks of either season.
- **Season rollover**: When the next season's first ranking appears (e.g. 2027-28 Week 1), it becomes the current season and the default view with no code change. The previous season stays available.
- **Corrections to a published article**: If NBA.com edits a week that was already collected, the job does not need to pick up the edit. The maintainer can re-fetch by hand. Already-collected weeks stay as they are.
- **Skipped weeks**: Weeks with no ranking (e.g. the All-Star break) are not shown as empty weeks. The chart shows the weeks that exist.
- **Rosters and coaches**: The current season's rosters and stats change during the season. Season pages must not fail to build because current-season roster data is missing or out of date (see FR-011).
- **Overlapping runs**: If a run starts while an earlier one is still going, they must not both propose conflicting updates.
- **Unmerged pull request**: If last week's pull request has not been merged (for example, because its checks failed) when the next run finds a new week, the open pull request is updated to include both weeks. A second pull request is not opened.
- **Paid steps**: The job must never run any step that spends API tokens (such as generating AI summaries).

## Requirements *(mandatory)*

### Functional Requirements

**Current season data and display**

- **FR-001**: The site MUST include the 2026-27 season, with every weekly NBA.com power ranking published so far.
- **FR-002**: Collecting current-season articles MUST capture each team's rank, record, and write-up for every published week, including the format NBA.com uses in 2026-27.
- **FR-003**: Every view that works for a completed season (chart, trends, team details, roster, team history, player history, link previews) MUST work for the in-progress season, apart from data that does not exist yet.
- **FR-004**: Wherever a completed season shows a champion, playoff results, an AI summary, or storylines, the in-progress season MUST show that it is in progress or that the item is not available yet. It MUST NOT show an error, an empty box with no explanation, or another season's data.
- **FR-005**: The season picker MUST list the current season first and mark it as in progress.

**Default view**

- **FR-006**: The site's root address MUST open the current season, defined as the most recent season with at least one published weekly ranking.
- **FR-007**: Addresses for specific seasons MUST keep opening those seasons. Addresses for unknown seasons MUST send the visitor to the current season.
- **FR-008**: When a new season's first ranking is collected, the default MUST move to that season with no code change.

**Weekly refresh job**

- **FR-009**: A scheduled job MUST run at least once a week, collect any new power ranking articles, rebuild the site's season data, and propose the result as described in FR-016.
- **FR-010**: The job MUST be startable by hand as well as on its schedule.
- **FR-011**: The job MUST refresh the current season's roster and coach data, and keep it complete enough for the season build to succeed.
- **FR-012**: The job MUST NOT re-fetch articles it has already collected, and MUST follow the source sites' crawl delays and identify itself, as the existing scrapers do.
- **FR-013**: When nothing new was collected, the job MUST NOT change any data or open a pull request.
- **FR-014**: When any step fails (source unreachable, incomplete parse, build or test failure), the job MUST NOT open or update a pull request and MUST make the failure visible to the maintainer.
- **FR-015**: The job MUST NOT run any step that spends AI API tokens, including generating summaries and gathering storylines.
- **FR-016**: The job MUST NOT push to the main branch directly. It MUST propose its updates as a pull request that merges itself once its checks (lint, tests, build) pass. Merging publishes the update through the existing deploy. The maintainer MAY review or merge it sooner, but does not have to. If the checks fail, the pull request MUST stay open and unmerged, and the failure MUST be visible to the maintainer.
- **FR-017**: Two runs of the job MUST NOT overlap in a way that proposes conflicting updates. If a pull request from an earlier run has not been merged yet, a later run MUST update that pull request rather than open a second one.

**Documentation**

- **FR-018**: The project's README MUST describe the weekly job: when it runs, what it updates, how to start it by hand, and what it leaves for the maintainer (AI summaries, storylines).

### Key Entities

- **Current season**: The most recent season with at least one published weekly ranking. It has weeks, team rankings, rosters, and coaches. It may have no champion, playoff results, AI summaries, or storylines yet.
- **Weekly ranking**: One NBA.com power rankings article for a numbered week of a season: 30 teams, each with a rank, a record, and a write-up.
- **Refresh run**: One run of the weekly job, either scheduled or started by hand. It ends in one of three states: nothing new, a pull request opened or updated with new data, or failed with nothing proposed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the site's root address shows the 2026-27 season in 100% of fresh visits, with no extra clicks.
- **SC-002**: Every 2026-27 week published on NBA.com before the feature ships appears on the site, with all 30 teams in each week.
- **SC-003**: Within 7 days of NBA.com publishing a new weekly ranking, it appears on the live site with no manual steps.
- **SC-004**: Over 4 consecutive weeks of the season, the maintainer spends no time collecting, rebuilding, or publishing rankings data by hand.
- **SC-005**: A refresh run with nothing new to collect changes no files and opens no pull request, every time.
- **SC-006**: A failed refresh run leaves the live site exactly as it was, and the maintainer can see the failure without looking for it.
- **SC-007**: No view of the in-progress season shows an error, and no view leaves an empty section without explaining why.

## Assumptions

- "Current season" means 2026-27 today (2026-11-13). It is defined by the data rather than by the date, so it rolls over to 2027-28 on its own.
- NBA.com (John Schuhmann's weekly column) is the only source for current-season rankings. ESPN rankings stay limited to past seasons.
- NBA.com usually publishes on Mondays. The job runs weekly on a day after that, such as Tuesday, and can also be started by hand. Running it more often is fine as long as runs with nothing new change nothing.
- Decided 2026-11-15: the job opens a pull request that merges itself once its checks pass. That requires auto-merge to be enabled in the repository settings, which the maintainer does once.
- The job runs in the project's existing continuous integration, not on the deployed site, in line with the constitution's static-hosting and offline-collection principles.
- AI summaries for the current season are still generated by the maintainer by hand, as now. Until then, the site shows the season without them.
- Updating storylines for the current season is out of scope and will be a separate task.
- Playoff brackets and series results for the current season are out of scope until the playoffs begin. The existing playoff scraper can be run then.
- Picking up edits to articles that were already collected is out of scope for the automatic job.
- The site's existing behavior of opening the latest season at the root address is kept. This feature makes sure the latest season is the current one and that it renders correctly while still in progress.
