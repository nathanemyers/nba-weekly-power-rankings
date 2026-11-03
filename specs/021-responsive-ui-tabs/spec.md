# Feature Specification: Responsive UI and Tabbed Detail Panel

**Feature Branch**: `UI-updates`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "This is a task to clean up the UI. all pages should be responsive and look good on phones, tablets and desktop. The AI summary, season trends, and roster information should be moved to a shared tabbed space below the chart. The roster chart should have a mobile view that only shows team logo and omits team name, and focuses on showing points, rebounds, and assists."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the season on a phone (Priority: P1)

A fan opens the site on a phone. The page fits the screen width with no sideways scrolling of the page itself. The title, season selector, team filter, rankings chart, week controls, and detail panel are all readable and usable by touch.

**Why this priority**: The site is built for a 960px-wide desktop layout today. On a phone the chart and controls overflow, so the main experience is broken for a large share of visitors.

**Independent Test**: Open any season page at a 375px-wide viewport. Confirm the page does not scroll horizontally, the chart is fully visible, and a team can be pinned, unpinned, and filtered by touch.

**Acceptance Scenarios**:

1. **Given** a 375px-wide viewport, **When** a season page loads, **Then** the whole chart is visible within the screen width and the page has no horizontal scroll.
2. **Given** a phone viewport, **When** the user taps a team's line or label, **Then** that team is pinned just as it is on desktop.
3. **Given** a phone viewport, **When** the user uses the week controls, **Then** the chart pans or zooms to the chosen weeks.
4. **Given** a phone viewport, **When** the header renders, **Then** the title, hint text, and GitHub link stay on screen without overlapping.

---

### User Story 2 - Tabbed detail panel below the chart (Priority: P1)

Below the chart, one tabbed panel holds the AI summary, season trends, and roster. The user switches between them with tabs. This replaces today's hover-card buttons and the roster section that sits on its own below the chart.

**Why this priority**: Hover cards don't work on touch screens, and stacking separate sections makes the page long. A tabbed panel works on every device and keeps related details in one place.

**Independent Test**: On desktop and on a phone, pin a team in a completed season. Confirm the panel below the chart shows Summary, Trends, and Roster tabs, and that each tab shows its content inline, with no hover needed.

**Acceptance Scenarios**:

1. **Given** a completed season with one team pinned, **When** the user selects the "Summary" tab, **Then** the AI summary for that team appears inline with its "AI-generated" label.
2. **Given** any season, **When** the user selects the "Trends" tab, **Then** the biggest risers and fallers appear inline, and tapping one pins that team.
3. **Given** one team pinned that has roster data, **When** the user selects the "Roster" tab, **Then** the roster table, coach line, and rating key appear.
4. **Given** no team or more than one team pinned, **When** the panel renders, **Then** tabs that need a single pinned team (Summary, Roster) are disabled or hidden, and the panel shows content that needs no pin (Trends or season awards).
5. **Given** the user has a tab selected, **When** they pin a different team, **Then** the same tab stays selected if it still has content for the new team.
6. **Given** a tab has no data (for example, no AI summary for an in-progress season), **When** the panel renders, **Then** that tab is disabled or hidden, never empty.

---

### User Story 3 - Compact roster on mobile (Priority: P2)

On a phone, the roster shows the team's logo instead of its full name. The table is cut down to the player and their points, rebounds, and assists, so it fits the screen without sideways scrolling.

**Why this priority**: The full roster table has ten stat columns and cannot fit a phone. Showing the three core box-score stats gives a useful view.

**Independent Test**: At 375px wide, pin a team and open the Roster tab. Confirm the heading shows the team logo without the team name, and the table shows only player (as first initial and last name), PTS, REB, and AST, with no horizontal scroll.

**Acceptance Scenarios**:

1. **Given** a phone viewport and the Roster tab open, **When** the roster renders, **Then** the team is identified by its logo, not its written name.
2. **Given** a phone viewport, **When** the roster table renders, **Then** it shows the player column plus PTS, REB, and AST, with the same rating colors used on desktop.
3. **Given** a phone viewport, **When** a player row renders, **Then** the player's name is shortened to first initial and last name (for example, "L. James").
4. **Given** a tablet or desktop viewport, **When** the roster renders, **Then** the full set of stat columns, full player names, and the team name are shown as they are today.
5. **Given** a phone viewport, **When** the user taps a player's shortened name, **Then** they go to that player's history page.
6. **Given** a player who joined or left mid-season, **When** the compact roster renders, **Then** the move marker is still shown.

---

### User Story 4 - Responsive team and player history pages (Priority: P2)

The team history and player history pages also fit phones and tablets. Tables, charts, search, and badges stay usable with no page-level horizontal scroll.

**Why this priority**: The request covers "all pages". These pages get less traffic than the season chart.

**Independent Test**: Open a team history page and a player history page at 375px, 768px, and 1280px widths. Confirm nothing overflows the page and every control works.

**Acceptance Scenarios**:

1. **Given** a phone viewport, **When** a player history page loads, **Then** the player search, award badges, career highlights, and stats table fit the screen. A wide table may scroll inside its own container, but the page does not.
2. **Given** a phone viewport, **When** a team history page loads, **Then** its content fits the screen width and stays readable.

---

### Edge Cases

- If the user rotates a phone from portrait to landscape, the layout adapts to the new width without a reload.
- If a pinned team has no roster data, the Roster tab is not selectable.
- On a season in progress (no AI summaries, Trends maybe limited), only tabs with data are offered. If no tab has data, the panel is hidden.
- When one team is pinned, the Summary tab is selected by default, and a tab the visitor chose (e.g. Roster) stays selected when another team is pinned. When no team is pinned, the Summary tab is selected by default if the season has storylines, otherwise Awards.
- Player names with suffixes or multi-part surnames (for example, "Gary Trent Jr.", "Shai Gilgeous-Alexander", "Karl-Anthony Towns") are shortened to the first initial plus everything after the first name ("G. Trent Jr.", "S. Gilgeous-Alexander", "K. Towns"). Single-word names are shown unchanged.
- Very long player names in the compact roster wrap or truncate and don't push stat columns off screen.
- Chart labels for 30 teams at phone width must stay legible or be simplified (for example, logos only) rather than overlapping.
- Keyboard navigation (arrow keys to pan) still works on desktop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page (season chart, team history, player history, not-found/empty states) MUST render without page-level horizontal scrolling at viewport widths from 360px up to 1920px.
- **FR-002**: The layout MUST adapt at three tiers: phone (under 640px), tablet (640–1023px), and desktop (1024px and up).
- **FR-003**: The rankings chart MUST scale to fit the available width while keeping lines, dots, and team labels legible and touch-targetable.
- **FR-004**: All controls (season select, team filter, clear filter, week controls, team history link) MUST be usable by touch, and MUST wrap or stack on narrow screens instead of overflowing.
- **FR-005**: A single tabbed panel MUST sit directly below the chart and its week controls, holding the AI Summary, Season Trends, and Roster content.
- **FR-006**: Tab content MUST show inline in the panel. It MUST NOT need hover to show, and the old hover-card buttons for AI Summary and Season Trends MUST be removed.
- **FR-007**: Tabs whose content needs a single pinned team, or whose data is missing, MUST be disabled or hidden. A selected tab that becomes unavailable MUST fall back to an available tab.
- **FR-008**: Selecting a team from the Trends tab MUST pin that team, just as the current Season Trends popover does.
- **FR-009**: Season awards MUST move into the tabbed panel as an "Awards" tab, replacing the separate awards section. It MUST be the default tab when no team is pinned.
- **FR-010**: On phone widths, the roster MUST identify the team by its logo only, with the written team name omitted.
- **FR-011**: On phone widths, the roster table MUST show the player name, shortened to first initial and last name, plus points, rebounds, and assists per game, keeping the existing rating colors, player links, and mid-season move markers.
- **FR-012**: On tablet and desktop widths, the roster MUST show all existing stat columns and full player names.
- **FR-016**: The full player name MUST remain available on phones to assistive technology (and as a tooltip or link label), even when the shortened form is shown.
- **FR-013**: The "Team History" action MUST stay reachable when a single team is pinned.
- **FR-014**: Existing interactions (pinning, filtering, week panning and zooming, arrow-key navigation on desktop, deep links to seasons/teams/players) MUST keep working at every viewport size.
- **FR-015**: The panel MUST be keyboard accessible: tabs can be reached and switched with the keyboard, and each tab is announced to assistive technology.

### Key Entities

- **Detail Panel Tab**: One section of the panel below the chart (Summary, Trends, Roster, Awards). Each tab has a label, a rule for when it is available (needs a single pinned team, needs data present), and its content.
- **Roster View Mode**: Full (all stat columns, full player names, team name) or compact (logo, shortened player name, PTS, REB, AST). Chosen by viewport width.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 375px, 768px, and 1280px widths, 100% of pages show no page-level horizontal scroll.
- **SC-002**: On a phone, a user can pin a team and read its AI summary, season trends, and roster in 3 taps or fewer after the page loads.
- **SC-003**: The compact roster shows every player's PTS, REB, and AST at 375px with no horizontal scrolling inside the table.
- **SC-004**: None of the detail content (summary, trends, roster, awards) needs hover to view, on any device.
- **SC-005**: Every existing interaction listed in FR-014 behaves the same as before at desktop width, as checked by the existing test suite and a manual pass.

## Assumptions

- "Only shows team logo and omits team name" refers to the roster's team heading (and the existing mid-season move markers). Player names stay in the compact roster, shortened to first initial and last name.
- The Trends tab is available in any season, pinned team or not, since risers and fallers are season-wide.
- The selected tab is interaction state and is not put in the URL.
- Breakpoints follow the common phone/tablet/desktop tiers in FR-002. Exact pixel values may shift slightly to match the existing styling conventions.
- The full roster stats table on player history pages may scroll inside its own container on phones. Only the season-page roster needs the compact PTS/REB/AST view.
- No new data is needed. All content already exists in the processed season data.
