# Quickstart: Team Roster Stats

How to prove the feature works end to end. Shapes are in [data-model.md](data-model.md) and [contracts/](contracts/).

## Prerequisites

- Node and `npm install` done.
- Network access to basketball-reference.com for the scrape step only.
- Do **not** run `npm run build:summaries` (spends API tokens); it is not needed here.

## 1. Parser tests (offline)

```bash
npm test -- scripts/lib/rosters.test.mjs
```

Expected: tests pass against small HTML fixtures covering a coaching change (Hoiberg → Boylen), a single-team player, a two-team player (Gasol MEM → TOR), a three-team player (Wallace POR → ATL → DET), a blank PER cell, a commented-out table, the playoff table being ignored, and an unknown team abbreviation throwing.

## 2. Scrape

```bash
npm run scrape:rosters
```

Expected: 23 seasons, 69 requests spaced at least 3 seconds apart (about 3.5 minutes). `data/raw/basketball-reference/rosters/` holds `2003-04.json` … `2025-26.json`. Re-running immediately fetches nothing.

## 3. Build app data

```bash
npm run build:rankings
```

Expected: every season file in `data/processed/seasons/` has `rosters` and `coaches` fields with an entry for every team that has rankings. The build fails loudly, naming season, team and player, if any validation rule in data-model.md breaks.

## 4. Spot checks (SC-002, SC-003, SC-006)

Run the app and pin teams:

```bash
npm run dev
```

| Season | Team | Check |
|---|---|---|
| 2015-16 | Golden State | Curry: 79 G, 30.1 PTS, 5.4 REB, 6.7 AST, 2.1 STL, 3.3 TOV, PER 31.5 |
| 2018-19 | Toronto | Gasol: 26 G, PER 16.0, "Joined from Memphis Grizzlies". Valančiūnas: 30 G, PER 24.4, "Left for Memphis Grizzlies" |
| 2018-19 | Memphis | Gasol: 53 G, "Left for Toronto Raptors" |
| 2003-04 | Detroit | Rasheed Wallace: 22 G, "Joined from Atlanta Hawks" |
| 2007-08 | Oklahoma City | Seattle SuperSonics roster (Kevin Durant, rookie) |
| 2018-19 | Chicago | Head coaches: Fred Hoiberg (5-19) → Jim Boylen (17-41) |
| 2018-19 | Cleveland | Head coaches: Tyronn Lue (0-6) → Larry Drew (19-57) |
| 2018-19 | Toronto | Head coach: Nick Nurse (58-24) |

Also confirm: the list is ordered by G, most first; unpinning hides the pane; pinning two teams hides it; at 375 px wide the page does not scroll sideways.

## 5. Quality gates

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

All three must pass. Note the size of `dist/assets` before and after to record the bundle growth (research.md R5).
