# Feature Specification: URL Routing and On-Demand Season Data

**Feature Branch**: `use-react-router`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "I want to change the routing infrastructure to use react-router. I have already added some of the code. the selected season and view information in redux will now live in react-router. I would also like to explore using react-router's data loading to handle loading data so that we can chunk data"

## Current State *(context)*

Work already on the `use-react-router` branch (commit `e2ac598 add react router`):

- The routing library is added as a runtime dependency.
- The app shell now renders a route tree: a layout route (`Root`) wrapping a season chart route (`/:season`) and a team history route (`/teamHistory/:team`).
- The "current view" value and its setter were removed from the UI state. The selected season is still held in app state, and two components (`TeamHistoryButton`, `TeamHistory`) still call the removed view setter, so the branch does not build yet.
- The team history page still reads its team from the single pinned chart team rather than from the address.
- The route tree uses path-based addresses (e.g. `/nba-weekly-power-rankings/2024-25`), which the host cannot serve on a fresh page load (see Constitution Notes).
- All 22 seasons of ranking data (≈6.3 MB raw) are bundled into the initial download, about 2.17 MB compressed.

## Clarifications

### Session 2026-10-26

- Q: Address format? → A: Hash-style addresses (e.g. `#/2024-25`, `#/teamHistory/BOS`); constitution unchanged.
- Q: How does team history get all seasons once data is split? → A: Download every season file when the page opens; no per-team build file.
- Q: Where does route-loaded season data live? → A: The router holds it; views read it from route data. Requires amending the constitution's State & Data Layer rule.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shareable, bookmarkable season view (Priority: P1)

A visitor viewing the 2018-19 season chart copies the address and sends it to a friend. The friend opens the link in a new browser and lands directly on the 2018-19 chart. Changing the season in the season picker updates the address, and the browser Back button returns to the previously viewed season.

**Why this priority**: The address becoming the source of truth for which season is shown is the core of the requested change and the base the other stories build on.

**Independent Test**: Open the deployed site at a season-specific address in a fresh tab and confirm the right season renders; switch seasons and confirm the address and Back/Forward behavior.

**Acceptance Scenarios**:

1. **Given** a fresh browser tab, **When** the visitor opens the address for the 2018-19 season, **Then** the 2018-19 chart is shown with no error page from the host.
2. **Given** the 2024-25 chart is shown, **When** the visitor picks 2019-20 in the season picker, **Then** the chart shows 2019-20 and the address names 2019-20.
3. **Given** the visitor moved from 2024-25 to 2019-20, **When** they press Back, **Then** the 2024-25 chart is shown again.
4. **Given** the visitor opens the site's base address with no season, **When** the page loads, **Then** the most recent season's chart is shown and the address names that season.
5. **Given** the visitor opens an address naming a season that does not exist (e.g. `1999-00`), **When** the page loads, **Then** they are taken to the most recent season and nothing crashes.

---

### User Story 2 - Shareable team history page (Priority: P1)

A visitor pins a single team on the chart and opens its team history. The address names the team, so the page can be bookmarked, shared, and reloaded. Clicking a season card on the history page goes to that season's chart.

**Why this priority**: Team history is the second existing view; it must keep working after the view switch moves out of app state, and today it cannot be reloaded or shared at all.

**Independent Test**: Open the team-history address for one team in a fresh tab and confirm the page shows that team; click a season card and confirm the chart for that season opens.

**Acceptance Scenarios**:

1. **Given** the 2023-24 chart with only the Celtics pinned, **When** the visitor clicks the team history button, **Then** the Celtics history page is shown and the address names the Celtics.
2. **Given** a fresh browser tab, **When** the visitor opens the Celtics team-history address, **Then** the Celtics history page is shown with every season the team appears in.
3. **Given** the Celtics history page, **When** the visitor clicks the 2007-08 card, **Then** the 2007-08 chart is shown and the address names 2007-08.
4. **Given** the history page was reached from the chart, **When** the visitor presses Back, **Then** the chart they came from is shown again.
5. **Given** an address naming an unknown team code, **When** the page loads, **Then** the visitor sees a short "team not found" message with a way back to the chart, and nothing crashes.

---

### User Story 3 - Faster first load by loading season data on demand (Priority: P2)

A first-time visitor on a slow connection opens the site. Instead of downloading every season's data before anything appears, they download the app plus only the season they are viewing. Other seasons download when the visitor goes to them, and a loading state is shown while that happens.

**Why this priority**: The bundle has grown to about 2.17 MB compressed and grows each season; this is the user's stated reason for adopting route-based data loading. It depends on Stories 1–2 being in place.

**Independent Test**: Load a season address with network inspection on; confirm only that season's data file is requested, then switch seasons and confirm the next season's file is fetched on demand.

**Acceptance Scenarios**:

1. **Given** an empty browser cache, **When** the visitor opens the 2024-25 chart, **Then** the data for other seasons is not downloaded.
2. **Given** the 2024-25 chart has loaded, **When** the visitor switches to 2010-11, **Then** a loading state is shown until the 2010-11 data arrives, then the chart renders.
3. **Given** the visitor has already viewed 2010-11 in this visit, **When** they return to it, **Then** it renders without downloading it again.
4. **Given** a season's data file is malformed or fails to download, **When** the visitor goes to that season, **Then** they see an error message for that season with a way to choose another season, and the rest of the app keeps working.
5. **Given** the team history page, **When** it loads, **Then** every season's data is downloaded (skipping any already downloaded this visit) and the team's full history is shown.

---

### Edge Cases

- A season address with different letter case or a trailing slash (e.g. `/2024-25/`) resolves to the same season.
- Old links to the bare base address (the only kind that existed before) keep working and land on the most recent season.
- The team history address is opened for a team that existed only in some seasons (e.g. a relocated franchise code): only those seasons are listed.
- The visitor switches seasons quickly several times while data is still loading: the chart ends on the last season picked, never an earlier one.
- The visitor goes offline after the first load and switches to a season not yet downloaded: an error state is shown, not a blank page.
- Chart state that is not part of the address (pinned teams, zoom window) when the season changes keeps its current behavior.
- A pinned team that does not exist in the newly selected season.

## Requirements *(mandatory)*

### Functional Requirements

**Navigation and address**

- **FR-001**: The address MUST identify the current view (season chart or team history) and its subject (the season, or the team). App state MUST NOT hold a separate copy of the selected season or the current view.
- **FR-002**: Opening any season or team-history address in a fresh tab on the deployed site, served under its sub-path, MUST render that view. Addresses MUST be hash-style (e.g. `…/nba-weekly-power-rankings/#/2024-25` and `…/#/teamHistory/BOS`) so no server rewrite is needed.
- **FR-003**: Selecting a season in the season picker MUST navigate to that season's address, adding a browser history entry.
- **FR-004**: The team history button MUST navigate to the history address of the single pinned team.
- **FR-005**: Clicking a season card on the team history page MUST navigate to that season's chart address.
- **FR-006**: The team history page MUST read its team from the address, not from chart state.
- **FR-007**: The base address with no season MUST show the most recent season and update the address to name it, without adding an extra Back step.
- **FR-008**: Unknown season identifiers in the address MUST redirect to the most recent season; unknown team codes MUST show a "team not found" message with a link to the chart. Address values MUST be validated before use.
- **FR-009**: Browser Back and Forward MUST move between previously visited views and seasons.

**Data loading**

- **FR-010**: The initial page load MUST download the data for only the season being viewed (plus the lightweight list of available seasons), not every season.
- **FR-011**: Each season's data MUST be fetched as a same-origin static file from the deployed site and validated against the existing season schema before use; invalid or failed loads MUST show an error state scoped to that season rather than crash the app.
- **FR-012**: The team history page MUST show, for the chosen team, every season it appears in with the same content as today (season name, trend minimap, playoff badges, summary, data-source badge). It MUST download every season's data file when the page opens, reusing any already downloaded during the visit; no new build-time file is added.
- **FR-013**: A season already downloaded during the visit MUST NOT be downloaded again during that visit.
- **FR-014**: A loading state MUST be shown while a view's data is being fetched.
- **FR-015**: Downloaded season data MUST be held by the router's per-route data loading and read by views from there, not copied into the shared app store. This is allowed by constitution v1.5.0 (see Constitution Notes). The shared app store keeps only chart interaction state (FR-017).

**Unchanged behavior**

- **FR-016**: Everything the chart and team history pages show today (rankings chart, zoom, pinned teams, tooltips, roster pane, rank swings, AI summaries, playoff badges) MUST look and behave as before once its data is loaded.
- **FR-017**: Chart interaction state not named in FR-001 (pinned teams, zoom window) stays in app state and is out of scope for the address in this feature.

### Key Entities

- **Route / Address**: The part of the URL that names a view and its subject. Two views: season chart (keyed by season name like `2024-25`) and team history (keyed by team code like `BOS`).
- **Season Index**: The small list of available seasons (names, order, newest first) needed before any season data loads, to drive the season picker and the default-season redirect.
- **Season Data File**: One season's rankings, playoff, roster, and summary data, delivered as its own static file and validated on arrival.
- **Team History Data**: Per-season facts about one team across all seasons, assembled from all season data files (see FR-012).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of season and team-history addresses open correctly in a fresh tab on the deployed site under its sub-path (verified by spot-checking at least 5 seasons and 3 teams on a static preview under the base path).
- **SC-002**: The compressed download needed before the first chart appears is at least 50% smaller than today's ≈2.17 MB.
- **SC-003**: Switching to a not-yet-viewed season shows its chart within 1 second on a typical broadband connection.
- **SC-004**: Returning to an already-viewed season shows its chart with no new data download.
- **SC-005**: A malformed or missing season file affects only that season: every other season and the team history page still work.
- **SC-006**: All existing chart and team history behaviors pass their current tests or equivalent tests after the change.

## Constitution Notes

- **Principle III (Base-Path-Safe, Server-Free Navigation)**: Path-style addresses, as on the current branch, break deep links on GitHub Pages. Resolved: hash-style addresses (FR-002), so no amendment is needed.
- **State & Data Layer constraint**: "loaded ranking/playoff/team data MUST live in the Redux store". FR-015 holds loaded data in the router. Resolved by constitution v1.5.0 (2026-10-26), which lets route loaders hold same-origin, Zod-validated data, with Redux keeping shared interaction state. The selected season and current view moving into the URL is consistent with the constitution ("anything that must persist or be shareable … URL").
- **Principle V (Simplicity)**: The routing library is a new runtime dependency; the plan must record its justification (shareable views, back/forward, per-route data loading).
- **Principle II / Data Validation**: On-demand season files are same-origin static assets and must be Zod-validated on arrival — allowed as written.

## Assumptions

- Team history addresses use the existing three-letter team codes (e.g. `BOS`), matched case-insensitively.
- The most recent season is the first entry in the existing season order.
- Pinned teams and the chart zoom window stay in app state; putting them in the address is a possible later feature.
- Choosing a season in the picker clears pinned teams, as it does today; Back/Forward leaves them alone, and clicking a team-history season card pins that team.
- Splitting AI summaries or roster data out of the season files further is out of scope; the unit of on-demand loading is one season.
- Building and deploying the site stays a single static build with no server changes.
- The existing team history button stays disabled unless exactly one team is pinned.
