---

description: "Task list for the centralized data layer"
---

# Tasks: Centralized Data Layer

**Input**: Design documents from `/specs/012-redux-data-layer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/store-api.md, quickstart.md

**Tests**: Tests are required. FR-012 asks for store tests that run without rendering, SC-003 asks for loader tests, and SC-001 relies on the existing `src/App.test.tsx`.

**Organization**: Tasks are grouped by user story. User Story 1 is behavior parity, User Story 2 is safe failure on bad data, and User Story 3 is the maintainability of the store.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Code rules that apply to every task (AGENTS.md)

- Do not use `useMemo`. Use as few `useEffect` calls as possible.
- Do not use `useRef` to hold state.
- Do not use `Map` or `Set`.
- Comments are at most one sentence.
- Selectors return a primitive or a reference already in state, never a new object or array (research R4).

---

## Phase 1: Setup

- [X] T001 Install the runtime dependencies `@reduxjs/toolkit@^2.13.0`, `react-redux@^9.3.0` and `zod@^4.6.7`. Run `npm install @reduxjs/toolkit@^2.13.0 react-redux@^9.3.0 zod@^4.6.7`, then confirm that `package.json` lists them under `dependencies`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas, the season loader, the store shell, the Provider and the test helper. Every story depends on these.

- [X] T002 Create `src/schemas/season.ts`. Import `Team` and `PlayoffStage` from `src/types/nba.ts`. Export `WeekRankingSchema` with these fields:
  - `week`: "integer ≥ 1"
  - `rank`: "integer 1–30"
  - `record?`: optional string
  - `summary`: string

  Export `SeasonDataSchema` with these fields:
  - `season`: "non-empty" string
  - `maxWeek`: "integer ≥ 1"
  - `rankings`: `z.partialRecord(z.enum(Team), z.array(WeekRankingSchema))`
  - `playoffs?`: `z.partialRecord(z.enum(Team), z.enum(PlayoffStage))`
  - `summaries?`: `z.partialRecord(z.enum(Team), z.string())`

  Also export `type WeekRanking = z.infer<typeof WeekRankingSchema>` and `type SeasonData = z.infer<typeof SeasonDataSchema>`.
- [X] T003 In `src/types/nba.ts`, delete the hand-written `WeekRanking` and `SeasonData` types and re-export both from `src/schemas/season.ts`, so that `import { SeasonData } from "types"` still works. Keep `Team`, `PlayoffStage`, `Teams`, `TeamDisplay` and `TeamRankings` where they are. If importing the enums causes a circular import, move only the two re-exports into `src/types/index.ts`.
- [X] T004 In `src/data/seasons/index.ts`, remove the `as SeasonData` casts and type `seasonData` as `Record<string, unknown>`. Leave the `seasons` export unchanged; the order it gives is the display order.
- [X] T005 Create `src/store/loadSeasons.ts`. Export the `SeasonView`, `InvalidSeason` and `SeasonsState` types from data-model.md, and export `loadSeasons(order: string[], raw: Record<string, unknown>): SeasonsState`. For each season in `order`, call `SeasonDataSchema.safeParse(raw[season])`.
  - **Success:** build `SeasonView`. Its `teams` field comes from `Teams.map(...)`, with `rankings`, `playoff` and `aiSummary` filled in and teams with no rankings filtered out. This is the same logic as `loadSeason` in `src/App.tsx`. Set `completed` to true when any playoff value is `PlayoffStage.Champion`.
  - **Failure:** push `{ season, message: z.prettifyError(error) }` to `invalid`, call `console.error` with the season name and the message, and leave the season out of `order`.
- [X] T006 Create `src/store/seasons.ts`. Use `createSlice` with name `seasons`, no reducers, and an initial state of `loadSeasons(seasons, seasonData)`, both imported from `src/data/seasons`. Export `selectSeasonOrder`, `selectInvalidSeasons` and `selectSeasonView(state)`; the last returns `state.seasons.bySeason[state.navigation.season]` or `undefined`.
- [X] T007 Create `src/store/navigation.ts`. Use `createSlice` with name `navigation` and state `{ season: string | undefined }`; the initial value is the first entry of the `order` that `loadSeasons` produced. Add a reducer `seasonSelected(season: string)`. Export `seasonSelected` and `selectSeason`. This slice is reserved for future routing and UI state (FR-010).
- [X] T008 Create `src/store/index.ts`. Export `makeStore()`, which calls `configureStore` with `reducer: { seasons, navigation, chartView, selection }`. Start with the slices that already exist and add the others as their tasks land. Also export the `RootState`, `AppStore` and `AppDispatch` types. `makeStore` MUST build a fresh store on every call.
- [X] T009 [P] Create `src/store/hooks.ts`. Export `useAppSelector = useSelector.withTypes<RootState>()` and `useAppDispatch = useDispatch.withTypes<AppDispatch>()`.
- [X] T010 [P] Create `src/test/renderWithStore.tsx`. Export `renderWithStore(ui)`, which creates `makeStore()`, renders `<Provider store={store}>{ui}</Provider>` with `@testing-library/react`'s `render`, and returns the render result plus `store`.
- [X] T011 In `src/index.tsx`, wrap `<App />` in `<Provider store={makeStore()}>` inside `StrictMode`.

**Checkpoint**: `npm run build` passes and the store loads all 9 real seasons.

---

## Phase 3: User Story 1 - Visitors see no change in behavior (Priority: P1) 🎯 MVP

**Goal**: Move every piece of shared state out of `App.tsx` and into the store, with identical visible behavior.

**Independent Test**: `npm test`. The assertions in `src/App.test.tsx` are unchanged and pass. Steps 3.1–3.5 of the quickstart walkthrough also pass.

### Implementation for User Story 1

- [X] T012 [P] [US1] Create `src/store/chartView.ts`.
  - **Slice:** `createSlice` with name `chartView`. State is `{ zoomedOut: boolean; windowStart: number; windowEnd: number }`, and the initial state is `zoomedOut: true`, `windowStart: 1`, `windowEnd: 1 + DEFAULT_WINDOW_WEEKS` (imported from `components/Chart/Chart`). Reducers:
    - `zoomToggled()` flips `zoomedOut`.
    - `windowSet({ start, end })` sets the window with no clamping. It is not exported for component use.
  - **Selectors:** all of these read `maxWeek` from `selectSeasonView`.
    - `selectZoomedOut`
    - `selectWindowEnd` = `min(windowEnd, maxWeek)`
    - `selectWindowStart` = `max(1, windowEnd' − (windowEnd − windowStart))`
    - `selectStartWeek` / `selectEndWeek`: `1`/`maxWeek` when zoomed out, otherwise the effective window
    - `selectCanPageEarlier` = `!zoomedOut && windowStart' > 1`
    - `selectCanPageLater` = `!zoomedOut && windowEnd' < maxWeek`
    - `selectCanZoom` = `windowStart' > 1 || windowEnd' < maxWeek`
  - **Thunk:** `pageWindow(delta)` uses lodash `clamp(delta, 1 − windowStart', maxWeek − windowEnd')`. If the result is not 0, it dispatches `windowSet` with the effective window shifted by that amount.
- [X] T013 [P] [US1] Create `src/store/selection.ts`. Use `createSlice` with name `selection` and state `{ pinnedTeams: Team[] }`, initially `[]`. Reducer `pinToggled(team?: Team)` follows the rule "if team is set and not already pinned → `[team]`, else `[]`". In `extraReducers`, reset `pinnedTeams` to `[]` on `seasonSelected`. Export `pinToggled`, `selectPinnedTeams`, and `selectPinnedTeam`, which returns the matching `TeamRankings` from `selectSeasonView(state).teams` when exactly one team is pinned and `undefined` otherwise.
- [X] T014 [US1] Register `chartView` and `selection` in `src/store/index.ts`. This depends on T012 and T013.
- [X] T015 [US1] Rewrite `src/App.tsx` so it holds no `useState` and the `loadSeason` function is gone.
  - **Reading state:** read everything with `useAppSelector`: `selectSeasonOrder`, `selectSeason`, `selectSeasonView`, `selectZoomedOut`, `selectStartWeek`, `selectEndWeek`, `selectCanPageEarlier`, `selectCanPageLater`, `selectCanZoom`, `selectPinnedTeams` and `selectPinnedTeam`.
  - **Dispatching:** the season `<NativeSelect>` dispatches `seasonSelected`. Earlier and Later dispatch `pageWindow(-1)` and `pageWindow(1)`. Zoom dispatches `zoomToggled()`. Chart and RankSwings `onClick` dispatch `pinToggled(team)`.
  - **Keyboard:** keep the single `keydown` `useEffect`, now dispatching `pageWindow(±1)` and returning early when zoomed out.
  - **Unchanged:** the props passed to `RankingsChart`, `RankSwings` and `TeamSummary`, the chart `key={season}`, and all markup, classes, labels and layout constants.
- [X] T016 [US1] In `src/App.test.tsx`, replace every `render(<App />)` with `renderWithStore(<App />)` from `test/renderWithStore`. Do not change any assertion or the `vi.mock("./data/seasons")` fixture. Run `npm test` and confirm the suite passes.

**Checkpoint**: User Story 1 is complete. The app behaves exactly as before, and `App.tsx` contains no shared state.

---

## Phase 4: User Story 2 - Bad season data fails safely (Priority: P2)

**Goal**: Malformed seasons are rejected and reported, the remaining seasons still work, and if no season is valid the page shows a friendly message.

**Independent Test**: `npx vitest run src/store/loadSeasons.test.ts` passes. With the season mock returning no valid seasons, the page shows "No season data available".

### Tests for User Story 2

- [X] T017 [P] [US2] Create `src/store/loadSeasons.test.ts` and call `loadSeasons` directly with in-file raw objects built from `buildRankings` in `src/test/fixtures.ts`. Spy on `console.error` and silence it. Assert:
  - (a) A valid season appears in `order` and `bySeason`, with `teams` limited to ranked teams and `completed` true when a champion exists.
  - (b) Each of the following is rejected: a missing `maxWeek`, a string `rank`, a `rankings` key `"xyz"` (unknown team), and a `playoffs` value `"winner"` (unknown stage). A rejected season is absent from `order` and appears in `invalid`, whose `message` names the failing field, and `console.error` was called with the season name.
  - (c) A mix of one valid and one invalid season keeps the valid one.
  - (d) A ranking without `record` is accepted.
- [X] T018 [P] [US2] Add a test that reads the real bundled data. Run `loadSeasons(seasons, seasonData)` against the real `src/data/seasons` exports, with no mock, and assert that `invalid` is empty and `order` has 9 entries (SC-002). Put it in `src/store/realData.test.ts`.

### Implementation for User Story 2

- [X] T019 [US2] In `src/App.tsx`, when `selectSeasonView` returns `undefined` (meaning no valid seasons), render the existing `<header>` followed by a `<p className="text-muted-foreground">No season data available</p>` in place of the controls and chart.
- [X] T020 [US2] Create `src/App.empty.test.tsx`. Use `vi.mock("./data/seasons", ...)` to return `seasons: ["bad"]` and a `seasonData.bad` that is missing `maxWeek`. Render with `renderWithStore(<App />)`, assert that the text "No season data available" is present, and assert that the page doesn't crash. Silence `console.error`.

**Checkpoint**: User Stories 1 and 2 both pass.

---

## Phase 5: User Story 3 - Maintainer can add state in one place (Priority: P3)

**Goal**: Store rules and derived values are covered by tests that never render a component (FR-012), and the reserved navigation area is ready to extend.

**Independent Test**: `npx vitest run src/store` passes without rendering React.

### Tests for User Story 3

- [X] T021 [P] [US3] Create `src/store/chartView.test.ts`. Use `vi.mock("../data/seasons")` with fixture seasons `long` (26 weeks) and `short` (8 weeks) built from `src/test/fixtures.ts`, then use `makeStore()`. Assert:
  - The initial state is zoomed out with start 1 and end equal to `maxWeek`.
  - `zoomToggled` gives a 10-week window, 1–11.
  - `pageWindow(1)` moves it to 2–12, and `pageWindow(100)` stops at `maxWeek`.
  - `pageWindow(-1)` at the start does nothing.
  - Paging does nothing while zoomed out.
  - After paging to the end of `long` and dispatching `seasonSelected("short")`, the start and end weeks stay within 1–8 and `selectCanZoom` is false.
  - Switching back to `long` restores the earlier window.
- [X] T022 [P] [US3] Create `src/store/selection.test.ts`. Use the same mock as T021 and assert:
  - `pinToggled(Team.Boston)` pins Boston, and `selectPinnedTeam` returns its `TeamRankings`, including `aiSummary` when the fixture has one.
  - Toggling Boston again clears the pin.
  - `pinToggled()` with no argument clears the pin.
  - Pinning a different team replaces Boston.
  - `seasonSelected` clears the pin.
- [X] T023 [P] [US3] Create `src/store/navigation.test.ts`. Using the same mock, assert that the initial `selectSeason` is the first entry of the mocked `seasons` order and that `seasonSelected("short")` updates it. Also assert that two `makeStore()` calls return independent stores.

**Checkpoint**: All three user stories pass on their own.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 [P] Check every new file against the AGENTS.md rules listed at the top of this file. Also confirm that no selector creates a new object or array: run `npm run dev` and check that the console shows no React Redux "selector returned a different result" warning.
- [X] T025 [P] Create `docs/state.md` next to `docs/styling.md`. In two to five sentences, say where the slices live, that shared state goes in the store, that data entering the app is validated with Zod in `src/schemas/`, and that selectors return primitives or stored references.
- [X] T026 Run `npm run lint`, `npm test` and `npm run build`, and fix any failures.
- [X] T027 Work through [quickstart.md](quickstart.md) sections 2–4: all 9 seasons are listed with no console errors, the behavior walkthrough passes, and `npm run preview` works under `/nba-weekly-power-rankings/`.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T011)** → user stories.
- Foundational order: T002 → T003 → T004 → T005 → T006 → T007 → T008 → (T009 ∥ T010) → T011.
- **US1 (T012–T016)** depends on Foundational. T012 and T013 can run in parallel, then T014 → T015 → T016.
- **US2 (T017–T020)** depends on Foundational. T017 and T018 can start right after T005. T019 and T020 depend on T015, because they edit the rewritten `App.tsx`.
- **US3 (T021–T023)** depends on T012–T014.
- **Polish (T024–T027)** comes after all stories.

## Parallel Examples

```text
# After T008:
T009 src/store/hooks.ts  ∥  T010 src/test/renderWithStore.tsx

# US1:
T012 src/store/chartView.ts  ∥  T013 src/store/selection.ts

# US2 tests (after T005):
T017 src/store/loadSeasons.test.ts  ∥  T018 src/store/realData.test.ts

# US3:
T021 chartView.test.ts  ∥  T022 selection.test.ts  ∥  T023 navigation.test.ts
```

## Implementation Strategy

1. **MVP**: Phases 1–3 (T001–T016). State lives in the store, data is validated, and the existing test suite proves parity.
2. **Increment 2**: Phase 4 adds loader tests and the empty-data fallback.
3. **Increment 3**: Phase 5 adds store unit tests, which lock in the rules for future navigation work.
4. **Polish**: Phase 6, then commit.
