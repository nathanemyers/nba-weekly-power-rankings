# Feature Specification: Season & Postseason Data as Plain JS/TS Modules

**Feature Branch**: `004-season-data-ts-modules`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "change the way that data is being stored for the data/seasons and postseason results from JSON to plain js/ts files. We do not need to worry about the size of the binary and we do no need the added complexity of async loading"

**Amendment (2026-10-12)**: After implementation, the storage-format decision in FR-001/FR-002 was
reversed per user feedback ("I don't like the way that we are outputting JS files in the scraper
scripts. Can we instead configure vite to allow direct loading of JSON"). The underlying goal —
static, synchronous loading with no loading state — stands and is unchanged (FR-003/FR-004/FR-005
below). Only the file *format* reverted: season and postseason data are plain `.json` again
(Vite and `tsc` support static JSON imports natively), not `.ts`/`.js` source modules. FR-001 and
FR-002 below are struck through to preserve the history of what was tried; see `research.md`
Decision 2 (amended) for the mechanical detail and the type-safety trade-off this reversal costs
against SC-004.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant season switching (Priority: P1)

A site visitor picks a season from the dropdown and sees that season's weekly rankings chart right away, with no intermediate "Loading…" message.

**Why this priority**: This is the only end-user-visible change the migration produces, and it is the direct motivation for dropping async loading — the data no longer needs to be fetched, so the UI shouldn't behave as if it does.

**Independent Test**: Load the site, switch between several seasons in the dropdown, and confirm the chart for each selected season renders immediately without any loading placeholder appearing.

**Acceptance Scenarios**:

1. **Given** the app is open and a season is selected, **When** the visitor picks a different season from the dropdown, **Then** that season's rankings chart appears with no loading indicator shown at any point.
2. **Given** the app has just loaded, **When** the initial (most recent) season's data renders, **Then** it renders on first paint without a separate loading state.

---

### User Story 2 - Regenerating data after new scrapes (Priority: P2)

A maintainer runs the existing build script after scraping new weekly articles or postseason results, and it produces the per-season and postseason data in the new module format instead of JSON.

**Why this priority**: The weekly/seasonal data refresh workflow must keep working unchanged from the maintainer's point of view — only the on-disk format of its output changes.

**Independent Test**: Run the data build step against the existing scraped article data and confirm it produces one data module per season (plus the postseason results module) with the same information that the current JSON files contain, with no manual fix-up required.

**Acceptance Scenarios**:

1. **Given** scraped weekly article data for a season, **When** the maintainer runs the build step, **Then** a plain JS/TS module is produced for that season containing the same rankings data previously stored as JSON.
2. **Given** updated postseason bracket results, **When** the build step runs, **Then** the postseason results are available as a plain JS/TS module and are correctly reflected in the affected seasons' data.

---

### User Story 3 - Reading and reviewing data in the editor (Priority: P3)

A developer opens a season's data file to inspect or debug it and benefits from editor type-checking and navigation instead of reading an opaque JSON blob.

**Why this priority**: This is a secondary developer-experience improvement that falls out of the format change but isn't the primary motivation.

**Independent Test**: Open a migrated season data file in the editor and confirm it is recognized as typed source code (type errors surface for malformed data) rather than inert JSON text.

**Acceptance Scenarios**:

1. **Given** a season's data module, **When** a required field is missing or malformed, **Then** the project's type checking flags the problem at build/compile time.

---

### Edge Cases

- What happens for seasons/teams with no postseason appearance (e.g., non-playoff teams, or a season with no postseason data at all)? The absence of postseason data must continue to be represented and handled the same way it is today (no playoff stage shown for that team).
- What happens to the current "Loading {season}…" status message? Under normal operation it should no longer be reachable, since data is available synchronously once the app is built.
- What happens if a season data module fails to produce valid data (e.g., a bug in the build step)? The project's existing type checking and build process must catch this before it ships, rather than failing silently or at runtime in the browser.

## Requirements *(mandatory)*

### Functional Requirements

- ~~**FR-001**: Per-season weekly ranking data (currently one JSON file per season) MUST be stored as plain JavaScript or TypeScript source modules, one per season, in place of JSON files.~~ **Superseded by amendment above**: per-season data stays as JSON (`src/data/seasons/<season>.json`); only the loading mechanism (FR-003) changed.
- ~~**FR-002**: Postseason/playoff bracket results (currently a JSON file consumed when building each season's data) MUST likewise be stored as a plain JavaScript or TypeScript source module.~~ **Superseded by amendment above**: postseason data stays as `data/playoffs.json`.
- **FR-003**: The application MUST obtain all season and postseason data via static imports resolved at build time, not via dynamic imports, runtime `fetch`, or any other asynchronous loading mechanism. (JSON imports satisfy this the same way JS/TS module imports would — both resolve statically at build time.)
- **FR-004**: The UI MUST NOT display a loading/placeholder state for season data, since the data is available synchronously once the app has loaded.
- **FR-005**: The existing data-generation workflow (the script that turns scraped article data and postseason brackets into per-season data) MUST be updated to emit the new module format; the maintainer-facing workflow (run the build step after scraping) MUST otherwise remain unchanged.
- **FR-006**: All data currently represented in the JSON files (every season's weekly rankings, records, summaries, and postseason stage per team) MUST be preserved exactly in the migrated modules — the migration MUST NOT lose or alter any existing information.
- **FR-007**: Code that currently reads this data (e.g., the season picker and rankings chart) MUST continue to produce identical rankings output after the migration, for every existing season.

### Key Entities

- **Season Ranking Record**: One per season. Holds that season's maximum week number and, per team, the sequence of weekly entries (week number, rank, optional win-loss record, summary blurb). Stored as `src/data/seasons/<season>.json` (format unchanged by the amendment above — only how the app imports it changed).
- **Postseason Result**: The bracket of playoff rounds and series for a season, used to determine the furthest stage each team reached (first round, semis, conference finals, finals, champion). Stored as `data/playoffs.json` (format unchanged); its resolved per-team stage continues to be attached to the corresponding Season Ranking Record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Switching the selected season in the UI shows that season's full rankings with zero visible loading states, 100% of the time.
- **SC-002**: Every season currently published (all existing years) renders identical rankings and postseason markers after the migration as it did before, with no discrepancies.
- **SC-003**: Regenerating a season's data from its scraped source articles after the migration requires the same number of maintainer steps as before (no added manual steps).
- **SC-004**: A malformed or incomplete season entry is caught before the site is published, rather than surfacing as a runtime error or silently missing data for site visitors. **Partially regressed by the amendment above**: missing/structurally-wrong fields (e.g. a season entry missing `maxWeek`) are still caught by `tsc -b`, but an invalid `PlayoffStage` string value is not — TypeScript widens JSON string fields to `string`, so the per-season `as SeasonData` cast in the generated barrel can no longer narrow that one field. See `research.md` Decision 2 (amended).

## Assumptions

- "data/seasons" and "postseason results" in the request refer to the existing `src/data/seasons/*.json` per-season files and the `data/playoffs.json` postseason bracket file respectively — the two JSON stores that feed the rankings chart. The raw scraped article JSON under `data/articles/` is an upstream input to the build step and is out of scope for this migration.
- Since bundle size is explicitly not a concern, all seasons' data may be included directly in the main application bundle rather than split per season; no lazy-loading or code-splitting behavior needs to be preserved.
- The existing data-generation build step continues to be a developer-run script (not something end users trigger) and continues to read the same upstream scraped data; only its output format changes.
- Visual/behavioral parity is required: this is a storage- and loading-mechanism change only, not a redesign of the rankings chart or season picker.
