# Tasks: Season Rank Swings Pane

**Input**: Design documents from `/specs/008-season-rank-swings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included, because the tie rule (SC-005) and the incomplete-season rule (FR-002) cannot be checked by hand against the stored data, and the constitution's `npm test` gate covers new code.

**Code rules** (from `AGENTS.md`, apply to every task): no `useMemo`; no `Map` or `Set`; styled-components defined at the top of the file; no new `useEffect`; comments one sentence at most.

## Phase 1: Setup

No setup: no dependencies, scripts or data files change.

## Phase 2: Foundational (blocks all stories)

- [X] T001 In src/App.test.tsx make the existing queries survive a second region and a second copy of a team name on the page: change `screen.getByText("Detroit Pistons")` to `screen.getByText("Detroit Pistons", { selector: "text" })`, and replace both bare `screen.queryByRole("region")` assertions in the "Team AI summary" block with `screen.queryByRole("region", { name: /AI-generated summary/ })`; confirm `npm test` still passes
- [X] T002 [P] Add `buildSwingRankings(maxWeek: number): Record<string, WeekRanking[]>` to src/test/fixtures.ts, built from the existing `weeklyRankings` helper: Boston rank 1 every week; Indiana rank 26 in week 1 and 9 afterwards; Memphis rank 16 in week 1 and 29 afterwards
- [X] T003 [P] Create src/Chart/TrendMinimap.test.tsx: renders an `<svg aria-hidden="true">` with one `<path>`; for rankings with week 10 missing the path's `d` contains exactly two `M` commands, and for unbroken rankings exactly one; the path's `stroke` is `url(#<id>)` matching a `<linearGradient gradientUnits="userSpaceOnUse">` in the same svg whose stops use `#30D158`, `#FFD60A` and `#FF453A` in that order from top to bottom; two minimaps rendered together have different gradient ids; rankings ending before `maxWeek` produce a last x coordinate less than `width`; an empty `rankings` array renders without throwing
- [X] T004 [P] Create src/Chart/TrendMinimap.tsx per contracts/rank-swings-ui.md, with props `rankings: WeekRanking[]`, `maxWeek: number`, optional `width` (default 96) and `height` (default 40), and no color prop. Draw one `<path fill="none">` with x = week 1 at the left edge to `maxWeek` at the right edge (guard `maxWeek` of 1) and y from `getYforRank` in src/Chart/utils.ts with a small top and bottom margin so the stroke is not clipped; start a new subpath (`M`) after a missing week, the same rule as the line in src/Chart/Chart.tsx. Stroke it with a vertical `<linearGradient gradientUnits="userSpaceOnUse">` whose id comes from `useId`, with hard stops (two stops at the same offset) at the y of rank 10.5 and rank 20.5, derived from `Teams.length / 3`: `#30D158` above the first, `#FFD60A` between, `#FF453A` below the second. No axes, labels, dots or handlers; `aria-hidden="true"`
- [X] T005 In `loadSeason` in src/App.tsx also return `completed`, defined per data-model.md as "true when the season's `playoffs` has a team at `PlayoffStage.Champion`" (false when `playoffs` is absent)

**Checkpoint**: The minimap exists and is tested on its own, `App` knows whether the season is complete, and the existing suite is ready for a new region.

## Phase 3: User Story 1 - See the biggest risers and fallers for a completed season (P1) 🎯 MVP

**Goal**: A completed season shows a pane under the chart with its biggest risers and fallers, each with a minimap and its start and end rank.

**Independent Test**: Open 2017-18 and see risers Indiana 26 → 9, Philadelphia 20 → 5, Utah 12 → 4 and fallers Memphis 16 → 29, Washington 7 → 17, San Antonio 3 → 12; open 2023-24 and see four in each group.

### Tests for User Story 1

- [X] T006 [P] [US1] Create src/RankSwings/utils.test.ts. For `getRankSwing(team)`: returns `startRank` and `endRank` from the team's first and last entries even when they are not week 1 and the season's last week, with `change = startRank - endRank`; returns `undefined` for a team with one entry or none. For `biggestSwings(teams)`: risers have `change > 0` sorted largest first and fallers `change < 0` sorted largest drop first; a team with `change` of 0 is in neither list; with five risers of +17, +15, +8, +8, +6 the list has four (both +8 kept, +6 dropped); with two risers both are returned; with no qualifying teams both lists are empty; tied teams keep the order they were passed in
- [X] T007 [US1] In src/App.test.tsx let the mock's `season()` helper take the rankings and playoffs to use, and add two seasons after "short": `rising` (`buildSwingRankings(25)` with `PLAYOFFS`) and `active` (`buildSwingRankings(25)` with no `playoffs`). Add a "Rank swings pane" block: in `rising` a region named "Biggest rank swings" contains headings "Biggest risers" and "Biggest fallers", a button named "Indiana Pacers: rose 17 places, from 26 to 9" and a button named "Memphis Grizzlies: fell 13 places, from 16 to 29", and no button for Boston; in `long` the region has "Biggest fallers" with Detroit (15 to 20) and no "Biggest risers" heading; in `active` the region is absent and nothing throws

### Implementation for User Story 1

- [X] T008 [P] [US1] Create src/RankSwings/utils.ts exporting the `RankSwing` type (`team: TeamRankings`, `startRank`, `endRank`, `change`), `getRankSwing(team: TeamRankings): RankSwing | undefined` and `biggestSwings(teams: TeamRankings[], count = 3): { risers: RankSwing[]; fallers: RankSwing[] }` per data-model.md: "A team with fewer than two recorded weeks has no swing"; "`change`: `startRank - endRank`; positive is a rise, negative a fall"; "Each list holds the top 3 by magnitude plus every team tied with the third"; "Either list may be empty". Use a stable sort so ties keep input order
- [X] T009 [US1] Create src/RankSwings/RankSwings.tsx (styled-components at the top, colors matching the panel in src/TeamSummary.tsx) with props `teams: TeamRankings[]` and `maxWeek: number`. Return `null` when both lists from `biggestSwings` are empty; otherwise render `<section aria-label="Biggest rank swings">` with a group headed "Biggest risers" and a group headed "Biggest fallers", omitting a group with no teams. Each team is a `<button type="button">` with `aria-label` of `<name>: rose N places, from A to B` or `<name>: fell N places, from A to B`, showing the team name, `<TrendMinimap rankings maxWeek />`, the text `A → B`, and `▲ N` or `▼ N`. Cards wrap so a group of four still fits at narrow widths
- [X] T010 [US1] In src/App.tsx render `<RankSwings teams={data.teams} maxWeek={data.maxWeek} />` inside `ChartColumn` only when `data.completed`, after the zoom row and before `TeamSummary`

**Checkpoint**: The pane appears for completed seasons only and reads correctly; its cards do nothing yet.

## Phase 4: User Story 2 - Clicking a team in the pane highlights it in the chart (P2)

**Goal**: A card pins its team in the chart through the same handler the chart uses.

**Independent Test**: In 2017-18 click Indiana in the pane and see its line highlighted and its AI summary shown; click Memphis and see both move to Memphis.

- [X] T011 [US2] Add tests to the "Rank swings pane" block in src/App.test.tsx using the `rising` season: clicking the Indiana button gives it `aria-pressed="true"` and leaves the Memphis button `aria-pressed="false"`; then clicking the Memphis button makes Memphis pressed and Indiana not; clicking the Memphis button again leaves neither pressed; clicking the "Indiana Pacers" label in the chart (`{ selector: "text" }`) makes the Indiana button pressed
- [X] T012 [US2] Add props `pinnedTeams: Team[]` and `onClick: (team: Team) => void` to src/RankSwings/RankSwings.tsx; each button calls `onClick` with its `teamId` and sets `aria-pressed` to true when `pinnedTeams` is exactly that one team, with a visibly distinct pressed style (lighter background and border)
- [X] T013 [US2] In src/App.tsx move the chart's inline pin handler into one `togglePin(team?: Team)` function with the existing behavior (pin the team, or clear when it is already pinned or `undefined`), pass it to `RankingsChart` as `onClick`, and pass `pinnedTeams={pinnedTeams}` and `onClick={togglePin}` to `RankSwings`

**Checkpoint**: The pane, the chart highlight and the AI summary always agree on the pinned team.

## Phase 5: User Story 3 - Pane and highlight stay correct when switching seasons (P3)

**Goal**: Changing season never leaves a highlight or pane content from the previous season.

**Independent Test**: Pin a team from the pane, choose another season, and see no team highlighted and the pane showing the new season's teams (or absent).

- [X] T014 [US3] Add tests to the "Rank swings pane" block in src/App.test.tsx: pin Indiana from the pane in `rising`, select `long`, and expect no button with `aria-pressed="true"`, the Detroit faller button present and no Indiana button; pin Indiana in `rising`, select `active`, and expect the "Biggest rank swings" region absent; pin Miami from the chart in `long`, select `mid`, and expect the Miami label no longer pinned (same attribute the "pin a team" tests check)
- [X] T015 [US3] In src/App.tsx change the season `<Select>` `onChange` to set the season and call `setPinnedTeams([])` in the same handler, with no `useEffect`

**Checkpoint**: All three stories work together.

## Phase 6: Polish & Cross-Cutting

- [X] T016 Run `npm run lint`, `npm run build` and `npm test` and fix anything they report
- [X] T017 Walk through section 2 of specs/008-season-rank-swings/quickstart.md in the running app (2017-18, 2023-24, 2019-20, click, season switch) and confirm each expected result, including that minimap colors change at the rank 10/11 and 20/21 boundaries

## Dependencies & Execution Order

- Phase 2 blocks everything. T001 must land before T010, because the pane adds a second region and a second "Detroit Pistons" to the page.
- US1 (T006–T010) needs T002, T004 and T005.
- US2 (T011–T013) needs US1.
- US3 (T014–T015) needs US2, since its tests pin from the pane.
- T001, T007, T011 and T014 all edit src/App.test.tsx; T005, T010, T013 and T015 all edit src/App.tsx. Do each set in order.

## Parallel Example: Foundational and User Story 1

```text
T002 fixtures  |  T003 minimap tests  |  T004 minimap        (three different files)
T006 utils tests  |  T008 utils                               (two different files)
```

## Implementation Strategy

1. **MVP**: Phase 2 then US1. The pane is visible and correct for every completed season; stop and review the minimap's look and color boundaries here.
2. **US2**: makes the cards clickable.
3. **US3**: clears the pin on season change. This also changes existing behavior for pins made in the chart (research.md §7).
4. Polish, then commit.
