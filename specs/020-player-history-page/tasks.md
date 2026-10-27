# Tasks: Player History Page

**Input**: Design documents from `/specs/020-player-history-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md, contracts/player-history-table.md, quickstart.md

**Tests**: quickstart.md lists the expected Vitest coverage, and the constitution requires `npm test` to pass. Each story includes its tests. Tests mock `data/seasons` with `test/mockSeasons` (`vi.mock('data/seasons', async () => (await import('test/mockSeasons')).mockSeasons)`), as `src/components/RosterPane.test.tsx` does.

**Fixture reference** (`src/test/fixtures.ts`): Boston `ROSTERS` in season `long` holds Paul Pierce `piercpa01` (80 g, 35.9 mpg, 19.6 pts), Kevin Garnett `garneke01` (`joinedFrom: min`), Joe Moves `movesjo01` (`joinedFrom: det`, `leftFor: mia`), Joe Scrub `scrubjo01` (3 g, `per: null`, `leftFor: tor`). `mockSeasons` lists seasons newest first: `long`, then `short`.

**Code rules (AGENTS.md)**: no `useMemo`, no new `useEffect`/`useRef`, Suspense for loading, Tailwind utilities only, no colors in components, shadcn `Table` from `src/components/ui/table`, no `Map`/`Set`, `cursor-pointer` on clickable elements, comments of one sentence at most.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Create and switch to branch `020-player-history-page` from `master` (git; the uncommitted spec docs in `specs/020-player-history-page/` come along)

---

## Phase 2: Foundational (blocks US1 and US2)

**Purpose**: Shared stat cells and the derived player history, which every story needs.

- [X] T002 Create `src/components/statColumns.tsx` by moving these out of `src/components/RosterPane.tsx` unchanged and exporting them: `StatColumn` type, `RATING_CLASSES`, `RATING_FILLS`, `RATING_NAMES`, `decimal`, `STAT_COLUMNS`, `RatingKey`. Add and export `StatHeads()`, which renders the `STAT_COLUMNS` `<TableHead key title className="text-right">` list, and `StatCells({ player }: { player: RosterEntry })`, which renders the `STAT_COLUMNS` `<TableCell>` list with the existing `unrated`/`rating`/`data-rating`/class logic
- [X] T003 Update `src/components/RosterPane.tsx` to import `RatingKey`, `StatHeads` and `StatCells` from `./statColumns`, and replace its inline header and cell loops with `<StatHeads />` and `<StatCells player={player} />`. Remove the now-unused imports. Output must be identical: `npm test -- RosterPane` passes unchanged
- [X] T004 [P] Create `src/data/playerHistory.ts` exporting `type PlayerStint = { season: string; team: Team; player: RosterEntry }` and `getPlayerHistory(seasons: Season[], playerId: string): PlayerStint[]`:
  - Go through `seasons` in reverse, since the input is newest first and the output must be oldest first.
  - For each season, collect `{ season: season.name, team: t.teamId, player }` for every `t` in `season.teams` whose `t.roster` has an entry with `id === playerId`.
  - Order a season's stints by starting at the one with no `player.joinedFrom`, then repeatedly taking the stint whose `team` equals the current `player.leftFor`. Append any stint the chain didn't reach, so none is dropped.
  - Return `[]` when nothing matches.
  - Use arrays and plain objects only.
- [X] T005 [P] Add a second season of roster data in `src/test/mockSeasons.ts`: give the `short` season `rosters: { bos: [<Paul Pierce entry, id 'piercpa01', g 70, pts 21.0>] }`, built with the same field set as `ROSTERS` entries. Then confirm the existing tests that render `short` still pass (`npm test`)
- [X] T006 Create `src/data/playerHistory.test.ts` (Vitest, plain `Season` objects from `loadAllSeasons()` under the `test/mockSeasons` mock) asserting:
  - `piercpa01` gives seasons `['short', 'long']`, both with team `bos`.
  - `movesjo01` in `long` gives a single `bos` stint.
  - A hand-built season where a player has three stints `chi` (`joinedFrom: tor`), `lal` (`leftFor: tor`), `tor` (`joinedFrom: lal`, `leftFor: chi`), listed in that order, returns `lal`, `tor`, `chi`.
  - `'zzzzzz99'` gives `[]`.

**Checkpoint**: Roster pane is unchanged on screen, `getPlayerHistory` is tested, and `npm test` passes.

---

## Phase 3: User Story 1 - Open a player's career history from the roster (Priority: P1) 🎯 MVP

**Goal**: The player's name in the roster pane opens a history page with Season, Team and the shared stat columns.

**Independent Test**: Season `long`, pin Boston, click "Paul Pierce". The address is `/playerHistory/piercpa01`, the heading is "Paul Pierce", the rows are `short` then `long`, and the Team cells read "Boston Celtics". The stat cells' `data-rating` values match the roster pane's for `long`.

- [X] T007 [US1] Add the route to `src/routes.tsx` as a child of `/`, placed before the `:season` route:
  - Route object: `{ id: 'playerHistory', path: 'playerHistory/:player', Component: PlayerHistoryView, ErrorBoundary: RouteError, loader: playerHistoryLoader }`.
  - `playerHistoryLoader` parses `params.player` with `z.string().regex(/^[a-z]+\d{2}$/).safeParse(...)`. On failure it throws `data(null, { status: 404, statusText: 'Player not found' })`.
  - Otherwise it returns `{ playerId, history: loadAllSeasons().then((seasons) => getPlayerHistory(seasons, playerId)) }`, without awaiting.
- [X] T008 [P] [US1] Create `src/components/PlayerHistoryTable.tsx` with props `{ history: PlayerStint[] }`. It renders the shadcn `Table` described in `contracts/player-history-table.md`:
  - Header: `Season` (`sticky left-0 w-20 bg-background`), `Team` (`sticky left-20 bg-background`), then `<StatHeads />`.
  - Rows: one `TableRow` per stint, `key={season + team}`, `className="group hover:bg-muted"`.
  - Season cell: `stint.season`, `font-medium`.
  - Team cell: `<span className="flex items-center gap-2"><TeamLogo team={stint.team} alt="" className="size-5 object-contain" />{getTeamName(stint.team)}</span>`.
  - Both sticky cells get `transition-colors group-hover:bg-muted`.
  - Then `<StatCells player={stint.player} />`. No move badges.
  - Row click behavior is added in US2.
- [X] T009 [US1] Create `src/views/PlayerHistoryView.tsx`, modeled on `src/views/TeamHistoryView.tsx`:
  - Read `{ playerId, history }` with `useLoaderData()` as `{ playerId: string; history: Promise<PlayerStint[]> }`.
  - Render `<Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>` around an inner `PlayerHistoryContent` that calls `use(history)`.
  - When the result is non-empty, render `<h1 className="mb-10 text-4xl">{history[history.length - 1].player.name}</h1>`, then `<div className="flex justify-end"><RatingKey /></div>`, then `<div className="mt-2"><PlayerHistoryTable history={history} /></div>`.
  - When the result is empty, render the not-found card from T015. If US3 isn't done yet, render `<p>Player not found</p>` temporarily.
- [X] T010 [US1] In `src/components/RosterPane.tsx`, wrap the player's name in `<Link to={'/playerHistory/' + player.id} className="cursor-pointer hover:underline">{player.name}</Link>` (`Link` from `react-router`). Keep the move-badge `<span>` as a sibling of the link, never inside it, so badges still pin the other team (FR-003)
- [X] T011 [US1] Add tests to `src/components/RosterPane.test.tsx`:
  - The "Paul Pierce" link has `href` ending `/playerHistory/piercpa01`.
  - Clicking Joe Moves' "Left for Miami Heat mid-season" badge still pins `mia`, and the router path stays `/long`. Render with `renderWithRouter(['/long'])` plus a pin dispatch if `renderInSeason` lacks the route.
- [X] T012 [US1] Add a `describe('player history')` block to `src/App.test.tsx`, reusing its existing `settle`/`path` helpers:
  - Render `['/long']`, pin Boston via `store.dispatch(setPinnedTeams([Team.Boston]))`, and click the "Paul Pierce" link. The path becomes `/playerHistory/piercpa01`, there's a heading "Paul Pierce", and the body rows' first cells are `['short', 'long']`.
  - Render `['/playerHistory/piercpa01']` directly and check the second row's `data-rating` values equal the roster pane's for Pierce in `long`.

**Checkpoint**: MVP. The player page opens from the roster and shows correct, colored stats.

---

## Phase 4: User Story 2 - Jump from a history row back to that team's season (Priority: P1)

**Goal**: Clicking a row, or pressing Enter on it, opens that season's chart with only that row's team pinned.

**Independent Test**: From `/playerHistory/piercpa01`, click the `short` row. The path is `/short`, `getPinnedTeams` is `['bos']`, and the Boston roster pane is shown.

- [X] T013 [US2] In `src/components/PlayerHistoryTable.tsx`:
  - Add `useAppDispatch()` and `useNavigate()`, and an `open(stint)` function that runs `dispatch(setPinnedTeams([stint.team]))`, then `navigate('/' + stint.season)`, the same as `src/components/TeamHistory.tsx`.
  - Give each `TableRow` `onClick={() => open(stint)}`, `tabIndex={0}` and `onKeyDown={(e) => { if (e.key === 'Enter') open(stint) }}`.
  - Set `aria-label={getTeamName(stint.team) + ' ' + stint.season + ' season'}` on each row, and add `cursor-pointer` to its `className`.
- [X] T014 [US2] Add tests to the `player history` block in `src/App.test.tsx`:
  - Clicking the `short` row gives path `/short` and `getPinnedTeams(store.getState())` equal to `['bos']`.
  - Focusing the `long` row and pressing `{Enter}` (userEvent) gives path `/long` with `['bos']` pinned.
  - `router.navigate(-1)` then returns to `/playerHistory/piercpa01`.

**Checkpoint**: The history page links back into the chart.

---

## Phase 5: User Story 3 - Share or reload a player history link (Priority: P2)

**Goal**: Deep links work, and unknown or malformed IDs show "Player not found" with a way back.

**Independent Test**: `/playerHistory/zzzzzz99` and `/playerHistory/Curry` both show "Player not found" and a "Back to the rankings chart" link.

- [X] T015 [P] [US3] Create `src/components/NotFoundCard.tsx` exporting `NotFoundCard({ message, children }: { message: string; children?: ReactNode })`. It renders the card markup currently in `src/views/RouteError.tsx`: `Card` > `CardContent className="flex flex-col gap-2"` > `h1 className="text-2xl font-semibold"`, then `children`, then `<Link to="/" className="cursor-pointer text-primary underline">Back to the rankings chart</Link>`
- [X] T016 [US3] Refactor `src/views/RouteError.tsx` to render `<NotFoundCard message={message}>{season-select block}</NotFoundCard>`, and add `'Player not found'` to the 404 `statusText` mapping beside `'Team not found'` (any other 404 still says "Page not found")
- [X] T017 [US3] In `src/views/PlayerHistoryView.tsx`, render `<NotFoundCard message="Player not found" />` when the resolved history is empty, replacing the temporary text from T009
- [X] T018 [US3] Add tests to the `player history` block in `src/App.test.tsx`:
  - `/playerHistory/zzzzzz99` shows "Player not found" and the "Back to the rankings chart" link.
  - `/playerHistory/Curry` shows "Player not found".
  - The existing `/teamHistory/xyz` test still shows "Team not found".

**Checkpoint**: All stories work on their own.

---

## Phase 6: Polish & Cross-Cutting

- [X] T019 Run `npm run lint`, `npm run build` and `npm test`. All must pass (constitution quality gate). Do not run `npm run build:summaries`
- [X] T020 Verify the real data per `specs/020-player-history-page/quickstart.md` manual steps 1–6 with `npm run preview` under the non-root base path:
  - Stephen Curry `curryst01` starts in 2009-10.
  - His 2015-16 PTS is 30.1.
  - Reloading the page keeps the history.
  - The 2017-18 row opens the chart with only Golden State pinned.
  - At phone width, Season and Team stay visible while scrolling sideways.

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → stories.** T003 depends on T002. T006 depends on T004 and T005.
- **US1 (T007–T012)** depends on Phase 2. T009 needs T007 and T008. T010 needs T003. T012 needs T007–T010.
- **US2 (T013–T014)** depends on US1's `PlayerHistoryTable.tsx` (T008) and route (T007).
- **US3 (T015–T018)**: T015 and T016 depend only on Phase 2 and can run alongside US1. T017 needs T009. T018 needs T007.
- **Polish** comes after all stories.

## Parallel Opportunities

- Phase 2: T004 (`playerHistory.ts`) and T005 (`mockSeasons.ts`) run in parallel with T002/T003 (`statColumns.tsx`/`RosterPane.tsx`).
- US1: T008 (`PlayerHistoryTable.tsx`) runs in parallel with T007 (`routes.tsx`). T010 (`RosterPane.tsx`) runs in parallel with both.
- US3: T015 (`NotFoundCard.tsx`) can be built at any point after Phase 1.

```text
# Phase 2 together
T002 statColumns.tsx  |  T004 playerHistory.ts  |  T005 mockSeasons.ts
# US1 together
T007 routes.tsx  |  T008 PlayerHistoryTable.tsx  |  T010 RosterPane.tsx link
```

## Implementation Strategy

1. **MVP**: Phases 1–3. The player page opens from the roster with correct stats, and the empty state is temporary text.
2. **Add US2**: rows navigate back to the chart. This completes the user's requested loop.
3. **Add US3**: shared not-found card and malformed-ID handling.
4. **Polish**: quality gates and real-data preview check.
