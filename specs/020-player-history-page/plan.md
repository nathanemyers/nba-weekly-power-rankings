# Implementation Plan: Player History Page

**Branch**: `020-player-history-page` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-player-history-page/spec.md`

## Summary

Add a `playerHistory/:player` route that lists one player's season-by-team stints, built in the browser from the roster data already shipped in every season file. The table reuses the roster pane's stat columns, colors and key through a shared module, and adds sticky Season and Team columns. Player names in the roster pane link to the page. Clicking a history row pins that team and navigates to its season's chart, the way the team history page does.

## Technical Context

**Language/Version**: TypeScript 6, React 19, React Router 8

**Primary Dependencies**: React Router (hash router, loaders), Redux Toolkit (pinned teams), Zod, Tailwind CSS, shadcn/ui `table`/`card`/`tooltip`/`badge`

**Storage**: N/A. Static season modules under `data/processed/seasons`, loaded with `loadSeason`/`loadAllSeasons`

**Testing**: Vitest + Testing Library (`src/test/renderWithRouter.tsx`)

**Target Platform**: Static site on GitHub Pages, modern browsers

**Project Type**: Single-page web app (frontend only)

**Performance Goals**: The history page shows within the same time as Team History, since both load all seasons through the shared cache

**Constraints**: No backend, no new data files, no `useMemo`, minimal `useEffect`, Suspense for loading, no `Map`/`Set`

**Scale/Scope**: 23 seasons, about 2,400 players. The longest career has about 23 rows, plus extra rows for trades.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status |
|---|---|
| I. Static hosting only | Pass. Client-side only, no backend. |
| II. Data prepared at build time | Pass. Uses existing `data/processed` season files. No runtime third-party calls. |
| III. Base-path-safe navigation | Pass. A hash route, with a deep link that is verified under preview (quickstart). |
| IV. Respectful data collection | N/A. No scraping changes. |
| V. Simplicity | Pass with one justified dependency: `cmdk`, pulled in by the shadcn `command` component for the player search (see Complexity Tracking). A shared stat-column module removes duplication. |
| State & data layer | Pass. Seasons come from loader data (`loadAllSeasons`), pinned team is in Redux, and player ID is in the URL. Nothing is copied between them. |
| Data validation | Pass. `:player` is parsed with Zod in the loader. |

Post-design re-check: still passes, with no violations.

## Project Structure

### Documentation (this feature)

```text
specs/020-player-history-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── routes.md
│   └── player-history-table.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── routes.tsx                       # + playerHistory/:player route and loader
├── data/
│   ├── playerHistory.ts             # new: PlayerStint, getPlayerHistory
│   └── playerHistory.test.ts        # new
├── components/
│   ├── statColumns.tsx              # new: STAT_COLUMNS, rating lookups, RatingKey, StatCells (moved from RosterPane)
│   ├── RosterPane.tsx               # use statColumns; player name becomes a Link
│   ├── RosterPane.test.tsx          # + name link / badge still pins
│   ├── PlayerHistoryTable.tsx       # new: Season + Team + StatCells, clickable rows
│   ├── PlayerSearch.tsx             # new: player search box (shadcn Popover + Command)
│   └── NotFoundCard.tsx             # new: card shared by RouteError and the empty history case
└── views/
    ├── PlayerHistoryView.tsx        # new: heading, key, Suspense, table or NotFoundCard
    ├── PlayerHistoryView.test.tsx   # new
    └── RouteError.tsx               # 'Player not found' message, uses NotFoundCard
```

**Structure Decision**: This follows the existing single-app layout. The view goes in `src/views`, presentational pieces in `src/components`, and pure data derivation in `src/data`, mirroring Team History.

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `cmdk` runtime dependency (via shadcn `command`, with `popover`) | Search box with keyboard-navigable suggestions (FR-013); AGENTS.md requires shadcn components over hand-rolled ones | A native `<datalist>` can't show season ranges to tell same-named players apart and styles inconsistently; a hand-rolled listbox would duplicate what shadcn provides |
