# Research: ESPN Power Rankings Scraper

All findings are from single ESPN pages fetched on 2026-10-25 with the project's user agent: 2003-04 week 1, 2006-07 default, 2007-08 week 10 and default, 2011-12 default, 2011-12 week 30 (doesn't exist), 2012-13 week -1 and 2015-16 week 0. No unknowns from the Technical Context remain.

## 1. How to find every edition in a season

- **Decision**: Fetch each season's default page, `https://www.espn.com/nba/powerrankings/_/year/<endYear>`. That page is the season's **final** edition, and its heading gives the week ("2007-08 Power Rankings: Week 24"). Its week dropdown lists every *other* edition as `//www.espn.com/nba/powerrankings/_/year/<endYear>/week/<n>`. Remove duplicate dropdown entries and the final week, then fetch the rest.
- **Rationale**: The dropdown is ESPN's own list of what exists, so there's no guessing at week counts (the 2011-12 lockout season ends at week 17, normal seasons at 24). The dropdown leaves out the final week (2007-08 lists 0 to 23, and the default page is week 24), which is why the default page is read as the final edition.
- **Implementation finding**: The dropdown never lists training camp editions (`-1`), but eleven seasons have one. The scraper always tries week `-1`, and a redirect there is skipped quietly rather than counted as missing. It also turned out that ESPN redirects some weeks its dropdown lists (2003-04 preseason, 2004-05 preseason to week 18). Those are reported as missing, and recovered from the Wayback Machine (§11).
- **Alternatives considered**: Trying weeks -1 to 30 for every season costs about 400 requests, many of them pointless redirects. The Wayback Machine is slower and has gaps.

## 2. Weeks that don't exist

- **Decision**: Request with `redirect: 'manual'`. A 3xx response means "not published": record the week as missing and move on.
- **Rationale**: `/year/2012/week/30` returns `302` to `https://www.espn.com/nba/powerrankings`, the current rankings page. If the redirect were followed, a page from another season would be saved as if it were the requested week. The dropdown should keep this case rare, but a stale dropdown entry must not corrupt data.
- **Alternatives considered**: Following the redirect and comparing the heading's season works, but it downloads a full page for nothing.

## 3. Training camp and preseason editions

- **Decision**: Keep ESPN's week number as `espnWeek`. `-1` is "Training Camp" (only 2012-13 has one, alongside a `0`) and `0` is "Preseason". In the saved data these have `week: null` and an `editionType` of `training-camp` or `preseason`. Weekly editions have `week` = `espnWeek` and `editionType: 'weekly'`.
- **Rationale**: This matches the NBA.com data, where non-weekly editions have `week: null`. The existing loader (`scripts/lib/articles.mjs`) already filters those out, so if ESPN data is ever fed into it, preseason editions won't be plotted as weeks.

## 4. Page structure (stable from 2003-04 to 2015-16)

All eras use the same markup:

| Field | Source |
|---|---|
| Season and heading | `<tr class="stathead"><td colspan=5>2007-08 Power Rankings: Week 10</td></tr>` |
| Headline | `<h1 class="h2">…</h1>` |
| Date as printed | `<span>Updated:</span> January 7, 2008, 11:52 AM ET` |
| Author | `<cite class="source"> By <a …> Marc Stein</a>`. Missing on 2003-04 pages. |
| Team rows | `<tr class="oddrow">` / `<tr class="evenrow">` inside `table.tablehead`, one per team. 29 rows in 2003-04, 30 afterwards. |
| Rank | `<td class="pr-rank">1</td>` |
| Team | `<a href="https://www.espn.com/nba/team/_/name/<abbr>/<slug>">Boston</a>`, or bare text for relocated or renamed franchises |
| Record | `<span class="pr-record">29-3</span>` |
| Previous rank | `<span class="pr-last">Last Week: 2</span>`. Missing on the 2012-13 training camp edition. |
| Comment | The row's last `<td>` (inline `<i>`, `<a>` markup) |

- **Decision**: Parse with regular expressions scoped to `table.tablehead` rows, matching how `scrape-playoffs.mjs` and the NBA.com scraper parse HTML.
- **Rationale**: The markup is regular and doesn't change across eras, and AGENTS.md and the constitution (Principle V) discourage new dependencies.
- **Alternatives considered**: An HTML parser such as cheerio or linkedom would be sturdier, but it's a new dependency for 13 seasons of static, regular markup.

## 5. Identifying teams

- **Decision**: Use the team link's abbreviation when there is one, otherwise the printed name. Both map to NBA.com team IDs (`1610612xxx`), the IDs the existing NBA.com data and `scripts/lib/articles.mjs` (`TEAM_SLUGS`) use.
- **Rationale**: Names alone are ambiguous. ESPN prints "Los Angeles" and "LA" for both LA teams, but the links (`/name/lal/`, `/name/lac/`) tell them apart. Relocated or renamed franchises have no link, but their printed names are unique.
- **Abbreviations seen**: atl bos bkn cha chi cle dal den det gs hou ind lac lal mem mia mil min no ny okc orl phi phx por sa sac tor utah wsh. `nor` (New Orleans) also appears in ESPN's team dropdown.
- **Unlinked names seen**: `New Orleans` (Hornets, 2003-04 to 2012-13) → 1610612740. `NO/Oklahoma City` (2005-06 and 2006-07) → 1610612740. `New Jersey` → 1610612751. `Seattle` → 1610612760. `Charlotte` (Bobcats, 2004-05 onward) → 1610612766.
- **Unmatched teams**: save the entry with `teamId: null` and print a warning (spec edge case).

## 6. Character encoding

- **Decision**: Decode responses as UTF-8 (`fetch().text()` does this), and teach the shared `htmlToText` to read numeric entities in the 128-159 range as Windows-1252 (`&#133;` → "…", `&#146;` → "’").
- **Rationale**: The server's header says `charset=iso-8859-1`, but the ranking tables on every page fetched are valid UTF-8 (one contains `⬦`). Older ESPN prose uses Windows-1252 numeric entities, which `String.fromCodePoint(133)` would turn into an invisible control character. This fixes the NBA.com scraper too, though the NBA.com data hasn't been seen to contain these entities.

## 7. Request pacing and identification

- **Decision**: Default delay of 1000 ms between requests. Every request from both scrapers sends `User-Agent: nba-weekly-power-rankings (personal project)`, matching `scrape-playoffs.mjs`.
- **Rationale**: ESPN's robots.txt (checked 2026-10-25) doesn't disallow `/nba/powerrankings` and sets no `Crawl-delay`, but constitution Principle IV requires pacing and a descriptive user agent. The NBA.com scraper doesn't currently set a user agent, so moving `http.mjs` into the shared folder fixes that for both scrapers. At 1 s, about 330 requests take roughly 6 to 10 minutes, well under SC-004's one hour.

## 8. Re-runs and caching

- **Decision**: Each run fetches the 13 season pages, which double as the final editions. Every other edition already on disk is reused unless `--force` is set.
- **Rationale**: This works like the NBA.com scraper, which always fetches its listing API and skips saved articles. Without the season page, the scraper can't know what weeks exist. A complete re-run makes 13 requests, all season listings, and no requests for non-final editions (SC-003).

## 9. Sharing code with the NBA.com scraper

- **Decision**: Move `http.mjs` and `htmlToText.mjs` from `scripts/nba-power-rankings-scraper/` to `scripts/lib/`, which already holds shared script modules. Both scrapers import them from there. Everything else stays separate.
- **Rationale**: The spec asks for a separate scraper that works like the NBA.com one. Sharing the retry and text helpers keeps the two from drifting apart, while the listing, page parsing and team mapping are source-specific.
- **Alternatives considered**: Importing straight from the NBA.com scraper's folder links the two scrapers together. Copying the files duplicates retry and entity logic.

## 10. Moving the raw data (clarification session 2026-10-25)

- **Decision**: `git mv data/raw/index.json data/raw/articles` → `data/raw/nba/`, and `git mv data/raw/playoffs.json` → `data/raw/basketball-reference/playoffs.json`. Split `rawDir` in `build-rankings.mjs` and `build-summaries.mjs` into an NBA.com folder (passed to `loadSeasonEntries`) and a playoffs file path. Update `scrape-playoffs.mjs`, the NBA.com scraper's default `--out`, the comment in `scripts/lib/articles.mjs` and the READMEs.
- **Verification**: Run `npm run build:rankings` after the move and confirm `git status data/processed` shows no changes. `build:summaries` is **not** run (AGENTS.md forbids it). It hashes each team's input text (`scripts/lib/summary-plan.mjs`), so the move can't change what it would generate.

## 11. Recovering editions ESPN no longer serves (convergence, 2026-10-25)

- **Decision**: A separate `wayback.mjs` command fills gaps from the Wayback Machine. It reads archive.org's CDX index for `sports.espn.go.com/nba/powerranking*` captures within the season's dates. It tries captures of ESPN's own `?season=<endYear>&week=<n>` URLs first, then the undated "current week" page, sampled at least 5 days apart, and stops once every gap is filled. Requests are 3 seconds apart with the project user agent.
- **Rationale**: ESPN's own `/year/<y>/week/<n>` pages redirect for these weeks, and archive.org never captured that URL format for 2003-05. In those years ESPN served rankings at `sports.espn.go.com/nba/powerranking`, which archive.org captured often. All 20 missing editions were found in 1 + 1 index queries and about 45 page fetches.
- **Layout**: The 2003-05 pages have no `tablehead` table. The heading is `<b>2005 Power Rankings: Week 3</b>` (end year), rank and last week share a cell (`1 (3)`), teams are nicknames linked by old codes (`pho`, `uth`, `njn`, `nor`, `sea`), and pages are Windows-1252. `legacyEditionPage.mjs` parses these into the standard edition shape with a separate team-code map.
- **Safety**: The heading's end year and week must match before a page is saved, since the undated captures could be any week.
- **Alternatives considered**: Changing SC-001 to count only editions ESPN still serves would have left most of 2004-05 off the chart.

## 12. Character encoding of live ESPN pages (convergence, 2026-10-25)

- **Decision**: Decode ESPN pages with a lenient UTF-8 decoder (`decodeUtf8Lenient` in `scripts/lib/http.mjs`). A lone invalid byte is read as Windows-1252, and a truncated multi-byte sequence becomes U+FFFD.
- **Rationale**: §6 found the ranking tables valid UTF-8, but the full scrape showed stray Windows-1252 bytes in older comments (`5\xbd games` for "5½ games"). Strict decoding turned them into U+FFFD. Two pages (2012-13 week 23, 2014-15 training camp) contain sequences ESPN itself broke, such as `e2 ac "` for an apostrophe. Those can't be recovered and stay as U+FFFD.

