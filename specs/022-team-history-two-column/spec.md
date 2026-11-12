# Feature Specification: Two-Column Team History Page

**Feature Branch**: `022-team-history-two-column`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "I want to rework the way the team history pages work and display. On desktop I want two scrollable columns. On the left is an overview of each season containing the weekly power ranking minimap as well as postseason badges and the season name. On right right I want the list of storylines for each season. On the right should also be badges for the top 6 players by minutes who played that year. The AI summaries should be removed. When the user clicks on a season in the left column, scroll to the appropriate season on the right. When the user scrolls on the right, highlight the appropriate season on the left and if necessary scroll the left container to bring the selected season into view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse a team's seasons in two linked columns (Priority: P1)

A fan opens a team's history page on a desktop-sized screen. The page shows two side-by-side columns that scroll independently. The left column is a compact index of every season the team has data for: each entry shows the season name, the weekly power ranking minimap, and the team's postseason badges. The right column shows the detail for each season, in the same order: the season's storylines for that team and badges for the six players who played the most minutes for the team that season. AI-generated summaries no longer appear.

**Why this priority**: This is the new layout itself; the linked scrolling behaviors build on it. On its own it already gives a denser overview and a cleaner detail area than the current single card list.

**Independent Test**: Open any team history page at desktop width and confirm both columns render, scroll independently, list seasons in the same order, and contain the specified content with no AI summary text or "AI-generated summary" badge.

**Acceptance Scenarios**:

1. **Given** a desktop-width viewport, **When** the user opens a team history page, **Then** the page shows a left season-overview column and a right season-detail column side by side, each scrollable on its own.
2. **Given** the team history page, **When** the user looks at a left-column entry, **Then** it shows the season name, the weekly ranking minimap for that team and season, and the team's postseason badges for that season.
3. **Given** the team history page, **When** the user looks at a season's section in the right column, **Then** it shows the season name as a heading, that team's storylines for the season, and up to six player badges ordered by total minutes played for the team that season, most first.
4. **Given** any season with an AI summary on record, **When** the team history page renders, **Then** neither the summary text nor an "AI-generated summary" label appears anywhere on the page.
5. **Given** a player badge in the right column, **When** the user clicks it, **Then** they are taken to that player's history page.

---

### User Story 2 - Jump to a season from the overview (Priority: P2)

The fan spots an interesting season in the left column (for example, a sharp mid-season ranking climb in the minimap) and clicks it. The right column scrolls so that season's section is at the top of the right column, and that season becomes the highlighted entry on the left.

**Why this priority**: Turns the left column into navigation, which is the main reason for splitting the page in two.

**Independent Test**: Click several left-column entries, including the first and last, and confirm the right column brings each matching section to the top (or as far as it can go for the final seasons) and the clicked entry is highlighted.

**Acceptance Scenarios**:

1. **Given** the right column is showing an early season, **When** the user clicks a later season in the left column, **Then** the right column scrolls so that season's section starts at the top of the right column.
2. **Given** the user clicks a season in the left column, **When** the right column finishes scrolling, **Then** the clicked season is the highlighted entry in the left column and no other entry is highlighted.
3. **Given** the user clicks the last season, whose section is too short to reach the top of the right column, **When** the right column scrolls to its end, **Then** the clicked season (not an earlier one) is the highlighted entry.
4. **Given** a keyboard user, **When** they tab to a left-column entry and press Enter or Space, **Then** it behaves the same as a click.

---

### User Story 3 - Overview follows reading position (Priority: P3)

While reading storylines in the right column, the fan scrolls through several seasons. The left column keeps the season currently being read highlighted and, when that season's entry would be off-screen in the left column, scrolls the left column just enough to bring it into view.

**Why this priority**: Keeps the user oriented during long reads, but the page is usable without it.

**Independent Test**: Scroll the right column slowly from top to bottom and confirm the highlight moves season by season, and that the left column scrolls only when the highlighted entry would otherwise be out of view.

**Acceptance Scenarios**:

1. **Given** the user is scrolling the right column, **When** a new season's section becomes the one at the top of the right column, **Then** that season becomes the highlighted entry in the left column.
2. **Given** the newly highlighted entry is fully visible in the left column, **When** the highlight changes, **Then** the left column does not scroll.
3. **Given** the newly highlighted entry is partly or fully outside the visible area of the left column, **When** the highlight changes, **Then** the left column scrolls the minimum distance needed to show the whole entry.
4. **Given** the page first loads, **When** no scrolling has happened, **Then** the first season is highlighted.

---

### User Story 4 - Read team history on a phone (Priority: P3)

A fan opens the same page on a narrow (phone-sized) screen. There is no two-column layout. The page shows only the season overviews (name, minimap, postseason badges), one per season, in a single list. Tapping a season expands it in place, showing that season's detail (storylines, top-player badges, season-chart link, data source) directly below its overview. Tapping it again collapses it. The page scrolls as one normal page.

**Why this priority**: The request targets desktop; on a phone the overview list gives a fast scan of every season, and expanding on demand keeps the long storyline lists out of the way.

**Independent Test**: Open a team history page at phone width, confirm only overviews are shown, tap a season to expand its detail below it, tap again to collapse, and confirm there is one page-level scroll and no AI summary.

**Acceptance Scenarios**:

1. **Given** a phone-width viewport, **When** the user opens a team history page, **Then** seasons appear in a single column showing only each season's overview, all collapsed.
2. **Given** a collapsed season, **When** the user taps its overview, **Then** that season's storylines, player badges, season-chart link, and data source appear directly below its overview, pushing later seasons down.
3. **Given** an expanded season, **When** the user taps its overview again, **Then** the detail is hidden.
4. **Given** one season is expanded, **When** the user taps a different season, **Then** that season expands too and the first stays as it was.
5. **Given** a phone-width viewport, **When** the user scrolls, **Then** the whole page scrolls as one, with no nested scroll areas.
6. **Given** a screen-reader or keyboard user, **When** they reach a season overview, **Then** it is announced as expandable with its current expanded/collapsed state and can be toggled with Enter or Space.

---

### Edge Cases

- A season has no storylines for the team: the right-column section still appears with its heading and player badges, plus a short "No storylines for this season" note, so left/right stay one-to-one.
- A season has no roster or minutes data: the player badge area is omitted for that season without error.
- Fewer than six players appear on the season roster: show however many there are.
- Two players tie in minutes at the sixth spot: show exactly six, breaking ties by name so the order is stable.
- A player was traded mid-season: rank by minutes played for this team only.
- A season has no postseason appearance: the left entry shows no postseason badges (as today) and keeps the same layout height as other entries where practical.
- The team has only one season of data: both columns still render; the single season is highlighted.
- The browser window is resized across the desktop/phone breakpoint: the layout switches without error; expanded/collapsed state on phone and the active season on desktop are not required to carry over.
- On phone, the user expands a season near the bottom of the screen: the page does not jump; the detail simply appears below and the user scrolls to read it.
- A user clicks a left-column entry while a previous click's scroll is still running: the latest click wins and the highlight ends on that season, without flickering through the seasons in between.
- The user has requested reduced motion in their system settings: scrolling jumps directly rather than animating.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On viewports at or above the app's existing desktop breakpoint, the team history page MUST present two side-by-side columns, each with its own independent vertical scroll, filling the available height below the page header.
- **FR-002**: The left column MUST list one entry per season for which the team has data, in the same order as the current page, each showing the season name, the team's weekly power ranking minimap for that season, and the team's postseason badges for that season.
- **FR-003**: The right column MUST contain one section per season, in the same order as the left column, each showing the season name, the team's storylines for that season, and the player badges defined in FR-004.
- **FR-004**: For each season, the system MUST show badges for up to six players who played for the team that season, chosen and ordered by total minutes played for that team that season, highest first, with ties broken alphabetically by player name.
- **FR-005**: Each player badge MUST show the player's name and MUST link to that player's history page.
- **FR-006**: The team history page MUST NOT display AI-generated season summaries or any "AI-generated summary" label.
- **FR-007**: Exactly one left-column entry MUST be visually highlighted at a time, indicating the season currently active in the right column; on first load it MUST be the first season.
- **FR-008**: Clicking or keyboard-activating a left-column entry MUST scroll the right column so the matching season section starts at the top of the right column (or as close as the remaining content allows) and MUST make that entry the highlighted one.
- **FR-009**: While the user scrolls the right column, the system MUST set the highlighted left entry to the season whose section currently occupies the top of the right column; when the right column is scrolled to its end, the last season MUST be highlighted.
- **FR-010**: When the highlighted entry changes and it is not fully visible in the left column, the system MUST scroll the left column the minimum amount needed to bring it fully into view; it MUST NOT scroll the left column when the entry is already fully visible.
- **FR-011**: Scrolling triggered by a left-column click MUST NOT cause the highlight to step through the intermediate seasons it passes.
- **FR-012**: Scroll movements MUST respect the user's reduced-motion preference.
- **FR-013**: Left-column entries MUST be reachable and activatable by keyboard and MUST expose which entry is currently active to assistive technology.
- **FR-014**: On viewports below the desktop breakpoint, the page MUST NOT use two columns. It MUST show a single page-scrolling list of season overviews (the FR-002 content only), all collapsed on load.
- **FR-014a**: On phone layout, tapping or keyboard-activating a season overview MUST toggle that season's detail (the FR-003 content plus the FR-015 and FR-016 controls) directly below it. Each season expands and collapses independently, and each overview MUST expose its expanded/collapsed state to assistive technology.
- **FR-014b**: The desktop highlight and linked-scroll behaviors (FR-007 through FR-011) do not apply on phone layout.
- **FR-015**: Users MUST still be able to open a season's full power ranking chart with that team pinned from the team history page, via an explicit control on each season (since clicking a left-column entry now scrolls instead of navigating).
- **FR-016**: The data source attribution currently shown per season MUST remain visible for each season.
- **FR-017**: Seasons missing storylines or roster data MUST still render their section, omitting only the missing parts, with a brief note when there are no storylines.

### Key Entities

- **Team season overview**: One per season for the team; season name, weekly rank trend for the minimap, postseason series results.
- **Team season detail**: One per season for the team; season name, the team's storylines, top players by minutes, data source.
- **Top player**: A player on the team's roster for a season; identity (for linking to player history), display name, total minutes played for the team that season.
- **Active season**: The single season currently highlighted in the overview and in focus in the detail column; shared between the two columns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a desktop screen, a user can get from the top of a team's history to any chosen season's storylines in one click.
- **SC-002**: After a left-column click, the matching season section is in place at the top of the right column within 1 second.
- **SC-003**: While scrolling the right column at a normal reading pace, the left-column highlight matches the season at the top of the right column at every point a tester checks (no lag beyond a fraction of a second, no wrong season).
- **SC-004**: The highlighted left-column entry is always fully visible in the left column after any highlight change.
- **SC-005**: Zero AI-generated summary text appears on any team history page.
- **SC-006**: For every season with roster data, the six player badges shown match the six highest minute totals for that team and season.
- **SC-007**: On a phone-width screen, the page has no horizontal scrolling and no nested scroll areas.
- **SC-008**: On a phone-width screen, a user can reach any season's storylines with one tap after scrolling to it, and the initial page shows only season overviews.

## Assumptions

- "Desktop" uses the same breakpoint the app already uses to switch between phone and desktop layouts (from feature 021); no new breakpoint is introduced.
- Season order stays as it is on the current page.
- Removing AI summaries applies to the team history page only; the single-team summary on the season chart page and the stored summary data are unchanged. Removing them elsewhere would be a separate change.
- Clicking a left-column entry scrolls rather than navigating to the season chart, so the season-chart link moves to a dedicated control on each season (FR-015).
- "Minutes" means total regular-season minutes played for this team, derived from the games played and minutes per game already prepared for the roster view; no new data collection is needed. Total (not per-game) minutes is used so short-stint players with high per-game minutes do not outrank season-long contributors.
- On phone, multiple seasons may be expanded at once (expanding one does not collapse others), and expanded state is not remembered across visits.
- Player badges are compact name chips in the same visual family as the app's existing badges; showing extra stats on them is out of scope.
- The page header (team logo and name) stays above both columns and does not scroll with either column.
- No change to the page URL is required when the active season changes; deep-linking to a specific season on the team history page is out of scope.
