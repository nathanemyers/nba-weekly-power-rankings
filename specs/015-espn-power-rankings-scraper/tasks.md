# Tasks: ESPN Power Rankings Scraper (2003-04 to 2015-16)

**Input**: Design documents from `/specs/015-espn-power-rankings-scraper/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/cli.md](contracts/cli.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan and quickstart call for Vitest unit tests (`*.test.mjs` next to each module, like `scripts/lib/summary-plan.test.mjs`) using **synthetic** HTML fixtures shaped like ESPN's markup. Never paste real ESPN page text into a fixture.

**Organization**: Grouped by user story. US4 (raw data move) comes before US1 even though both are P1, because the plan has it land first as its own commit.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: The user story the task belongs to (US1 to US4)

## Rules for every task (from AGENTS.md and the constitution)

- Plain JavaScript `.mjs` ES modules, Node built-ins only. No new dependencies.
- No `Map` or `Set`. Use plain objects and arrays.
- Comments are one sentence at most. Match the style of `scripts/nba-power-rankings-scraper/*.mjs` (2-space indent, single quotes, no semicolons).
- **Never run `npm run build:summaries` or `scripts/build-summaries.mjs`**, not even with `--dry-run`.
- Only send real requests to ESPN in the tasks that say so (T030, T031, T034). The full run (T034) needs the user's approval first.

---

## Phase 1: Setup

**Purpose**: Create the new scraper's folder and npm entry point.

- [X] T001 Create the folder `scripts/espn-power-rankings-scraper/`, and add `"scrape:espnPowerRankings": "node scripts/espn-power-rankings-scraper/cli.mjs"` to `scripts` in `package.json`, right after `"scrape:powerRankings"`.

---

## Phase 2: Foundational (shared helpers)

**Purpose**: Move source-independent helpers to `scripts/lib/` so both scrapers share them ([research §6, §7, §9](research.md)). This blocks the ESPN work (US1).

- [X] T002 `git mv scripts/nba-power-rankings-scraper/http.mjs scripts/lib/http.mjs` and `git mv scripts/nba-power-rankings-scraper/htmlToText.mjs scripts/lib/htmlToText.mjs`. Update the imports in `scripts/nba-power-rankings-scraper/articlePage.mjs`, `contentApi.mjs` and `scrape.mjs` from `./http.mjs` / `./htmlToText.mjs` to `../lib/http.mjs` / `../lib/htmlToText.mjs`. Check with `node -e "import('./scripts/nba-power-rankings-scraper/scrape.mjs')"`.
- [X] T003 In `scripts/lib/http.mjs`:
  - Every `fetch` sends `headers: { 'User-Agent': 'nba-weekly-power-rankings (personal project)' }`, the same string as `USER_AGENT` in `scripts/scrape-playoffs.mjs`.
  - Add an `allowRedirect` option to `fetchTextWithRetry(url, { retries = 3, baseDelayMs = 1000, allowRedirect = true } = {})`. When it is `false`, call `fetch(url, { redirect: 'manual', headers })`. A response with status 300-399 resolves to `null` immediately and is never retried. `fetchJsonWithRetry` passes `opts` through unchanged.
- [X] T004 [P] In `scripts/lib/htmlToText.mjs`, decode numeric entities in the range 128-159 (`&#128;`-`&#159;`, decimal or hex) as Windows-1252, e.g. `&#133;` → `…`, `&#145;` → `‘`, `&#146;` → `’`, `&#147;` → `“`, `&#148;` → `”`, `&#150;` → `–`, `&#151;` → `—`. Use a plain object keyed by code point, covering the full Windows-1252 0x80-0x9F table. Leave all other behaviour unchanged.
- [X] T005 [P] Create `scripts/lib/htmlToText.test.mjs` (Vitest) covering:
  - `<p>`/`<br>`/`<li>` line breaks and `- ` bullets
  - named entities (`&amp;`, `&nbsp;`)
  - decimal and hex entities
  - the Windows-1252 cases from T004 (`'a&#133;b'` → `'a…b'`, `'&#146;'` → `'’'`)

**Checkpoint**: `npm test` passes, and `node scripts/nba-power-rankings-scraper/cli.mjs --help` still prints usage.

---

## Phase 3: User Story 4 - Each raw data source gets its own folder (Priority: P1)

**Goal**: NBA.com data in `data/raw/nba/`, playoffs in `data/raw/basketball-reference/playoffs.json`, every reader and writer updated, processed output byte-identical (FR-015 to FR-018, SC-006).

**Independent Test**: `npm run build:rankings && git status --short data/processed` prints nothing, and `ls data/raw` shows only source folders.

- [X] T006 [US4] Run `mkdir -p data/raw/nba data/raw/basketball-reference`, then `git mv data/raw/index.json data/raw/nba/index.json`, `git mv data/raw/articles data/raw/nba/articles` and `git mv data/raw/playoffs.json data/raw/basketball-reference/playoffs.json`. Don't change any file contents.
- [X] T007 [P] [US4] In `scripts/build-rankings.mjs`, replace `const rawDir = join(root, 'data', 'raw')` with `const nbaDir = join(root, 'data', 'raw', 'nba')` and `const playoffsFile = join(root, 'data', 'raw', 'basketball-reference', 'playoffs.json')`. Read `PLAYOFFS` from `playoffsFile` and call `loadSeasonEntries(nbaDir)`. Rename any other `rawDir` uses to match.
- [X] T008 [P] [US4] Make the same change in `scripts/build-summaries.mjs`: `nbaDir`, `playoffsFile`, `loadSeasonEntries(nbaDir)`, and `playoffs` read from `playoffsFile`. Change paths only. **Do not run this script.**
- [X] T009 [P] [US4] In `scripts/scrape-playoffs.mjs`, change `outFile` to `join(root, 'data', 'raw', 'basketball-reference', 'playoffs.json')`, add `mkdirSync(dirname(outFile), { recursive: true })` before the write if it isn't there, and change the header comment to say `data/raw/basketball-reference/playoffs.json`.
- [X] T010 [P] [US4] In `scripts/nba-power-rankings-scraper/cli.mjs`, change the default out folder to `path.join(root, 'data', 'raw', 'nba')` and the help line to `(default: data/raw/nba)`. In `scripts/nba-power-rankings-scraper/README.md`, change every `data/raw` to `data/raw/nba` (intro sentence, `--out` example, option list, output tree).
- [X] T011 [P] [US4] Change the comment on line 1 of `scripts/lib/articles.mjs` to say `/data/raw/nba`, and update the `data/raw/` and `data/raw/playoffs.json` references in the root `README.md` to `data/raw/nba/` and `data/raw/basketball-reference/playoffs.json`.
- [X] T012 [US4] Check the move:
  - `grep -rn "data', 'raw'\|data/raw" scripts README.md` lists only new-style paths
  - `ls data/raw` shows `basketball-reference  nba`
  - `npm run build:rankings && git status --short data/processed` prints nothing
  - `npm test` passes

  If `data/processed` changed, stop and fix the paths. Then commit only the US4 changes and the Phase 2 shared-helper changes with the message `Move raw data into per-source folders`.

**Checkpoint**: Existing pipeline works from the new locations. US1 can begin.

---

## Phase 4: User Story 1 - Collect every ESPN weekly edition, 2003-04 to 2015-16 (Priority: P1) 🎯 MVP

**Goal**: A default run fetches every edition and writes `data/raw/espn/articles/<season>/<slug>.json` plus `data/raw/espn/index.json`, printing progress and a fetched/missing/failed summary (FR-001, FR-002, FR-004 to FR-008, FR-010 to FR-012, FR-014).

**Independent Test**: The `editionPage`, `seasonPage` and `teams` unit tests pass, and `node scripts/espn-power-rankings-scraper/cli.mjs --out <scratch dir>` produces files that match [data-model.md](data-model.md).

### Tests for User Story 1

- [X] T013 [P] [US1] Create `scripts/espn-power-rankings-scraper/teams.test.mjs`:
  - `resolveTeamId({ espnAbbr: 'lal', teamName: 'Los Angeles' })` → `1610612747`
  - `{ espnAbbr: 'lac', teamName: 'LA' }` → `1610612746`
  - `{ espnAbbr: null, teamName: 'NO/Oklahoma City' }` → `1610612740`
  - `{ espnAbbr: null, teamName: 'Seattle' }` → `1610612760`
  - `{ espnAbbr: null, teamName: 'New Jersey' }` → `1610612751`
  - `{ espnAbbr: null, teamName: 'Charlotte' }` → `1610612766`
  - `{ espnAbbr: 'utah', teamName: 'Utah' }` → `1610612762`
  - `{ espnAbbr: null, teamName: 'Nowhere' }` → `null`
- [X] T014 [P] [US1] Create `scripts/espn-power-rankings-scraper/editionPage.test.mjs` with a synthetic fixture string that follows the markup in [research §4](research.md#4-page-structure-stable-from-2003-04-to-2015-16):
  - `<h1 class="h2">Headline</h1>`
  - `<div class="date"><span>Updated:</span> January 7, 2008, 11:52 AM ET</div>`
  - `<cite class="source"> By <a href="x"> Marc Stein</a> | ESPN.com</cite>`
  - `<table class="tablehead">` with a `<tr class="stathead"><td colspan=5>2007-08 Power Rankings: Week 10</td></tr>`, a `colhead` row, and three `oddrow`/`evenrow` team rows:
    - (a) a linked team: `<a href="https://www.espn.com/nba/team/_/name/bos/boston-celtics">Boston</a><br/><span class="pr-record">29-3</span>` with `<span class="pr-last">Last Week: 2</span>`
    - (b) an unlinked team: `<div style="padding:10px 0;">New Orleans<br/><span class="pr-record">23-11</span></div>`
    - (c) a linked `lal` "Los Angeles" row with no `pr-last` span
  - Comment cells contain `<i>` and `&#133;`

  Assert that `parseEdition(html, { season: '2007-08', espnWeek: 10, url })` returns:
  - `title`, `heading`, `author: 'Marc Stein'` (trimmed), `updatedText: 'January 7, 2008, 11:52 AM ET'`
  - `week: 10`, `editionType: 'weekly'`, `slug: '2007-08-week-10'`
  - `rankings` sorted by rank, with `previousRank` 2 / null as appropriate
  - `teamId`, `espnAbbr`, `teamLink`, `record`, `summaryHtml`, and `summaryText` containing `…`
  - `hasStructuredRankings: true`

  Also assert that:
  - a page whose heading season is `2008-09` throws (season mismatch)
  - `espnWeek` 0 → `week: null, editionType: 'preseason', slug: '2007-08-preseason'`
  - `espnWeek` -1 → `editionType: 'training-camp', slug: '2007-08-training-camp'`
  - an unmatched team name produces `teamId: null` and is listed in the returned `warnings` array
- [X] T015 [P] [US1] Create `scripts/espn-power-rankings-scraper/seasonPage.test.mjs` with a synthetic default page whose heading is `2007-08 Power Rankings: Week 24`. Its week `<select class="tablesm">` has options `value="#"`, then `//www.espn.com/nba/powerrankings/_/year/2008/week/0`, `/week/1` … `/week/23`, plus a repeated `/week/0`. Add a second `tablesm` select for teams (`/nba/teams/powerranking?team=atl`) that must be ignored. Assert that `parseSeasonPage(html, 2008)` returns `{ finalWeek: 24, otherWeeks: [0, 1, …, 23] }` with no duplicates and ascending order. Add a 2013-style case with options `-1, -1, 0, 1…23, 17` and heading `Week 17` → `otherWeeks` is `[-1, 0, 1…16, 18…23]`. Also check that `parseSeasonPage` maps "Training Camp" and "Preseason" headings to `-1` and `0`.

### Implementation for User Story 1

- [X] T016 [P] [US1] Create `scripts/espn-power-rankings-scraper/teams.mjs` exporting `resolveTeamId({ espnAbbr, teamName })`, built on two plain objects:
  - `TEAM_IDS_BY_ABBR`:
    - atl 1610612737, bos 1610612738, bkn 1610612751, cha 1610612766
    - chi 1610612741, cle 1610612739, dal 1610612742, den 1610612743
    - det 1610612765, gs 1610612744, hou 1610612745, ind 1610612754
    - lac 1610612746, lal 1610612747, mem 1610612763, mia 1610612748
    - mil 1610612749, min 1610612750, no 1610612740, nor 1610612740
    - ny 1610612752, okc 1610612760, orl 1610612753, phi 1610612755
    - phx 1610612756, por 1610612757, sa 1610612759, sac 1610612758
    - tor 1610612761, utah 1610612762, wsh 1610612764
  - `TEAM_IDS_BY_UNLINKED_NAME`:
    - `'New Orleans'`: 1610612740
    - `'NO/Oklahoma City'`: 1610612740
    - `'New Jersey'`: 1610612751
    - `'Seattle'`: 1610612760
    - `'Charlotte'`: 1610612766

  Look up the abbreviation first, then the name, then return `null` (data-model "Team identity rules"). Makes T013 pass.
- [X] T017 [US1] Create `scripts/espn-power-rankings-scraper/editionPage.mjs`:
  - Export `parseEdition(html, { season, espnWeek, url })`, returning `{ edition, warnings }`, where `edition` has exactly the EspnEdition fields from [data-model.md](data-model.md) (`slug, url, title, heading, author, updatedText, season, espnWeek, week, editionType, hasStructuredRankings, rankings`).
  - Scope row parsing to the `<table class="tablehead"` … `</table>` block.
  - Read the heading from `tr.stathead`. Parse `rank` from `td.pr-rank`.
  - Get `espnAbbr` and `teamLink` from `/nba/team/_/name/<abbr>/` links, and `teamName` from the link text or the bare text before `<br/>`.
  - Parse `record` from `span.pr-record`. Parse `previousRank` from `Last Week: N`, or `null` when there is no such span.
  - Take `summaryHtml` from the last `<td>` (trimmed) and `summaryText` from `htmlToText(summaryHtml)` in `../lib/htmlToText.mjs`. Resolve `teamId` with `resolveTeamId`.
  - **Validation rules (from data-model.md, copy them exactly):**
    - "The season in `heading` must equal `season`. If not, treat the edition as failed."
    - "`rankings[].rank` values are unique, run from 1 to `rankings.length`, and are in order."

    Throw an `Error` naming the slug on any violation.
  - Fill `slug`, `week` and `editionType` from `espnWeek`: `-1` → `training-camp`, `0` → `preseason`, `>=1` → `weekly` with `week = espnWeek`. Push `unmatched team "<name>" in <slug>` to `warnings` for each `teamId: null`.

  Makes T014 pass.
- [X] T018 [US1] Create `scripts/espn-power-rankings-scraper/seasonPage.mjs` exporting:
  - `seasonLabel(endYear)` (2008 → `'2007-08'`)
  - `seasonUrl(endYear)` → `https://www.espn.com/nba/powerrankings/_/year/<endYear>`
  - `editionUrl(endYear, espnWeek)` → `https://www.espn.com/nba/powerrankings/_/year/<endYear>/week/<espnWeek>`
  - `parseSeasonPage(html, endYear)`, returning `{ finalWeek, otherWeeks }`. `finalWeek` comes from the `tr.stathead` heading: `Week N` → N, `Preseason` → 0, `Training Camp` → -1. `otherWeeks` is every `/year/<endYear>/week/<n>` option value, de-duplicated with a plain object, `finalWeek` removed, sorted ascending.

  Makes T015 pass.
- [X] T019 [US1] Create `scripts/espn-power-rankings-scraper/scrape.mjs` exporting `scrape({ fromEndYear, toEndYear, outDir, delayMs })`. For each season:
  - Log `Fetching <season> season page...`.
  - Fetch `seasonUrl` with `fetchTextWithRetry(url, { allowRedirect: false })` from `../lib/http.mjs`. If the result is `null`, count the season as missing and continue.
  - `parseSeasonPage`, then log `  <n> editions listed.`
  - Parse the season page itself as the final edition (`parseEdition` with `espnWeek: finalWeek`, `url: editionUrl(endYear, finalWeek)`).
  - For each of `otherWeeks`, `sleep(delayMs)`, fetch `editionUrl` with `allowRedirect: false`, and parse it. A `null` result counts as missing and isn't saved or indexed.
  - Write each edition to `path.join(outDir, 'articles', season, slug + '.json')` with `JSON.stringify(edition, null, 2)`, and print each warning as `  warning: …`.
  - Catch per-edition errors as failed (`  failed: <err>`) and carry on.

  After all seasons:
  - Write `index.json`, made of EspnIndexEntry objects (`slug, title, season, espnWeek, week, editionType, updatedText, teamCount, hasStructuredRankings, file`, with `file` relative to `outDir`), sorted by `season` descending then `espnWeek` descending.
  - Log `[i/n] <slug>` progress for each edition and a final `Done. Fetched X, skipped (already saved) Y, missing Z, failed W. Index written to <path>.`

  Follow the structure and logging style of `scripts/nba-power-rankings-scraper/scrape.mjs`. Caching comes in US2, so `skipped` stays 0 for now.
- [X] T020 [US1] Create `scripts/espn-power-rankings-scraper/cli.mjs`:
  - Start with `#!/usr/bin/env node` and `chmod +x` the file.
  - Parse `--out <dir>` (default `path.join(root, 'data', 'raw', 'espn')`, with `root` two folders up from the file, as in the NBA.com `cli.mjs`), `--delay-ms <n>` (default `1000`) and `--help`. Unknown arguments print an error and help, then exit 1.
  - Call `scrape({ fromEndYear: 2004, toEndYear: 2016, outDir, delayMs })`. `main().catch` logs and exits 1.
  - Follow `scripts/nba-power-rankings-scraper/cli.mjs`, with help text in its style: `Usage: node scripts/espn-power-rankings-scraper/cli.mjs [options]`.
- [X] T021 [P] [US1] Create `scripts/espn-power-rankings-scraper/README.md`, modelled on `scripts/nba-power-rankings-scraper/README.md`. Cover:
  - how it works: season page = final edition, dropdown = other weeks, redirect = missing
  - coverage: 2003-04 to 2015-16, Marc Stein, 29 teams in 2003-04, the 2012-13 training camp edition, the 2011-12 lockout season ending at week 17
  - usage (`npm run scrape:espnPowerRankings` and the direct `node` command)
  - the output layout under `data/raw/espn/`
  - one shortened example edition JSON, with made-up comment text
  - the team ID mapping for relocated franchises

  Add the options from US2 and US3 to it when those phases land.

**Checkpoint**: `npm test` passes. US1 is the MVP: a default run collects the archive.

---

## Phase 5: User Story 2 - Re-run cheaply and resume interrupted runs (Priority: P2)

**Goal**: Saved editions are reused, and `--force` fetches everything again. The index always lists every saved edition (FR-009, SC-003).

**Independent Test**: Run on one season, delete one edition file, then run again. Exactly one edition request is made besides the season page, and the summary shows `Fetched 1`.

- [X] T022 [US2] In `scripts/espn-power-rankings-scraper/scrape.mjs`:
  - Add a `force` option.
  - Before fetching a non-final edition, check whether `path.join(outDir, 'articles', season, slug + '.json')` exists, where `slug` comes from a small exported `editionSlug(season, espnWeek)` helper in `editionPage.mjs`. If it does and `force` is false, read it from disk, add it to the index, count it as skipped, and don't sleep.
  - The season page is always fetched, because it lists the weeks. Don't rewrite its final edition when that file already exists and `force` is false.
  - Refactor `parseEdition` to use `editionSlug`.
- [X] T023 [US2] In `scripts/espn-power-rankings-scraper/cli.mjs`, add `--force` (help line: `--force           Re-fetch editions even if already saved`) and pass it to `scrape`. Add `--force` and the re-run behaviour to the README.

**Checkpoint**: Re-running after a complete run fetches only the 13 season pages.

---

## Phase 6: User Story 3 - Scrape a narrower range of seasons (Priority: P3)

**Goal**: `--from`/`--to` limit the seasons. Out-of-range input is rejected before any request (FR-003).

**Independent Test**: `--from 2007-08 --to 2007-08` fetches only that season, and `--from 2001-02` exits 1 with the supported range and makes no requests.

- [X] T024 [P] [US3] Create `scripts/espn-power-rankings-scraper/seasonRange.test.mjs` for an exported `parseSeasonRange(from, to)` in a new `scripts/espn-power-rankings-scraper/seasonRange.mjs`:
  - defaults → `{ fromEndYear: 2004, toEndYear: 2016 }`
  - `'2007-08', '2007-08'` → `{ fromEndYear: 2008, toEndYear: 2008 }`
  - throws for `'2001-02'`, `'2016-17'`, `'2007-09'` (the second year isn't the first + 1), `'2007'`, and `from` later than `to`
  - error messages include `2003-04 to 2015-16`
- [X] T025 [US3] Create `scripts/espn-power-rankings-scraper/seasonRange.mjs`, exporting `FIRST_SEASON = '2003-04'`, `LAST_SEASON = '2015-16'` and `parseSeasonRange(from = FIRST_SEASON, to = LAST_SEASON)`. It validates `/^\d{4}-\d{2}$/` and that the second part equals `(startYear + 1) % 100`, converts each to an end year, checks the range and order, and throws `Error` with messages naming the supported range. Makes T024 pass.
- [X] T026 [US3] In `scripts/espn-power-rankings-scraper/cli.mjs`:
  - Add `--from <season>` (default `2003-04`) and `--to <season>` (default `2015-16`). Call `parseSeasonRange` before `scrape`. On an error, print the message and exit 1 without any request.
  - Help lines: `--from <season>   First season to scrape (default: 2003-04)` and `--to <season>     Last season to scrape (default: 2015-16)`.
  - Add both options to the README.

**Checkpoint**: All four stories work independently.

---

## Phase 7: Polish and validation

- [X] T027 [P] Run `npm run lint` and fix any issues in `scripts/espn-power-rankings-scraper/` and `scripts/lib/`.
- [X] T028 [P] Run `npm test` and confirm every suite passes, old and new.
- [X] T029 Run `npm run build` and confirm it succeeds.
- [X] T030 Smoke test (makes about 25 ESPN requests): `node scripts/espn-power-rankings-scraper/cli.mjs --from 2007-08 --to 2007-08`. Expect about 25 files in `data/raw/espn/articles/2007-08/`, 30 teams each, no warnings and `failed 0`. Check `2007-08-week-10.json` against [quickstart §3](quickstart.md): Boston rank 1, record `29-3`, previousRank 2, then Detroit rank 2. Fix the parser if anything is off before going on.
- [X] T031 Validation checks (no requests for the first; one season page for the others):
  - `node scripts/espn-power-rankings-scraper/cli.mjs --from 2001-02` exits 1.
  - Re-running the T030 command reports `Fetched 0` apart from the season page.
  - `--from 2007-08 --to 2007-08 --force` fetches all of them again.
- [X] T032 Run `node scripts/nba-power-rankings-scraper/cli.mjs --help` and confirm the `--out` default reads `data/raw/nba`. Confirm `ls data/raw` shows `basketball-reference  espn  nba`.
- [X] T033 Update any remaining docs: the root `README.md` data section mentions the ESPN scraper and `npm run scrape:espnPowerRankings` in one sentence next to the NBA.com scraper.
- [X] T034 **Ask the user before running.** This makes about 330 ESPN requests at 1 s spacing. Run `node scripts/espn-power-rankings-scraper/cli.mjs` and confirm:
  - about 320 or more editions, `failed 0` and no unmatched-team warnings (SC-001, SC-002)
  - `2003-04-week-1.json` has 29 teams and `author: null`
  - `2012-13-training-camp.json` exists with all `previousRank: null`
  - 2011-12's last weekly edition is week 17

  Then re-run and confirm only the 13 season pages are requested (SC-003). Report counts and any warnings to the user.
- [X] T035 Commit the ESPN scraper code and the `data/raw/espn/` output as a second commit after the US4 move commit, with the message `Add ESPN power rankings scraper (2003-04 to 2015-16)`.

---

## Dependencies and Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: blocks US1, since the ESPN scraper imports `scripts/lib/http.mjs` and `htmlToText.mjs`. T002 comes before T003, T004 and T005.
- **US4 (Phase 3)**: depends on Phase 2 only because T012 commits both together. Otherwise it's independent of the ESPN work.
- **US1 (Phase 4)**: depends on Phases 1 and 2. Its README task (T021) assumes US4's `data/raw/espn` naming.
- **US2 (Phase 5)** and **US3 (Phase 6)**: depend on US1's `scrape.mjs` and `cli.mjs`. They don't depend on each other, but both edit `cli.mjs`, so do them one after the other.
- **Polish (Phase 7)**: after every story. T030 → T031 → T034 → T035 run in order.

### Within US1

T013, T014, T015 (tests) → T016 (teams) → T017 (editionPage) → T018 (seasonPage) → T019 (scrape) → T020 (cli). T021 (README) can happen any time.

### Parallel opportunities

- T004 and T005 (different files, after T002).
- T007, T008, T009, T010 and T011 (separate files, after T006).
- T013, T014 and T015 (separate test files), and T016 alongside T018 once their tests exist.
- T027 and T028.

## Parallel Example: User Story 1

```text
Task: "T013 teams.test.mjs"
Task: "T014 editionPage.test.mjs"
Task: "T015 seasonPage.test.mjs"
Task: "T016 teams.mjs"
Task: "T021 README.md"
```

## Implementation Strategy

### MVP

1. Phases 1 and 2: setup and shared helpers.
2. Phase 3 (US4): move the raw data, check `build:rankings` is byte-identical, commit.
3. Phase 4 (US1): parser, season listing, scrape loop, CLI.
4. **Stop and check**: tests pass and a single-season run is correct (T030).

### Incremental delivery

1. Add US2 (caching and `--force`): re-runs become cheap.
2. Add US3 (`--from`/`--to`): spot checks.
3. Polish, and the full run with the user's approval (T034).

## Notes

- `[P]` tasks touch different files and have no unfinished dependencies.
- Don't copy ESPN text into test fixtures or the README. Use made-up comment text.
- Keep `build:summaries` off-limits throughout. It only changes paths in T008.
