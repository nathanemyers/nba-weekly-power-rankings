---

description: "Task list for Team Roster Stats"
---

# Tasks: Team Roster Stats

**Input**: Design documents from `/specs/017-team-roster-stats/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The plan and quickstart call for fixture-based parser tests, loader tests and a component test, matching how `scripts/lib/playoffs.test.mjs` and `src/components/PlayoffSeriesBadges.test.tsx` cover the previous feature.

**Organization**: Tasks are grouped by user story. Phase 8 (US5, stat colors) was added after the first implementation. User Story 4 (the data) blocks the others, so its phase comes first after Foundational even though it is listed last in the spec.

**Forbidden**: Never run `npm run build:summaries` or `scripts/build-summaries.mjs` (they spend API tokens). `npm run build:rankings` is fine.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 roster pane, US2 mid-season moves, US3 head coaches, US4 scraped data, US5 stat colors

## Code rules that apply to every UI task (from AGENTS.md)

No `useMemo`, minimal `useEffect`, no `useRef` for state, Tailwind utility classes only, colors only from `src/index.css`, shadcn/ui components from `src/components/ui/` (never edit generated files), no Tailwind class names built from variables, comments at most one sentence, no `Map`/`Set`.

---

## Phase 1: Setup

**Purpose**: Wire up the new script and UI component

- [X] T001 Add `"scrape:rosters": "node scripts/scrape-rosters.mjs"` to the `scripts` block of package.json, next to `scrape:playoffs`
- [X] T002 [P] Run `npx shadcn@latest add table` to generate src/components/ui/table.tsx; do not edit the generated file

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Page parsers shared by every story. Spec: [contracts/raw-rosters.md](contracts/raw-rosters.md), [research.md](research.md) R3, R4, R9

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Write failing parser tests in scripts/lib/rosters.test.mjs (Vitest, same style as scripts/lib/playoffs.test.mjs: small inline HTML built by helper functions). Cover: `slugForAbbr` maps `NJN`/`BRK`→`bkn`, `CHA`/`CHO`→`cha`, `NOH`/`NOK`/`NOP`→`nop`, `SEA`/`OKC`→`okc`, `PHO`→`phx`, `TOR`→`tor`, and throws on `XYZ`; `parseStatsTable(html, 'per_game_stats')` returns one object per row that has `data-append-csv`, with `playerId` from that attribute, every `data-stat` cell as a key, numeric text parsed as numbers (`.465`→`0.465`, `30.1`→`30.1`), blank cells as `null`, `name_display`/`pos`/`team_name_abbr` as strings; skips header-repeat and "League Average" rows; ignores a following `per_game_stats_post` table; finds a table wrapped in `<!-- -->`; `parseCoachesTable(html)` returns rows in page order with `coachId` from `/coaches/{id}.html` (for example `hoibefr99c`), `coach` name, `team` abbreviation from the `/teams/{ABBR}/` link, and numeric `cur_g`/`cur_w`/`cur_l` (fixture: Fred Hoiberg CHI 24/5/19, then Jim Boylen CHI 58/17/41)
- [X] T004 Create scripts/lib/rosters.mjs with a one-line header comment, `SLUG_BY_ABBR` (every Basketball-Reference abbreviation to an app slug from src/types/nba.ts: the upper-case slug for the 24 unchanged teams plus `BRK`, `NJN`, `CHA`, `CHO`, `CHH`, `NOH`, `NOK`, `NOP`, `SEA`, `OKC`, `PHO`) and `slugForAbbr(abbr)` that throws `Unknown team abbreviation on Basketball-Reference: "<abbr>"`
- [X] T005 Add `parseStatsTable(html, tableId)` to scripts/lib/rosters.mjs: strip `<!--` and `-->`, slice from `id="<tableId>"` to the next `</table>`, read each `<tr>` with `data-append-csv`, and return rows as specified in T003; throw if the table is missing or has no player rows
- [X] T006 Add `parseCoachesTable(html)` to scripts/lib/rosters.mjs: slice the `id="NBA_coaches"` table, keep every `data-stat` cell (numbers parsed, blanks `null`), add `coachId` and `team`, skip rows without a `/coaches/` link, throw if no rows. Run `npm test -- scripts/lib/rosters.test.mjs` until T003 passes

**Checkpoint**: Parsers pass their fixture tests

---

## Phase 3: User Story 4 - Roster and coaching data for every season (Priority: P1)

**Goal**: Raw per-game, advanced and coach data for 2003-04 to 2025-26 saved under data/raw/basketball-reference/rosters/

**Independent Test**: Run `npm run scrape:rosters`; 23 files appear, each with non-empty `perGame`, `advanced` and `coaches`. Re-running fetches nothing.

- [X] T007 [US4] Create scripts/scrape-rosters.mjs modelled on scripts/scrape-playoffs.mjs: header comment naming the output folder and flags; seasons `FIRST_END_YEAR = 2004` to `LAST_END_YEAR = 2026` named `${endYear - 1}-${yy}`; for each season fetch `https://www.basketball-reference.com/leagues/NBA_{endYear}_per_game.html`, `..._advanced.html` and `..._coaches.html` with `fetchTextWithRetry` from scripts/lib/http.mjs; `sleep(3000)` from the same module before every request after the first; write `{ season, source: { perGame, advanced, coaches }, perGame, advanced, coaches }` to data/raw/basketball-reference/rosters/{season}.json (2-space indent, trailing newline) right after each season; skip seasons whose file exists unless `--force`, and with `--season 2025-26` fetch only that season (always re-fetching it); log each URL fetched and a final count
- [X] T008 [US4] Run `npm run scrape:rosters` (about 3.5 minutes, 69 requests). Confirm 23 files in data/raw/basketball-reference/rosters/, spot-check that 2018-19 `perGame` has `gasolma01` rows in the order `2TM`, `MEM`, `TOR` and `coaches` has Hoiberg before Boylen for `CHI`, then re-run and confirm it fetches nothing

**Checkpoint**: Raw data is on disk and ready to commit

---

## Phase 4: User Story 1 - See who played for a team that season (Priority: P1) 🎯 MVP

**Goal**: With one team pinned, a pane under the chart lists every player who appeared for it that regular season, ordered by games played. Spec: [contracts/season-rosters.md](contracts/season-rosters.md), [contracts/roster-pane.md](contracts/roster-pane.md), [data-model.md](data-model.md)

**Independent Test**: 2015-16, pin Golden State: Curry shows 79 G, 30.1 PTS, 5.4 REB, 6.7 AST, 2.1 STL, 3.3 TOV, PER 31.5, and the list is ordered by G. Unpin or pin a second team and the pane disappears.

### Tests for User Story 1

- [X] T009 [US1] Add failing `teamRosters` tests to scripts/lib/rosters.test.mjs: builds `{ [slug]: RosterEntry[] }` from a raw season object with fields `id`, `name`, `pos`, `age`, `g`, `gs`, `mpg`, `pts`, `trb`, `ast`, `stl`, `blk`, `tov`, `per` taken from per-game `playerId`, `name_display`, `pos`, `age`, `games`, `games_started`, `mp_per_g`, `pts_per_g`, `trb_per_g`, `ast_per_g`, `stl_per_g`, `blk_per_g`, `tov_per_g` and advanced `per` (matched on `playerId` + `team_name_abbr`); ignores `2TM`/`3TM` rows; sorts by `g` descending, then advanced `mp` descending, then `name` ascending; keeps `per: null` when blank; throws naming season, team and player when a stint has no advanced row, when `g < 1`, when `gs > g`, or when a per-game value is negative (`per` may be negative)
- [X] T010 [P] [US1] Add a test to src/store/slices/seasons/loadSeasons.test.ts that a season with a `rosters` field puts each team's array on `TeamRankings.roster`, and one that a roster entry with `g: 0` makes the season invalid instead of throwing
- [X] T011 [P] [US1] Create src/components/RosterPane.test.tsx (Testing Library, same setup as src/components/PlayoffSeriesBadges.test.tsx): with one pinned team it renders the heading "{Team name} roster, {season}" and one row per entry in data order, shows `–` for `per: null`, formats per-game values to one decimal; with zero or two pinned teams, or an empty/missing roster, it renders nothing

### Implementation for User Story 1

- [X] T012 [US1] Implement `teamRosters(raw, season)` in scripts/lib/rosters.mjs to pass T009 (no `joinedFrom`/`leftFor` yet; that is US2)
- [X] T013 [US1] Update scripts/build-rankings.mjs: read data/raw/basketball-reference/rosters/{season}.json when it exists, call `teamRosters`, throw `${season} ${slug}: no roster` for any team in `rankings` without one, and add `...(Object.keys(rosters).length && { rosters })` to `output`
- [X] T014 [P] [US1] In src/schemas/season.ts add `RosterEntrySchema` exactly as in contracts/season-rosters.md without `joinedFrom`/`leftFor` (`id: z.string().min(1)`, `name: z.string().min(1)`, `pos: z.string()`, `age: z.int().min(15).max(50)`, `g: z.int().min(1)`, `gs: z.int().min(0)`, `mpg`/`pts`/`trb`/`ast`/`stl`/`blk`/`tov`: `z.number().min(0)`, `per: z.number().nullable()`), add `rosters: z.partialRecord(z.enum(Team), z.array(RosterEntrySchema)).optional()` to `SeasonDataSchema`, and export `type RosterEntry = z.infer<typeof RosterEntrySchema>`
- [X] T015 [US1] In src/types/nba.ts re-export `RosterEntry` and add `roster?: RosterEntry[]` to `TeamRankings`; in src/store/slices/seasons/loadSeasons.ts set `roster: data.rosters?.[team.teamId]`. Make T010 pass
- [X] T016 [US1] Add `getPinnedTeamRoster(state)` to src/store/slices/chart/chart.ts (export it from src/store/slices/chart/index.ts): returns the single pinned team's `roster` in the selected season from `state.seasons`, or `undefined`; add a case to src/store/slices/chart/chart.test.ts
- [X] T017 [US1] Create src/components/RosterPane.tsx per contracts/roster-pane.md: reads `getSinglePinnedTeam`, `getSelectedSeason` and `getPinnedTeamRoster`; returns `null` when there is no roster; renders a heading and a shadcn `Table` with columns Player, Pos, Age, G, PTS, REB, AST, STL, TOV, PER, header cells with `title` giving the full stat name ("Points per game" etc.), numbers with `toFixed(1)`, `–` for null PER, and a sticky first column so the table scrolls inside its wrapper on narrow screens. Make T011 pass
- [X] T018 [US1] Render `<RosterPane />` in src/views/ChartView.tsx below the button-group row, inside the `data ? …` branch
- [X] T019 [US1] Run `npm run build:rankings`, then add an assertion to src/store/realData.test.ts that every team in every loaded season has a non-empty `roster`, and run `npm test`

**Checkpoint**: MVP: roster pane works for every season

---

## Phase 5: User Story 2 - See who joined or left mid-season (Priority: P2)

**Goal**: Players who arrived or left mid-season carry a mark naming the other team

**Independent Test**: 2018-19 Toronto: Gasol marked "Joined from Memphis Grizzlies mid-season", Valančiūnas marked "Left for Memphis Grizzlies mid-season". 2003-04 Detroit: Rasheed Wallace "Joined from Atlanta Hawks mid-season".

### Tests for User Story 2

- [X] T020 [US2] Add failing tests to scripts/lib/rosters.test.mjs: for stints `[A, B, C]` in page order, A gets `leftFor: B`, B gets `joinedFrom: A, leftFor: C`, C gets `joinedFrom: B`; a single-stint player has neither; fixtures for Gasol (`2TM`, `MEM`, `TOR`), Valančiūnas (`2TM`, `TOR`, `MEM`) and Wallace (`3TM`, `POR`, `ATL`, `DET`); throws naming season and player when stint games do not add up to the `nTM` row's games
- [X] T021 [P] [US2] Add cases to src/components/RosterPane.test.tsx: a row with `joinedFrom: 'mem'` exposes the accessible name "Joined from Memphis Grizzlies mid-season", a row with `leftFor` exposes "Left for … mid-season", a row with both shows both, a row with neither shows no mark

### Implementation for User Story 2

- [X] T022 [US2] Extend `teamRosters` in scripts/lib/rosters.mjs to set `joinedFrom`/`leftFor` (app slugs via `slugForAbbr`) from per-game stint order and to run the `nTM` games check. Make T020 pass
- [X] T023 [P] [US2] Add `joinedFrom: z.enum(Team).optional()` and `leftFor: z.enum(Team).optional()` to `RosterEntrySchema` in src/schemas/season.ts
- [X] T024 [US2] In src/components/RosterPane.tsx add move marks next to the player name: lucide `LogIn` for `joinedFrom` and `LogOut` for `leftFor`, each a focusable element wrapped in the shadcn `Tooltip` from src/components/ui/tooltip.tsx, with `aria-label` and tooltip text "Joined from {getTeamName(joinedFrom)} mid-season" / "Left for {getTeamName(leftFor)} mid-season", colored only with theme classes. Make T021 pass
- [X] T025 [US2] Run `npm run build:rankings` and `npm test`

**Checkpoint**: US1 and US2 both work

---

## Phase 6: User Story 3 - See who coached the team that season (Priority: P2)

**Goal**: The roster pane names the season's head coach or coaches, in order, with records

**Independent Test**: 2018-19 Chicago shows "Head coaches: Fred Hoiberg (5-19) → Jim Boylen (17-41)"; Toronto shows "Head coach: Nick Nurse (58-24)".

### Tests for User Story 3

- [X] T026 [US3] Add failing `teamCoaches` tests to scripts/lib/rosters.test.mjs: returns `{ [slug]: [{ id, name, g, w, l }] }` from raw `coaches` (`coachId`, `coach`, `cur_g`, `cur_w`, `cur_l`) in page order; maps `team` with `slugForAbbr`; throws naming season and team when `g < 1`, when `w + l !== g`, or when a team's stints add up to more than 82 games
- [X] T027 [P] [US3] Add cases to src/components/RosterPane.test.tsx: one coach renders "Head coach: Nick Nurse (58-24)"; two render "Head coaches: Fred Hoiberg (5-19) → Jim Boylen (17-41)" in order with the arrow's accessible text "then"; no coaches renders no coach line

### Implementation for User Story 3

- [X] T028 [US3] Implement `teamCoaches(raw, season)` in scripts/lib/rosters.mjs. Make T026 pass
- [X] T029 [US3] Update scripts/build-rankings.mjs to call `teamCoaches`, throw `${season} ${slug}: no head coach` for any team in `rankings` without one, and add `...(Object.keys(coaches).length && { coaches })` to `output`
- [X] T030 [P] [US3] In src/schemas/season.ts add `CoachStintSchema` (`id: z.string().min(1)`, `name: z.string().min(1)`, `g: z.int().min(1)`, `w: z.int().min(0)`, `l: z.int().min(0)`), add `coaches: z.partialRecord(z.enum(Team), z.array(CoachStintSchema)).optional()` to `SeasonDataSchema`, and export `type CoachStint`
- [X] T031 [US3] In src/types/nba.ts re-export `CoachStint` and add `coaches?: CoachStint[]` to `TeamRankings`; in src/store/slices/seasons/loadSeasons.ts set `coaches: data.coaches?.[team.teamId]`; add `getPinnedTeamCoaches(state)` to src/store/slices/chart/chart.ts and export it from src/store/slices/chart/index.ts
- [X] T032 [US3] In src/components/RosterPane.tsx render the coach line under the heading per contracts/roster-pane.md. Make T027 pass
- [X] T033 [US3] Run `npm run build:rankings`, add an assertion to src/store/realData.test.ts that every team in every loaded season has at least one coach, and run `npm test`

**Checkpoint**: All four stories work

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T034 [P] Update README.md's data paragraph (the one listing `scrape:playoffs`) to describe `npm run scrape:rosters`, its `--season` and `--force` flags, and that it fills data/raw/basketball-reference/rosters/
- [X] T035 Check the pane at 375 px wide and in dark mode in the browser preview: no horizontal page scroll, player column stays visible while the table scrolls, marks and text readable
- [X] T036 Run `npm run build` and record the size of dist/assets before and after this feature in research.md R5 under a "Measured" line
- [X] T037 Run `npm run lint`, `npm test` and `npm run build`; all must pass
- [X] T038 Run every spot check in quickstart.md section 4 against the running app and fix any mismatch

---

## Phase 8: User Story 5 - See at a glance who stood out (Priority: P3)

**Goal**: Color six stats red, yellow or green against fixed league-wide breakpoints. Spec: [contracts/roster-pane.md](contracts/roster-pane.md) "Stat colors", [research.md](research.md) R10

**Independent Test**: 2015-16 Golden State: Curry's PTS, AST, STL and PER green, REB yellow, TOV red; Kevon Looney (5 games) uncolored.

- [X] T039 [P] [US5] Add `--stat-good`, `--stat-fair`, `--stat-poor` to `:root` and `--color-stat-*` to `@theme inline` in src/index.css, and document them in docs/styling.md's site-specific table
- [X] T040 [P] [US5] Write failing tests in src/components/statRating.test.ts: cut edges (5.9 poor, 6 fair, 13.4 fair, 13.5 good for points), reversed turnovers, negative PER, `per: null` unrated, and players under 10 games or 10 minutes per game unrated
- [X] T041 [US5] Create src/components/statRating.ts with `STAT_BREAKPOINTS` (pts 6/13.5, trb 2.5/5.5, ast 1/3, stl 0.5/1, tov 0.9/1.8 with `lowerIsBetter`, per 11/17), `MIN_RATED_GAMES = 10`, `MIN_RATED_MINUTES = 10` and `statRating(player, stat)`. Make T040 pass
- [X] T042 [US5] In src/components/RosterPane.tsx add `rated` to the six stat columns, apply `text-stat-good`/`text-stat-fair`/`text-stat-poor` through a fixed lookup with `data-rating` on each rated cell, and add the explanatory note under the table; add a test to src/components/RosterPane.test.tsx for a qualified and an unqualified player
- [X] T043 [US5] Check the colors in the browser preview, then run `npm run lint`, `npm test` and `npm run build`

---

## Phase 9: User Story 2 revision - Move badges

**Goal**: Replace the move icons (T024) with team logo badges right-aligned in the Player cell. Spec: FR-008, [contracts/roster-pane.md](contracts/roster-pane.md) "Move mark"

- [X] T044 [US2] In src/components/RosterPane.tsx render each move as an outline shadcn `Badge` (`role="img"`, focusable, same `aria-label` and tooltip text) holding lucide `ArrowLeft` (joined) or `ArrowRight` (left) followed by `TeamLogo` for the other team; lay the Player cell out as a `justify-between` row so the badges sit at its right edge
- [X] T045 [US2] Add a test to src/components/RosterPane.test.tsx for arrow direction, the other team's logo after the arrow, and the right-aligned layout; check in the browser preview and run `npm run lint`, `npm test` and `npm run build`
- [X] T046 [US2] Add `--move-joined` (green) and `--move-left` (red) to src/index.css and docs/styling.md; color the badge arrow with `text-move-joined` / `text-move-left`
- [X] T047 [US2] Render each move badge as a button (`Badge asChild`) that dispatches `setPinnedTeams([team])` on click; add tests to src/components/RosterPane.test.tsx for the arrow color classes and for clicking a badge pinning the other team

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks everything else
- **US4 (Phase 3)**: after Foundational; blocks US1, US2, US3 because they need the raw files
- **US1 (Phase 4)**: after US4
- **US2 (Phase 5)**: after US1 (extends `teamRosters`, `RosterEntrySchema` and `RosterPane`)
- **US3 (Phase 6)**: after US1 (adds to `RosterPane` and `build-rankings.mjs`); independent of US2, but both edit src/components/RosterPane.tsx, src/schemas/season.ts and scripts/lib/rosters.mjs, so run them one after the other
- **Polish (Phase 7)**: after the stories you ship
- **US5 (Phase 8)**: after US1; touches src/components/RosterPane.tsx, so not alongside US2 or US3

### Within Each Story

Tests first and failing, then build script, then schema and loader, then selector, then component, then data rebuild.

### Parallel Opportunities

- T002 alongside T001
- In US1: T010 and T011 alongside T009; T014 alongside T012/T013
- In US2: T021 alongside T020; T023 alongside T022
- In US3: T027 alongside T026; T030 alongside T028/T029
- T034 alongside T035

---

## Parallel Example: User Story 1

```bash
# Tests in separate files, written together:
Task: "teamRosters tests in scripts/lib/rosters.test.mjs"          # T009
Task: "roster loading tests in src/store/slices/seasons/loadSeasons.test.ts"  # T010
Task: "RosterPane tests in src/components/RosterPane.test.tsx"     # T011

# Script and schema in separate files:
Task: "teamRosters in scripts/lib/rosters.mjs"                     # T012
Task: "RosterEntrySchema in src/schemas/season.ts"                 # T014
```

---

## Implementation Strategy

### MVP First

1. Phases 1–3: setup, parsers, scrape the raw data
2. Phase 4 (US1): roster pane
3. **Stop and validate** with the US1 independent test, then commit raw and processed data with the code

### Incremental Delivery

1. MVP (US4 + US1)
2. US2: mid-season move marks
3. US3: head coaches
4. Polish

---

## Notes

- Commit raw files in data/raw/basketball-reference/rosters/ and regenerated data/processed/seasons/ with the code (constitution II).
- Never import from data/raw/ in src/ (constitution IV).
- Bundle growth is expected (research R5); if it is a problem, the fallback is per-season lazy roster files, which is a separate change.
