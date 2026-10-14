# Research: Centralized Data Layer

All Technical Context unknowns are resolved below. Each entry has a Decision, a Rationale, and
the Alternatives considered.

## R1. Library versions

- **Decision**: `@reduxjs/toolkit@^2.13.0`, `react-redux@^9.3.0`, `zod@^4.6.7` as runtime
  dependencies.
- **Rationale**: These are the current majors, all three support React 19 and TypeScript 6, and
  constitution v1.3.0 names them. RTK 2 includes Redux 5 and Reselect 5, so there is no separate
  `redux` install.
- **Alternatives**: Zod 3 (rejected: v4 is current and adds `z.partialRecord` and
  `z.prettifyError`, which are both used below).

## R2. Slice layout

- **Decision**: Four slices under `src/store/`:
  - `seasons`: validated, display-ready season data. Static; it has no reducers.
  - `navigation`: the selected season. Future routes and team pages also go here.
  - `chartView`: zoomed-out flag and the zoomed-in week window.
  - `selection`: pinned teams.
- **Rationale**: This matches spec FR-002 and FR-010. The selected season goes in `navigation`
  because a later URL-sync or routing feature will drive it. That keeps `chartView` focused on the
  chart.
- **Alternatives**: One `app` slice (rejected: it recreates the App.tsx monolith inside the store).
  A separate empty `ui` slice (rejected: an empty slice is noise, and `navigation` already fills
  the reserved-area role).

## R3. Cross-slice rules

- **Decision**:
  - "Season change clears pins" uses `extraReducers` in `selection`, responding to
    `navigation/seasonSelected`.
  - Paging needs the selected season's `maxWeek`, which lives in another slice. It is a thunk,
    `pageWindow(delta)`, that reads state, clamps, and dispatches `chartView/windowSet`.
  - "Keep the window inside a shorter season" stays a read-time derivation in selectors, as it is
    today. Stored window values are never rewritten on a season change, so switching back to a long
    season restores the earlier window.
- **Rationale**: Each rule lives in exactly one place (SC-004). Reducers stay pure and
  slice-local. Thunks ship with `configureStore` and need no extra dependency.
- **Alternatives**: Passing `maxWeek` in the action payload (rejected: callers would have to know
  the clamp rule). A listener middleware (rejected: heavier than one thunk).

## R4. Derived values without memoization

- **Decision**: Do the per-season work once, at store creation. `seasons.bySeason[s]` holds the
  ready-made `teams: TeamRankings[]`, `maxWeek` and `completed`. Selectors then return either
  stored references or primitives: `selectStartWeek`, `selectEndWeek`, `selectCanPageEarlier`,
  `selectCanPageLater`, `selectCanZoom`, `selectPinnedTeam` and so on. No selector builds a new
  object or array.
- **Rationale**: AGENTS.md forbids `useMemo` and treats memoization as an optimization for later.
  React Redux 9 warns in development when a selector returns a new reference on every call.
  Pre-building the data and returning only primitives or stored references avoids both problems
  without `createSelector`. The React Compiler is already enabled and handles component-level
  memoization.
- **Alternatives**: `createSelector` for `{startWeek, endWeek}` and team lists (rejected for now:
  it adds memoization the project hasn't needed). `shallowEqual` in `useSelector` (rejected: easy
  to forget at each call site).

## R5. Where validation runs

- **Decision**:
  - Schemas live in `src/schemas/season.ts`.
  - `src/store/loadSeasons.ts` exports `loadSeasons(order, raw)`. It calls `safeParse` on each raw
    season and returns `{ order, bySeason, invalid }`. For each failure it logs
    `console.error` with the season name and `z.prettifyError(...)`.
  - `makeStore()` calls it with the `seasons` and `seasonData` exports from `src/data/seasons`.
  - `src/data/seasons/index.ts` drops its `as SeasonData` casts and exports
    `Record<string, unknown>`.
- **Rationale**: `App.test.tsx` swaps in fixture seasons with `vi.mock("./data/seasons")`.
  Validation has to happen after that module is loaded, or the fixtures would skip it. Keeping the
  `seasons` export as the source of display order preserves the fixture order the tests depend on.
- **Alternatives**: Validating inside `src/data/seasons/index.ts` (rejected: tests that mock the
  module bypass it). Validating in `scripts/build-rankings.mjs` only (rejected: FR-005 requires
  validation before the store. A build-time check MAY be added later).

## R6. Schema strictness

- **Decision**:
  - `rankings`, `playoffs` and `summaries` use `z.partialRecord(z.enum(Team), …)`. A key that
    isn't a known team fails validation.
  - `playoffs` values use `z.enum(PlayoffStage)`.
  - `WeekRanking.record` is optional because about 30 entries per season omit it.
  - `rank` is an integer from 1 to 30, and `week` and `maxWeek` are positive integers.
  - Unknown top-level keys are stripped (Zod's default).
- **Rationale**: Today, rankings for an unknown team are silently ignored. Rejecting the whole
  season makes data bugs obvious, matches FR-006, and keeps the "invalid season" path simple.
- **Spec alignment**: User Story 2, scenario 3 in the spec was updated from "the entry is dropped"
  to "the season is rejected" to match.
- **Alternatives**: Dropping only the bad entry (rejected: it requires a second, lenient parse and
  hides the error).

## R7. Type derivation

- **Decision**:
  - `SeasonData` and `WeekRanking` become `z.infer<…>` exports from `src/schemas/season.ts`.
  - `src/types/nba.ts` re-exports them so existing `from "types"` imports keep working.
  - `Team`, `PlayoffStage` and `Teams` stay where they are, and the schemas import them.
- **Rationale**: Satisfies FR-007 with no churn at call sites.

## R8. Provider and test wiring

- **Decision**:
  - `src/store/index.ts` exports `makeStore()` plus the `RootState`, `AppStore` and `AppDispatch`
    types.
  - `src/store/hooks.ts` exports `useAppSelector` and `useAppDispatch`, created with
    `.withTypes`.
  - `src/index.tsx` wraps `<App/>` in `<Provider store={makeStore()}>`.
  - Component tests use a new `src/test/renderWithStore.tsx` helper, which makes a fresh store per
    test.
  - `App.test.tsx` switches from `render` to that helper. Its assertions do not change.
- **Rationale**: Each test gets a fresh store, so state never leaks between tests. This is
  RTK's documented testing pattern.
- **Alternatives**: A singleton store module (rejected: state leaks across tests). Wrapping the
  Provider inside `App` (rejected: tests and future routing would no longer control the store).

## R9. Keyboard paging

- **Decision**: Keep the `keydown` effect in `App`. It now dispatches `pageWindow(±1)` and returns
  early when `zoomedOut`.
- **Rationale**: This is a DOM subscription, not state. The spec leaves the wiring to planning,
  and moving it would add no value.

## R10. Empty-data fallback

- **Decision**: If `seasons.order` is empty, `navigation.season` is `undefined` and `App` renders
  a short "No season data available" message in place of the controls and chart.
- **Rationale**: Covers the spec edge case where every season fails validation.
