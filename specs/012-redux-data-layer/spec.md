# Feature Specification: Centralized Data Layer

**Feature Branch**: `012-redux-data-layer`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "The app has reached a point where it is prudent to add a small data layer. This will be using redux with redux toolkit slices, and zod for validation. Most of the state data from App.tsx will be ported into redux. This layer will handle future navigation and UI state as well."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitors see no change in behavior (Priority: P1)

A visitor opens the power rankings page and uses it exactly as today: picks a season, zooms
in and out, pages earlier and later with the buttons or arrow keys, and clicks a team to pin it
(which highlights it and shows its season summary). After the app's shared state moves into a
single central store, every one of these interactions behaves identically.

**Why this priority**: This is a structural change. Its value is lost if visitors notice any
regression, so behavioral parity is the gate for everything else.

**Independent Test**: Run through every existing interaction on the page before and after the
change and compare results; the existing automated test suite passes without changes to its
expectations.

**Acceptance Scenarios**:

1. **Given** the page has just loaded, **When** the visitor looks at the chart, **Then** the
   most recent season is selected, the full season is shown, and no team is pinned.
2. **Given** a season is selected, **When** the visitor picks a different season, **Then** the
   chart shows the new season and any pinned team is cleared.
3. **Given** the chart is zoomed in, **When** the visitor presses the right arrow key or clicks
   "Later", **Then** the visible window moves one week later, stopping at the season's last week.
4. **Given** the visitor has zoomed in to a late window in a long season, **When** they switch to
   a shorter season, **Then** the window stays inside the shorter season's weeks.
5. **Given** no team is pinned, **When** the visitor clicks a team, **Then** that team is pinned
   and its season summary (if any) appears; **When** they click it again, **Then** it is unpinned.

---

### User Story 2 - Bad season data fails safely (Priority: P2)

A season data file that is missing fields, has wrong types, or contains unknown team or playoff
values is detected when the app loads it, instead of producing a broken chart or a blank page.

**Why this priority**: Season data is produced by scripts and edited over time; catching shape
problems at the boundary protects visitors and makes data bugs obvious to the maintainer.

**Independent Test**: Feed a deliberately malformed season file to the loading step in a test
and confirm it is rejected with a clear message identifying the season and the problem, while
valid seasons still load.

**Acceptance Scenarios**:

1. **Given** all bundled season files are valid, **When** the app loads, **Then** every season is
   available in the season picker.
2. **Given** one season file is malformed, **When** the app loads, **Then** that season is
   excluded from the picker, a developer-facing error names the season and the invalid field,
   and all other seasons work normally.
3. **Given** a season file contains rankings for an unrecognized team, **When** it is loaded,
   **Then** that season is rejected and reported like any other malformed season.

---

### User Story 3 - Maintainer can add new navigation and UI state in one place (Priority: P3)

The maintainer plans to add navigation (e.g., per-team pages) and more UI state. Shared state
lives in one central store, organized by area, so new state can be added and read from any part
of the page without threading values through many components.

**Why this priority**: This is the motivating reason for the change, but it delivers value only
once later features build on it.

**Independent Test**: Read a piece of shared state (e.g., the selected season) from a deeply
nested component without receiving it from its parent, and unit-test a state change (e.g.,
paging the window) without rendering the page.

**Acceptance Scenarios**:

1. **Given** the central store exists, **When** a component needs the selected season or pinned
   team, **Then** it can read it directly rather than receive it from the page.
2. **Given** the store's state-change rules, **When** they are tested in isolation, **Then**
   season selection, zoom, paging, and pinning each behave as described in User Story 1.
3. **Given** a placeholder area for navigation/UI state, **When** a future feature adds state to
   it, **Then** no existing area needs restructuring.

### Edge Cases

- Paging past either end of the season is a no-op; the "Earlier"/"Later" controls are disabled at
  the edges, and arrow keys do nothing when zoomed out.
- A season shorter than the default zoom window shows no zoom toggle.
- If every season file fails validation, the page shows a friendly "no data available" message
  instead of crashing.
- Pinning a team that has no data in the selected season is not possible; switching seasons
  clears pins.
- Transient, single-component state (chart hover, animation progress) stays local and is not
  moved into the central store.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST keep its shared page state in a single central store: selected season,
  zoomed-in/out mode, the zoomed-in week window, and pinned teams.
- **FR-002**: The store MUST be organized into separate areas by concern (at minimum: season data,
  chart view, team selection), each owning its state and the rules for changing it.
- **FR-003**: All state-change rules currently in the page (season change clears pins, paging is
  clamped to the season, the window is kept inside a shorter season, pin toggling) MUST be
  expressed in the store and produce identical visible results.
- **FR-004**: Values derived from state (visible start/end week, whether paging or zooming is
  possible, the pinned team's details, whether the season is complete) MUST be computed from the
  store rather than duplicated in components.
- **FR-005**: Every bundled season data file MUST be validated against a defined schema before it
  enters the store; invalid seasons MUST be excluded and reported with the season name and the
  failing field.
- **FR-006**: Unknown team identifiers and playoff stages in season data MUST be rejected by
  validation.
- **FR-007**: Data types used by the app for season data SHOULD be derived from the validation
  schemas so the two cannot drift apart.
- **FR-008**: Components MUST be able to read shared state and request changes directly from the
  store without receiving them through intermediate components.
- **FR-009**: Transient visual state local to one component (hover, animation tweening) MUST
  remain in that component.
- **FR-010**: The store MUST include an area reserved for navigation and general UI state so future
  features can add to it without restructuring existing areas; it MAY start empty or minimal.
- **FR-011**: Store state MUST be held in memory only; this feature MUST NOT add persistence to
  browser storage or the URL.
- **FR-012**: The store's state-change rules and derived values MUST be covered by automated tests
  that run without rendering the page.

### Key Entities

- **Season Data**: One season's rankings by team and week, the season's last week, optional
  playoff outcome per team, and optional per-team summary. Validated on load.
- **Chart View**: Whether the chart shows the full season or a zoomed-in window, and the start and
  end weeks of that window.
- **Team Selection**: The set of pinned teams (currently at most one) for the selected season.
- **Navigation/UI State**: Reserved area for future page navigation and UI preferences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the interactions listed in User Story 1 behave identically before and after
  the change, verified by the existing test suite plus a manual walkthrough.
- **SC-002**: All 9 currently bundled seasons pass validation and remain selectable.
- **SC-003**: A malformed season file is caught at load in 100% of tested cases (missing field,
  wrong type, unknown team, unknown playoff stage), with no crash of the page.
- **SC-004**: The main page component holds no shared state of its own after the change; each
  state-change rule exists in exactly one place.
- **SC-005**: Page load and interaction responsiveness are not perceptibly slower than before
  (season switch and paging feel instant).
- **SC-006**: The deployed site still builds and runs as static files with no new runtime network
  requests.

## Assumptions

- Technology is fixed by the project constitution (v1.3.0): Redux Toolkit slices for the store and
  Zod for schema validation.
- "Most of the state from App.tsx" means all four pieces of shared state listed in FR-001; layout
  constants (chart size and margins) stay as constants.
- Season data remains bundled with the build; validation runs on the bundled data at app start, not
  on network responses.
- Syncing state to the URL or browser storage, and building actual navigation (e.g., team pages),
  are out of scope and will be separate features that build on this store.
- Pinning remains single-team, matching current behavior, though the state shape continues to allow
  a list.
- Arrow-key paging keeps its current behavior; how the keyboard listener is wired is a planning
  decision.
