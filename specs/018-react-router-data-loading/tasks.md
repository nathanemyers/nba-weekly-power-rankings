---

description: "Task list for URL Routing and On-Demand Season Data"
---

# Tasks: URL Routing and On-Demand Season Data

**Input**: Design documents from `specs/018-react-router-data-loading/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md,
contracts/season-index.md, quickstart.md

**Tests**: The spec does not ask for TDD. It does require existing behavior to keep passing tests
(SC-006), and the constitution requires `npm test` to pass. Test tasks here therefore migrate
existing suites to the router and cover the new address and loading logic. They come after the
implementation tasks in each story.

**Organization**: Tasks are grouped by user story. US1 and US2 (both P1) depend only on Phase 2.
US3 (P2) adds the loading UX, failure handling and size verification on top of the lazy loaders
that Phase 2 introduces.

**Project rules (apply to every task)**:
- Use Suspense for loading state and keep `useEffect` to a minimum.
- Do not use `useMemo`, `Map` or `Set`. Use plain objects and arrays.
- Comments are one sentence at most.
- Clickable elements use `cursor-pointer`.
- Use shadcn/ui components and do not edit the generated files.
- Never run `npm run build:summaries`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2 or US3 from spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Generate the season data in its new lazily loaded shape.

- [X] T001 Change the index writer at the end of `scripts/build-rankings.mjs` to emit two exports in place of `seasonData`/`seasons`, per `specs/018-react-router-data-loading/contracts/season-index.md`:
  - `export const seasonIndex: unknown = [...]`, newest first, each entry `{ name, source, champion? }`. `source` is the same value written into that season's JSON. `champion` is `PLAYOFFS[season].champion`, written only when a bracket exists.
  - `export const seasonLoaders: Record<string, () => Promise<{ default: unknown }>> = { "2025-26": () => import("./2025-26.json"), ... }`, with the same names in the same order.
  - Update the comment above the writer to one sentence.
- [X] T002 Regenerate `data/processed/seasons/index.ts` with `npm run build:rankings`. If raw inputs are missing locally, hand-write the file to the T001 shape for all 22 seasons in `data/processed/seasons/`. Then `git diff data/processed/seasons/*.json` must show no changes to season JSON.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The loader-backed data module, router shell and test harness that every story uses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Add `SeasonIndexEntrySchema` and `SeasonIndexSchema` to `src/schemas/season.ts`:
  - `name`: `z.string().regex(/^\d{4}-\d{2}$/)`
  - `source`: the same `DataSource` enum used by `SeasonDataSchema.source`
  - `champion`: `z.enum(Team).optional()`
  - Export the `SeasonIndexEntry` type with `z.infer`.
- [X] T004 Create `src/data/seasonData.ts`:
  - **Index**: parse each `seasonIndex` entry from `data/seasons` with `SeasonIndexEntrySchema`. Drop failures with `console.error` and keep valid entries in order. Export `seasonIndex: SeasonIndexEntry[]` and `latestSeason: string | undefined` (`seasonIndex[0]?.name`).
  - **Season type and transform**: move the `Season` type from `src/store/slices/seasons/seasons.ts`. Move the per-season transform from `src/store/slices/seasons/loadSeasons.ts` into `parseSeason(name, raw): Season`, which runs `SeasonDataSchema.safeParse`, throws an `Error` containing `z.prettifyError` output on failure, and otherwise maps `Teams` exactly as `loadSeasons` does today.
  - **`loadSeason(name): Promise<Season>`**: cache promises in a module-level `Record<string, Promise<Season>>`. On a miss, call `seasonLoaders[name]()` and then `parseSeason(name, mod.default)`. Delete the cache entry if the promise rejects, so a later visit retries. Reject for a name not in `seasonLoaders`.
  - **`loadAllSeasons(): Promise<Season[]>`**: run `Promise.allSettled` over `seasonIndex` names, `console.error` each rejection, and return the fulfilled seasons in index order.
  - **`getTeamRankings(season, team)`**: returns `season.teams.find(...)`.
  - **`getAISummary(season, team)`**: replaces `getAISummaryForSeason`.
- [X] T005 [P] Create `src/data/analysis.ts` by moving `getMostImprovedTeams` and `getMostDeclinedTeams` from `src/store/slices/seasons/analysis.ts` and changing them to take `(season: Season, returnAmount = 3)` instead of `RootState`.
- [X] T006 [P] In `src/store/slices/chart/chart.ts`:
  - Remove the `getSelectedSeason` import and `getMaxWeek`.
  - Add a `maxWeek: number` second parameter to `getWindowEnd`, `getWindowStart`, `getStartWeek`, `getEndWeek`, `getCanPageEarlier`, `getCanPageLater` and `getCanZoom`.
  - Change the thunk to `pageWindow(delta, maxWeek)`.
  - Delete `getSinglePinnedTeamRankings`, `getPinnedTeamRoster` and `getPinnedTeamCoaches`. Callers use `getTeamRankings` from T004.
- [X] T007 [P] Create `src/hooks/useSeason.ts` exporting `useSeason(): Season`, which returns `use((useRouteLoaderData('season') as { season: Promise<Season> }).season)`.
- [X] T008 Create `src/routes.tsx` exporting `routes: RouteObject[]`:
  - A root route `{ path: '/', Component: Root, HydrateFallback: RootFallback, children: [...] }`.
  - An index child whose loader throws `redirect('/' + latestSeason)` when `latestSeason` exists, and whose Component renders the existing "No season data available" message.
  - Move the route tree out of `src/App.tsx`.
- [X] T009 [P] In `src/Root.tsx`, add and export a `RootFallback` component: the same `<main>` shell with a short muted "Loading…" line.
- [X] T010 In `src/App.tsx`, build `createHashRouter(routes)` from `src/routes.tsx`, remove the `createBrowserRouter` import, and remove the stray `,` after `<RouterProvider router={router} />`.
- [X] T011 [P] Create `src/test/renderWithRouter.tsx` exporting `renderWithRouter(initialEntries: string[] = ['/'])`. It builds `createMemoryRouter(routes, { initialEntries })` with a fresh `makeStore()`, renders `<Provider><TooltipProvider><RouterProvider/></TooltipProvider></Provider>`, and returns `{ ...render result, router, store }`.
- [X] T012 [P] Rewrite `src/test/mockSeasons.ts` so the `data/seasons` mock exports `seasonIndex` (`[{ name: 'long', source: 'nba', champion: <PLAYOFFS champion> }, { name: 'short', source: 'espn' }]`) and `seasonLoaders` (`{ long: () => Promise.resolve({ default: <long fixture> }), short: ... }`), keeping the current fixture contents.

**Checkpoint**: The data module, router shell and test harness exist, and stories can start.

---

## Phase 3: User Story 1 - Shareable, bookmarkable season view (Priority: P1) 🎯 MVP

**Goal**: The URL names the season (`#/2024-25`). Deep links, the picker, Back/Forward, the
default redirect and the unknown-season redirect all work (FR-001–003, FR-007–009, FR-016–017).

**Independent Test**: `npm run preview`, open `#/2018-19` in a fresh tab, switch seasons with the
picker, and press Back. Quickstart rows 1–3 and 6.

### Implementation for User Story 1

- [X] T013 [US1] Add the season child route to `src/routes.tsx`: `{ id: 'season', path: ':season', Component: ChartView, ErrorBoundary: RouteError, loader }`. The loader throws `redirect('/' + latestSeason)` when `params.season` is not a `seasonIndex` name, and otherwise returns `{ season: loadSeason(params.season) }` **without awaiting** (research R4).
- [X] T014 [P] [US1] Create `src/views/RouteError.tsx`, which reads `useRouteError()`:
  - For an `isRouteErrorResponse` with status 404, render "Page not found".
  - Otherwise render "Couldn't load this season" (US3 adds the season picker to this screen).
  - Always include a `Link` to `/` with `cursor-pointer`.
  - Use shadcn `Card` and project color tokens only.
- [X] T015 [P] [US1] Rewrite `src/components/SeasonSelect.tsx`:
  - Value comes from `useParams().season`. Options and champion logos come from `seasonIndex` in `src/data/seasonData.ts`.
  - `onValueChange` dispatches `setPinnedTeams([])`, then calls `navigate('/' + value)`.
  - Remove all `UI`/`seasons` slice imports. It must not call `useSeason`, so it can render on the error screen.
- [X] T016 [US1] Update `src/views/ChartView.tsx`:
  - Split the body below the header into a `ChartBody` component that calls `useSeason()`, and wrap it in `<Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>`.
  - Pass `season.maxWeek` to `getStartWeek` and `getEndWeek` through `useAppSelector((s) => getEndWeek(s, season.maxWeek))`.
  - Remove the `getSelectedSeason` import and the `data ? … : 'No season data available'` branch, since the index route now owns that message.
- [X] T017 [P] [US1] Update `src/components/ChartControls.tsx` and `src/components/Chart/useChartControls.ts`: take `maxWeek` from `useSeason()`, pass it to `getCanPageEarlier`, `getCanPageLater` and `getCanZoom`, and pass it to `pageWindow(delta, maxWeek)` (keep the existing keydown effect and add `maxWeek` to its deps).
- [X] T018 [P] [US1] Update `src/components/RosterPane.tsx`: replace the `getSelectedSeason`, `getPinnedTeamRoster` and `getPinnedTeamCoaches` selectors with `const season = useSeason()` and `getTeamRankings(season, teamId)?.roster` / `.coaches`.
- [X] T019 [P] [US1] Update `src/components/RankSwings.tsx`: use `useSeason()` with `getMostImprovedTeams(season)` and `getMostDeclinedTeams(season)` from `src/data/analysis.ts`.
- [X] T020 [P] [US1] Update `src/components/TeamSeasonSummary.tsx`: use `useSeason()` and `getAISummary(season, singlePinnedTeam)` from `src/data/seasonData.ts`.

### Tests for User Story 1

- [X] T021 [US1] Migrate `src/App.test.tsx`:
  - Change the `vi.mock('data/seasons')` factory to the `seasonIndex`/`seasonLoaders` shape for the fixtures `long`, `mid`, `short`, `rising` and `active`.
  - Replace `renderWithStore(<App />)` with `renderWithRouter(['/long'])` (or the season each test needs), and await first render with `findBy*`.
  - Keep every existing assertion.
  - Add tests that:
    - `/` lands on `/long`;
    - `/nope` redirects to `/long`;
    - choosing `mid` sets `router.state.location.pathname` to `/mid` and clears pins;
    - `router.navigate(-1)` returns to `/long`.
- [X] T022 [P] [US1] Migrate `src/App.empty.test.tsx`: mock `seasonIndex: []` and `seasonLoaders: {}`, render `renderWithRouter(['/'])`, and keep the "No season data available" and no-combobox assertions.
- [X] T023 [P] [US1] Update `src/store/slices/chart/chart.test.ts` for the `maxWeek` parameter on the window selectors and `pageWindow(delta, maxWeek)`. Remove tests of the deleted roster/coach selectors.
- [X] T024 [P] [US1] Migrate `src/components/RosterPane.test.tsx` to render inside `renderWithRouter(['/long'])` with the `mockSeasons` mock from T012, pinning a team through `store.dispatch(setPinnedTeams([...]))`.

**Checkpoint**: The season chart is fully URL-driven, and `npm test` passes for US1 suites.

---

## Phase 4: User Story 2 - Shareable team history page (Priority: P1)

**Goal**: `#/teamHistory/bos` is a deep-linkable page that reads its team from the URL. The button
and the season cards navigate (FR-004–006, FR-008, FR-012).

**Independent Test**: Open `#/teamHistory/BOS` in a fresh tab, click the 2007-08 card, then press
Back. Quickstart rows 4, 5 and 7.

### Implementation for User Story 2

- [X] T025 [US2] Add the team history child route to `src/routes.tsx`: `{ id: 'teamHistory', path: 'teamHistory/:team', Component: TeamHistoryView, ErrorBoundary: RouteError, loader }`.
  - The loader parses `params.team?.toLowerCase()` with `z.enum(Team).safeParse`.
  - On failure it throws `data(null, { status: 404, statusText: 'Team not found' })`.
  - Otherwise it returns `{ team, seasons: loadAllSeasons() }` **without awaiting**.
- [X] T026 [P] [US2] In `src/views/RouteError.tsx`, render "Team not found" when the 404's `statusText` is `'Team not found'`, keeping the link back to `/`.
- [X] T027 [P] [US2] Update `src/components/TeamHistoryButton.tsx`: take a `team?: Team` prop and call `navigate('/teamHistory/' + team)` on click. Remove the `setView`/`View` imports. In `src/views/ChartView.tsx`, pass `team={singlePinnedTeam}`.
- [X] T028 [P] [US2] Update `src/components/TrendMinimap/TrendMinimap.tsx` to take `season: Season` instead of `seasonId`, dropping the store lookup. Update `src/components/TrendMinimap/TrendMinimap.test.tsx` to pass a parsed fixture season.
- [X] T029 [US2] Update `src/components/TeamHistory.tsx`:
  - Props become `{ team: Team; seasons: Season[] }`, and the `getSeasons` selector is removed.
  - Card click dispatches `setPinnedTeams([props.team])`, then calls `navigate('/' + season.name)` (research R9).
  - Pass `season` to `TrendMinimap`.
  - Remove the `UI` slice imports.
- [X] T030 [US2] Update `src/views/TeamHistoryView.tsx`:
  - Read `{ team, seasons }` from `useLoaderData()`. Do not read the pinned team.
  - Render the logo and title header immediately.
  - Wrap a child that calls `use(seasons)` and renders `<TeamHistory team={team} seasons={...} />` in `<Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>`.

### Tests for User Story 2

- [X] T031 [US2] Add team history tests to `src/App.test.tsx`:
  - `renderWithRouter(['/teamHistory/BOS'])` shows "Boston Celtics Team History" with one card per fixture season containing Boston.
  - `/teamHistory/xyz` shows "Team not found".
  - On `/long`, pinning Boston and clicking Team History goes to `/teamHistory/bos`.
  - Clicking the `mid` card goes to `/mid` with Boston pinned.
  - `router.navigate(-1)` returns to `/teamHistory/bos`.

**Checkpoint**: Both views are URL-driven and shareable, and the MVP (US1 + US2) is complete.

---

## Phase 5: User Story 3 - Faster first load by loading season data on demand (Priority: P2)

**Goal**: Only the viewed season downloads. Switching shows a loading state, revisits are
instant, and failures are scoped to one season (FR-010, FR-011, FR-013, FR-014; SC-002–005).

**Independent Test**: Quickstart "Network checks" rows 8–12 and the bundle size check.

### Implementation for User Story 3

- [ ] T032 [US3] In `src/views/ChartView.tsx`, key the Suspense boundary by season name (`key={useParams().season}`), so a fresh fallback shows on each switch to a not-yet-loaded season (research R5). Replace the plain fallback text with a chart-sized placeholder: a `div` with `style={{ height: CHART_HEIGHT }}` and the muted "Loading season…" text.
- [ ] T033 [P] [US3] In `src/views/RouteError.tsx`, add `<SeasonSelect />` and the failed season name ("Couldn't load the 2010-11 season") for non-404 errors on the `season` route, so the visitor can pick another season (US3 scenario 4).

### Tests for User Story 3

- [ ] T034 [P] [US3] Create `src/data/seasonData.test.ts`, moving the cases from `src/store/slices/seasons/loadSeasons.test.ts` to `parseSeason`. Mock `data/seasons` with `vi.fn` loaders, and test that:
  - `loadSeason` calls a season's loader once across two calls;
  - invalid JSON rejects and logs, and a second call retries the loader;
  - `loadAllSeasons` skips a rejected season and keeps index order;
  - an index entry with a bad `name` is dropped.
- [X] T035 [P] [US3] Rewrite `src/store/realData.test.ts` as `src/data/realData.test.ts`: parse the real `seasonIndex` (22 entries), `await loadAllSeasons()` (22 seasons, no `console.error`), and keep the roster/head-coach assertions over the loaded seasons.
- [ ] T036 [US3] Add tests to `src/App.test.tsx`:
  - With a deferred loader for `mid`, switching to `mid` shows "Loading season…" until it resolves.
  - A rejecting loader for `short` shows "Couldn't load" with the season picker, and picking `long` from there renders the chart.

**Checkpoint**: Every story works, and data is chunked, cached and failure-isolated.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T037 Delete the old store data layer: `src/store/slices/UI/` (all files), `src/store/slices/seasons/` (`seasons.ts`, `loadSeasons.ts`, `loadSeasons.test.ts`, `analysis.ts`, `index.ts`) and `src/test/renderWithStore.tsx`. Set `reducer: { chart }` in `src/store/redux.ts`. Then `grep -rn "slices/UI\|slices/seasons\|renderWithStore\|seasonData\b" src` must return nothing.
- [ ] T038 [P] Check `src/store/redux.ts` exports and `src/store/hooks.ts` still type-check with the smaller `RootState`, and fix any remaining `state.seasons`/`state.UI` references the compiler reports.
- [ ] T039 Run `npm run lint`, `npm test` and `npm run build`, and fix failures. Confirm `dist/assets/` has 22 per-season chunks and the main `index-*.js` contains no weekly summary text.
- [ ] T040 Run the quickstart bundle check: main chunk gzip plus the largest season chunk gzip must be ≤ 1.08 MB (SC-002). Record the numbers in `specs/018-react-router-data-loading/quickstart.md` under a "Results" heading.
- [ ] T041 Run `npm run preview` and walk quickstart rows 1–12 under `/nba-weekly-power-rankings/` in the browser (constitution quality gate for routing and loading changes). Note any failures in `specs/018-react-router-data-loading/quickstart.md` "Results".

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)**: no dependencies; T002 depends on T001.
- **Foundational (T003–T012)**: depends on Setup. T004 depends on T003. T008 depends on T004 and T009. T010 depends on T008. T011 depends on T008.
- **US1 (T013–T024)**: depends on Phase 2.
- **US2 (T025–T031)**: depends on Phase 2. It shares `src/routes.tsx`, `src/views/RouteError.tsx`, `src/views/ChartView.tsx` and `src/App.test.tsx` with US1, so run it after US1 or merge those files with care.
- **US3 (T032–T036)**: depends on US1 (ChartView Suspense, RouteError). T035 also depends on US2's `loadAllSeasons` use, which already exists from T004.
- **Polish (T037–T041)**: depends on every story. T037 must come after every consumer of the old slices has been migrated (T015–T020, T027–T030).

### Within Each Story

- Route/loader task first, then components, then view wiring, then tests.

### Parallel Opportunities

- **Phase 2**: T003, T005, T006, T007, T009, T011 and T012 touch different files and can run together after T001–T002.
- **US1**: T014, T015, T017, T018, T019 and T020 can run together after T013. T022, T023 and T024 can run together.
- **US2**: T026, T027 and T028 can run together after T025.
- **US3**: T033, T034 and T035 can run together.

## Parallel Example: User Story 1

```text
After T013 (season route):
  T015 SeasonSelect from seasonIndex + navigate      (src/components/SeasonSelect.tsx)
  T017 ChartControls / useChartControls maxWeek     (src/components/ChartControls.tsx, Chart/useChartControls.ts)
  T018 RosterPane via useSeason                     (src/components/RosterPane.tsx)
  T019 RankSwings via analysis.ts                   (src/components/RankSwings.tsx)
  T020 TeamSeasonSummary via getAISummary           (src/components/TeamSeasonSummary.tsx)
Then T016 ChartView, then T021 App tests.
```

## Implementation Strategy

### MVP (US1 + US2, both P1)

1. Phase 1, then Phase 2. Data is already chunked at this point because of the new index shape.
2. US1, then validate quickstart rows 1–3 and 6 in `npm run preview`.
3. US2, then validate rows 4, 5 and 7. The branch is now shippable: URLs are shareable and the
   old Redux view switch is gone.

### Incremental Delivery

4. US3 adds the keyed loading state, the scoped error screen and cache/failure tests. Validate
   network rows 8–12.
5. Polish removes the dead slices and confirms size and preview gates before merging.

## Notes

- Season JSON files under `data/processed/seasons/*.json` must not change. Only `index.ts` is
  regenerated.
- `seasonLoaders` dynamic imports must stay relative (`./2024-25.json`), so Vite applies the
  `/nba-weekly-power-rankings/` base to chunk URLs.
- Commit after each phase checkpoint.

## Implementation Log (MVP run, 2026-10-26)

- T001–T031 are done. T035 and T037 were pulled forward, because the build and tests could not compile while the old slices and `realData.test.ts` still imported removed exports.
- T034 is partly done. `parseSeason` cases moved to `src/data/seasonData.test.ts`. The cache, retry and `loadAllSeasons` tests are still open.
- Deviation: `SeasonIndexEntrySchema.name` is `z.string().min(1)`, not the `^\d{4}-\d{2}$` regex, so fixture names like `long` stay valid (data-model.md updated).
- Deviation: `NoSeasons` lives in `src/views/NoSeasons.tsx` (react-refresh lint rule). A `*` route renders "Page not found".
- Results: `npm run lint`, `npm test` (198 passing) and `npm run build` pass. The main chunk is 259 KB gzip, down from ≈2.17 MB, and the largest season chunk is ≈102 KB gzip.
- Preview under `/nba-weekly-power-rankings/` (quickstart rows 1, 2, 4, 5, 7 and 8) passed:
  - a fresh `#/2018-19` requests only its own chunk;
  - `#/teamHistory/BOS` loads 22 chunks with no console errors;
  - the card click lands on `#/2007-08` with Boston pinned;
  - the bare base address becomes `#/2025-26`;
  - `#/teamHistory/xyz` shows "Team not found".
