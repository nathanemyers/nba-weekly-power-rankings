# Research: Team Roster Stats

Findings from fetching sample Basketball-Reference pages on 2026-10-26 (`/teams/TOR/2019.html`, `/leagues/NBA_2019_per_game.html`, `/leagues/NBA_2004_advanced.html`, `/leagues/NBA_2019_coaches.html`) and reading `robots.txt`.

## R1. Which pages to scrape

- **Decision**: Scrape three league-wide pages per season: `/leagues/NBA_{endYear}_per_game.html`, `/leagues/NBA_{endYear}_advanced.html` and `/leagues/NBA_{endYear}_coaches.html` (R9).
- **Rationale**: Each page covers the whole league (about 700 player-team rows a season), so a full scrape is 69 pages (23 seasons × 3) instead of about 700 team pages. At the 3-second crawl delay that is about 3.5 minutes rather than 35. The league pages also carry the team column needed to tell trades apart (R2), which team pages do not.
- **Alternatives considered**:
  - Team season pages (`/teams/TOR/2019.html`): have the per-game and advanced tables plus a bio roster table (height, weight, birth date, college), but no sign of trades and 15× the requests. Rejected; bio fields can be added later if wanted.
  - Team transactions pages (`/teams/TOR/2019_transactions.html`): describe trades in prose. Rejected; parsing prose is fragile and stint order already answers "joined" or "left".

## R2. Detecting mid-season moves

- **Decision**: A player who played for more than one team has a summary row (`2TM`, `3TM`, …) followed by one row per team, in the order he played for them. For each team stint, the previous stint's team is "joined from" and the next stint's team is "left for".
- **Rationale**: Verified on three cases. 2018-19 Marc Gasol: `2TM 79`, `MEM 53`, `TOR 26`. 2018-19 Jonas Valančiūnas: `2TM 49`, `TOR 30`, `MEM 19` (not alphabetical, so the order is chronological). 2003-04 Rasheed Wallace: `3TM 68`, `POR 45`, `ATL 1`, `DET 22`.
- **Alternatives considered**: Player pages (one request per traded player, hundreds per season). Rejected for request volume.

## R3. Page structure

- **Decision**: Parse the regular-season table only: the `<table id="per_game_stats">` and `<table id="advanced">` blocks, cut at their closing `</table>` so the `_post` (playoff) tables that follow are never read. Read cells by their `data-stat` attribute and take the displayed text, not the `csk` sort key.
- **Rationale**:
  - On league pages both tables are plain HTML. On team pages the advanced table is inside an HTML comment, so the parser should strip `<!--`/`-->` before searching, which is harmless for league pages.
  - Player rows carry `data-append-csv="<playerId>"` on the name cell. Header repeats and the "League Average" row lack it and are skipped.
  - Display text matches what Basketball-Reference shows (for example `30.1`), which is what the spec's spot checks compare against. `csk` holds unrounded values.
  - Columns seen: per game has `age, team_name_abbr, pos, games, games_started, mp_per_g, fg/fga/fg_pct, fg3*, fg2*, efg_pct, ft*, orb/drb/trb_per_g, ast/stl/blk/tov/pf/pts_per_g, awards`. Advanced has `games, games_started, mp` (season total), `per, ts_pct, usg_pct, ws, ws_per_48, bpm, vorp` and percentage stats.
  - A blank cell (for example PER for a player with very few minutes; one case in 2003-04) is stored as `null`.
- **Alternatives considered**: An HTML parsing library (cheerio, jsdom at runtime of the script). Rejected under Principle V; `scripts/lib/playoffs.mjs` already parses these pages with regular expressions and the tables are regular.

## R4. Team abbreviations

- **Decision**: Map Basketball-Reference abbreviations to app slugs in `scripts/lib/rosters.mjs`, throwing on any unknown abbreviation.
- **Rationale**: Abbreviations seen across 2003-04 and 2018-19 include historic ones: `NJN`/`BRK` → `bkn`, `CHA`/`CHO` → `cha`, `NOH`/`NOK`/`NOP` → `nop`, `SEA`/`OKC` → `okc`, `PHO` → `phx`. The rest are the slug in upper case. This mirrors `SLUG_BY_NAME` in `scripts/lib/playoffs.mjs`, so relocated franchises line up with the rest of the app.

## R5. Where roster data lives in the app

- **Decision**: `build-rankings.mjs` adds a `rosters` field to each `data/processed/seasons/{season}.json`, keyed by team slug, validated by `SeasonDataSchema` and loaded into the existing `seasons` slice as `TeamRankings.roster`.
- **Rationale**: This is how every other per-team field (`playoffs`, `playoffSeries`, `summaries`) reaches the app. Loading stays synchronous, so no new loading state, thunk or Suspense boundary is needed, and the constitution's "loaded data lives in Redux" rule is met by the existing slice.
- **Cost**: Roughly 700 rows × ~150 bytes ≈ 100 KB per season, so about 2.3 MB of JSON (around 0.5 MB gzipped) on top of today's 4.3 MB (1.4 MB gzipped). Only display fields ship (data-model.md); the full raw stats stay in `data/raw/`.
- **Measured** (2026-10-26, `npm run build`): the app JS bundle went from 5,217 kB (1,676 kB gzipped) on master to 7,285 kB (2,174 kB gzipped), +498 kB gzipped. Season JSON went from 4.3 MB to 6.3 MB. Raw roster files are 21 MB in `data/raw/`, which never ships.
- **Alternatives considered**: Separate `data/processed/rosters/{season}.json` files loaded with a dynamic import when a team is pinned, held in a new `rosters` slice, with a Suspense fallback. Smaller initial bundle, but adds async loading, a slice and a loading state. Rejected for now; it is the follow-up if bundle size becomes a problem, and the separate-field design keeps that move easy.

## R6. Scraper behaviour

- **Decision**: New `scripts/scrape-rosters.mjs` (`npm run scrape:rosters`) writes one raw file per season, holding players and coaches, to `data/raw/basketball-reference/rosters/{season}.json`. It skips seasons whose file already exists, `--force` re-fetches everything, and `--season 2025-26` re-fetches one season. It reuses `fetchTextWithRetry` from `scripts/lib/http.mjs`, which already sends the project user agent, and sleeps 3 seconds between requests.
- **Rationale**: Matches `scrape-playoffs.mjs` (Principle IV: crawl delay, user agent, no re-fetching). One file per season keeps diffs readable and lets a single season be refreshed. Seasons scraped: 2003-04 to 2025-26, including 2016-17 for completeness even though the app has no rankings for it.

## R7. Headshots (future)

- **Decision**: Store the Basketball-Reference player id (for example `gasolma01`) on every row and ship it to the app. Do not fetch images now.
- **Rationale**: The id is the stable key a headshot feature will need. Basketball-Reference's `robots.txt` disallows `/req/`, where its images are served, so headshots will likely need a different source; that is a decision for the headshot feature.

## R8. Table component

- **Decision**: Add shadcn/ui `table` (`npx shadcn@latest add table`) for the pane, and use the existing `tooltip` for move marks.
- **Rationale**: AGENTS.md requires shadcn/ui components over hand-rolled equivalents. The `table` wrapper scrolls horizontally inside its container, which covers the phone-width edge case.

## R9. Head coaches

- **Decision**: Parse `<table id="NBA_coaches">` on `/leagues/NBA_{endYear}_coaches.html` and keep every row and column. For each team, its rows in page order are its head coaches in the order they coached. Each row's regular-season record for this team this season is `cur_g`, `cur_w`, `cur_l`.
- **Rationale**:
  - The table is plain HTML, one row per coach-team stint (36 rows in 2018-19). The coach id is in the link (`/coaches/hoibefr99c.html` → `hoibefr99c`), the team abbreviation in the `team` cell links to the team page.
  - Order is chronological within a team: 2018-19 Chicago lists Fred Hoiberg (24 G, 5-19) before Jim Boylen (58 G, 17-41); Cleveland lists Tyronn Lue (6 G, 0-6) before Larry Drew (76 G, 19-57).
  - Other columns come along for free and are kept raw: playoff record this season (`cur_g_p`, `cur_w_p`, `cur_l_p`), seasons with the franchise and overall (`seas_franch`, `seas_overall`), and franchise and career totals (`fr_*`, `car_*`). Only name, id and this season's regular-season record ship to the app.
  - Coach ids end in `c` and differ from player ids, so a coach who also played is not confused with his player row.
- **Alternatives considered**: The "Coach:" line on each team season page. Rejected; it needs 30 requests per season and is prose.

## R10. Stat color breakpoints

- **Decision**: Fixed breakpoints at the 25th and 75th percentiles of all 2003-04 to 2025-26 player-team seasons with 10+ games and 10+ minutes per game (9,388 rows): points 6 / 13.5, rebounds 2.5 / 5.5, assists 1 / 3, steals 0.5 / 1, turnovers 0.9 / 1.8 (reversed), PER 11 / 17. Players below 10 games or 10 minutes per game are not colored.
- **Rationale**:
  - The maintainer reviewed histograms of each stat with adjustable cuts (an interactive page built from the processed season data) and chose the percentile preset.
  - Points, rebounds, assists, steals and turnovers are right-skewed, so mean ± 1 SD cuts land poorly (the low cut for assists falls near zero). Percentiles give each band a predictable share: across the qualified rows the red/yellow/green split is 29/47/24 for points, 26/52/22 rebounds, 26/49/25 assists, 25/50/25 steals, 32/44/24 turnovers (green/yellow/red), and 25/53/22 PER. Bands are uneven where many players share a rounded value at a cut.
  - With every player included, PER runs from -54 to 134 because of tiny samples; the 10-game, 10-minute floor removes those, and the same floor decides who gets colored so the colors match the population they were drawn from.
  - Fixed cuts rather than per-season percentiles keep a value's color the same across eras and keep the logic in one small table.
- **Alternatives considered**: Thirds (more red and green, less signal per color), mean ± 1 SD (fits PER but not the skewed counting stats), per-season percentiles (colors shift between seasons, needs build-time data).
