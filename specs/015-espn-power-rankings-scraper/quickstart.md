# Quickstart: Validating the ESPN scraper and the raw-data move

Run every command from the repo root. Do **not** run `npm run build:summaries` or `scripts/build-summaries.mjs`; AGENTS.md forbids it because it spends API tokens.

## 1. Raw data move (User Story 4)

```bash
ls data/raw
```
Expect exactly `basketball-reference/  espn/  nba/` (`espn/` appears after step 3). No `index.json`, `articles/` or `playoffs.json` directly under `data/raw/`.

```bash
git diff --stat -M HEAD -- data/raw
```
Expect only renames (`R100`) for the NBA.com and playoffs files.

```bash
npm run build:rankings && git status --short data/processed
```
Expect no output from `git status`: the processed data is identical (SC-006).

The summaries build reads from the same two paths. If the maintainer wants to check it, they can run `npm run build:summaries -- --dry-run` themselves and expect no team to be marked `generate`. An agent must not run it.

```bash
node scripts/nba-power-rankings-scraper/cli.mjs --help
```
Expect the `--out` default to read `data/raw/nba`. A full NBA.com run should report `Fetched 0` (or only articles published since the last run) and skip everything else.

## 2. Unit tests

```bash
npm test
```
Expect the existing suites to pass, along with the new ESPN parser and team-map tests. These use small synthetic HTML fixtures shaped like ESPN's markup ([research.md §4](research.md#4-page-structure-stable-from-2003-04-to-2015-16)). They cover:
- linked and unlinked team rows, including "Los Angeles" resolved by abbreviation and "NO/Oklahoma City"
- a missing "Last Week" value, which gives `previousRank: null`
- reading the final week from the heading, and building the dropdown list without duplicates or the final week
- an unmatched team, which gives `teamId: null`
- Windows-1252 entities in `htmlToText`

## 3. Single-season smoke test (User Story 3)

```bash
node scripts/espn-power-rankings-scraper/cli.mjs --from 2007-08 --to 2007-08
```
Expect about 25 editions under `data/raw/espn/articles/2007-08/`, with 30 teams in each and no unmatched-team warnings. Open `2007-08-week-10.json` and compare it with https://www.espn.com/nba/powerrankings/_/year/2008/week/10: Boston at 1 (29-3, last week 2) and Detroit at 2 (SC-005).

```bash
node scripts/espn-power-rankings-scraper/cli.mjs --from 2001-02
```
Expect exit code 1 and a message naming the supported range. No requests are made.

## 4. Full run and re-run (User Stories 1 and 2)

```bash
node scripts/espn-power-rankings-scraper/cli.mjs
```
Expect about 320 editions or more across 13 seasons, `failed 0`, no unmatched-team warnings, and a run time well under an hour (SC-001, SC-002, SC-004). Spot-check:
- `2003-04-week-1.json` has 29 teams and `author: null`
- `2012-13-training-camp.json` exists with `previousRank: null` throughout
- `2011-12` ends at week 17

```bash
node scripts/espn-power-rankings-scraper/cli.mjs
```
Expect `Fetched 0` apart from the 13 season pages, which are re-read as the final editions (SC-003).

```bash
node scripts/espn-power-rankings-scraper/cli.mjs --from 2015-16 --to 2015-16 --force
```
Expect every 2015-16 edition to be fetched again.

## 5. Quality gates

```bash
npm run lint
```

```bash
npm run build
```
