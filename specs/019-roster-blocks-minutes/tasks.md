# Tasks: Roster Blocks and Minutes

**Input**: Design documents from `/specs/019-roster-blocks-minutes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/roster-pane.md, quickstart.md

**Tests**: The spec does not ask for new tests, but existing tests in `src/components/statRating.test.ts` and `src/components/RosterPane.test.tsx` assert turnovers and the old column order and will fail. Each story updates those assertions so `npm test` stays green (constitution quality gate).

**Organization**: Tasks are grouped by user story. All stories touch the same two source files, so tasks within and across stories are sequential unless marked [P].

**Fixture reference** (`src/test/fixtures.ts`, unchanged): Paul Pierce `g: 80, mpg: 35.9, blk: 0.5`; Joe Scrub `g: 3, mpg: 20, blk: 0.5, per: null`. Fixture default `blk` is 0.5.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Create and switch to branch `019-roster-blocks-minutes` from `master` (git; spec docs in `specs/019-roster-blocks-minutes/` come along uncommitted)

---

## Phase 2: Foundational

No foundational work: `blk` and `mpg` are already in `RosterEntrySchema` (`src/schemas/season.ts`) and in `data/processed/seasons/*.json`. Do not change the schema or data; `tov` stays stored (FR-008).

---

## Phase 3: User Story 1 - See blocks instead of turnovers (Priority: P1) 🎯 MVP

**Goal**: The pane shows a rated BLK column where TOV was, and turnovers are no longer shown or rated.

**Independent Test**: 2015-16, pin Golden State: BLK column present between STL and PER, no TOV; Draymond Green 1.4 and Andrew Bogut 1.6 purple, Stephen Curry 0.2 yellow.

- [X] T002 [US1] In `src/components/statRating.ts`, change `RatedStat` to `'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'per'`; in `STAT_BREAKPOINTS` replace the `tov` entry with `blk: { low: 0.2, high: 0.6, elite: 1.0 }` (placed after `stl`); remove the `lowerIsBetter` field from the `Breakpoints` type and the `if (lowerIsBetter) { … }` branch from `statRating`, since every stat is now higher-is-better
- [X] T003 [US1] In `src/components/statRating.test.ts`, replace the `'treats fewer turnovers as better'` test with a blocks test: `blk` 0.1 → `'poor'`, 0.2 → `'fair'`, 0.5 → `'fair'`, 0.6 → `'good'`, 0.9 → `'good'`, 1.0 → `'elite'`, 1.6 → `'elite'`
- [X] T004 [US1] In `src/components/RosterPane.tsx` `STAT_COLUMNS`, replace the TOV column with `{ label: 'BLK', title: 'Blocks per game', value: (p) => decimal(p.blk), rated: 'blk' }` in the same position (after STL, before PER)
- [X] T005 [US1] In `src/components/RosterPane.tsx` `RatingKey`, remove the `Fewer turnovers rate higher.` sentence from `description` (the full new text is set in T010)
- [X] T006 [US1] In `src/components/RosterPane.test.tsx`, update expectations for the BLK swap: Pierce's row value `'2.9'` → `'0.5'`; Scrub's row `'1.5'` → `'0.5'`; Pierce's ratings array fifth entry `'poor'` → `'fair'`; key accessible name no longer ends with the turnovers sentence; add an assertion that `columnheader` `BLK` has `title` `'Blocks per game'` and that no `TOV` columnheader exists (`queryByRole('columnheader', { name: 'TOV' })` is null)

**Checkpoint**: `npm test` passes; BLK replaces TOV in the pane.

---

## Phase 4: User Story 2 - See minutes per game (Priority: P1)

**Goal**: Each row shows minutes per game, one decimal, right after G, uncolored.

**Independent Test**: 2015-16, pin Golden State: MIN column after G; Stephen Curry shows 34.2.

- [X] T007 [US2] In `src/components/RosterPane.tsx` `STAT_COLUMNS`, insert `{ label: 'MIN', title: 'Minutes per game', value: (p) => decimal(p.mpg) }` directly after the `G` column, with no `rated`
- [X] T008 [US2] In `src/components/RosterPane.test.tsx`, insert the MIN value after games in the row expectations (Pierce `'35.9'` after `'80'`; Scrub `'20.0'` after `'3'`), change the ratings helper's `.slice(4)` to `.slice(5)` and the `getAllByRole('cell')[4]` elite-class check to index `[5]`, and add a `columnheader` `MIN` assertion with `title` `'Minutes per game'`

**Checkpoint**: `npm test` passes; MIN column shown.

---

## Phase 5: User Story 3 - Gray out players too small a sample to rate (Priority: P2)

**Goal**: Rated stat cells of players under 10 games or 10 minutes per game are `text-muted-foreground`; qualifying players are unchanged.

**Independent Test**: 2015-16, pin Golden State: Kevon Looney's PTS–PER gray, his name/Pos/Age/G/MIN normal; Curry colored.

- [X] T009 [US3] In `src/components/statRating.ts`, export `isRatable(player: RosterEntry): boolean` returning `player.g >= MIN_RATED_GAMES && player.mpg >= MIN_RATED_MINUTES` (with a one-sentence doc comment), and make `statRating` return `undefined` when `!isRatable(player)` instead of repeating the comparison
- [X] T010 [US3] In `src/components/RosterPane.tsx`, in the cell map compute `const unrated = column.rated && !isRatable(player)`; set `data-rating={unrated ? 'unrated' : rating}` and add `unrated && 'text-muted-foreground'` to the cell's `cn(...)` (fixed class, not built from a variable). Pos, Age, G, MIN and the Player cell never get the gray class. Set the `RatingKey` description to `` `Stat colors, lowest to highest: ${…bands…}. Players under ${MIN_RATED_GAMES} games or ${MIN_RATED_MINUTES} minutes per game are gray and not rated.` ``, importing the constants from `./statRating`
- [X] T011 [P] [US3] In `src/components/statRating.test.ts`, add `isRatable` tests: `g: 9` → false; `mpg: 9.9` → false; `mpg: 9.96` → false; `g: 10, mpg: 10` → true
- [X] T012 [US3] In `src/components/RosterPane.test.tsx`, rename the coloring test to "colors stats for regular players and grays out small samples"; expect Scrub's ratings to be six `'unrated'` and each of his rated cells (indices 5–10, including the `–` PER) to have class `text-muted-foreground`; expect Scrub's cells 0–4 and all of Pierce's cells not to have `text-muted-foreground`; set the key accessible name expectation to `'Stat colors, lowest to highest: red 25%, yellow 50%, green 15%, purple 10%. Players under 10 games or 10 minutes per game are gray and not rated.'`

**Checkpoint**: `npm test` passes; small samples are gray.

---

## Phase 6: Polish & Cross-Cutting

- [X] T013 Run `npm run lint`, `npm test` and `npm run build`; fix any failures
- [X] T014 Run the manual checks in `specs/019-roster-blocks-minutes/quickstart.md` with the `dev` server from `.claude/launch.json` (column order, Curry/Green/Bogut/Looney values and colors, phone width without page scroll, gray distinguishable from yellow in light and dark themes)

---

## Dependencies & Execution Order

- T001 first.
- US1 (T002–T006) → US2 (T007–T008) → US3 (T009–T012): all edit `RosterPane.tsx` and `RosterPane.test.tsx`, and US2/US3 test edits assume the US1 column layout, so run in order.
- Within US1: T002 before T003 and T004; T004–T005 before T006.
- Within US3: T009 before T010 and T011; T010 before T012.
- T013–T014 after all stories.

## Parallel Opportunities

- T011 (`statRating.test.ts`) can run alongside T010/T012 (`RosterPane.*`) once T009 is done.
- Otherwise the change is small and file-overlapping; run sequentially.

## Implementation Strategy

- **MVP**: US1 alone (blocks replace turnovers) is shippable.
- **Increment 2**: US2 adds MIN, which makes the 10-minute cutoff visible.
- **Increment 3**: US3 grays non-qualifying players, relying on MIN being shown to explain why.
- Do not run `npm run build:summaries` or `scripts/build-summaries.mjs` (forbidden: spends API tokens).

---

## Follow-up: Sort by minutes played (FR-010)

- [X] T015 In `scripts/lib/rosters.mjs` `teamRosters`, sort by minutes per game (`mpg`), then games, then name, drop the now-unused season `minutes` lookup, and update its doc comment
- [X] T016 In `scripts/lib/rosters.test.mjs`, change the sort test to expect minutes first, games as the tie-break, then name
- [X] T017 Run `npm run build:rankings` to regenerate `data/processed/seasons/*.json`; confirm only roster order changed
