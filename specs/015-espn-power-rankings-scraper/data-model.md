# Data Model: ESPN Power Rankings Scraper

All files are UTF-8 JSON, pretty-printed with 2-space indentation like the NBA.com scraper's output.

## Raw data layout after this feature

```text
data/raw/
├── nba/                         # moved from data/raw/ (NBA.com scraper)
│   ├── index.json
│   └── articles/<season>/<slug>.json
├── espn/                        # new (ESPN scraper)
│   ├── index.json
│   └── articles/<season>/<slug>.json
└── basketball-reference/        # moved from data/raw/ (playoffs scraper)
    └── playoffs.json
```

The NBA.com and playoffs file *contents* are unchanged by the move.

## EspnEdition (`data/raw/espn/articles/<season>/<slug>.json`)

| Field | Type | Notes |
|---|---|---|
| `slug` | string | `<season>-week-<n>`, `<season>-preseason` or `<season>-training-camp`, e.g. `2007-08-week-10`. Unique across the archive. |
| `url` | string | `https://www.espn.com/nba/powerrankings/_/year/<endYear>/week/<espnWeek>`. The final edition uses this form too, even though it was fetched from the default page. |
| `archiveUrl` | string (optional) | Only on editions recovered from the Wayback Machine: the capture they were parsed from. `title` and `updatedText` are `null` on these, because the 2003-05 layout has neither. |
| `title` | string \| null | The `<h1>` headline, e.g. "Power Rankings: Celtics overtake Pistons, regain top spot". |
| `heading` | string | The table heading as printed, e.g. "2007-08 Power Rankings: Week 10". |
| `author` | string \| null | From the byline. Null on 2003-04 pages, which have none. |
| `updatedText` | string \| null | The "Updated:" date exactly as printed, e.g. "January 7, 2008, 11:52 AM ET". Not parsed, because some are wrong (FR-007). |
| `season` | string | `"YYYY-YY"`, taken from the archive's `endYear` (2008 → `"2007-08"`). |
| `espnWeek` | integer | ESPN's week number: -1 training camp, 0 preseason, 1 or more weekly. |
| `week` | integer \| null | Same as `espnWeek` for weekly editions, `null` for preseason and training camp (matches the NBA.com convention). |
| `editionType` | `"weekly"` \| `"preseason"` \| `"training-camp"` | Taken from `espnWeek`. |
| `hasStructuredRankings` | boolean | `true` when at least one team row was parsed. Kept for the same shape as NBA.com data. |
| `rankings` | EspnTeamEntry[] | Sorted by `rank` ascending. 29 entries in 2003-04, 30 afterwards. |

### Validation

- `season` matches `/^\d{4}-\d{2}$/` and lies between `2003-04` and `2015-16`.
- The season in `heading` must equal `season`. If not, treat the edition as failed. This catches a redirect or a wrong page.
- Ranks that don't run 1 to `rankings.length` (ties or gaps) are kept in ESPN's order and produce a warning. ESPN's 2005-06 week 18 has two No. 13s. *(Changed during implementation; this was originally a hard failure.)*
- A table with no team rows is saved with `rankings: []` and `hasStructuredRankings: false`, with a warning. The 2010-11 training camp page is like this. *(Changed during implementation.)*

## EspnTeamEntry

| Field | Type | Notes |
|---|---|---|
| `rank` | integer | From `td.pr-rank`. |
| `previousRank` | integer \| null | From "Last Week: N". `null` when not printed. |
| `teamId` | integer \| null | NBA.com franchise ID (`1610612xxx`). `null` and a warning when unmatched. |
| `teamName` | string | Name as ESPN printed it ("Boston", "LA", "NO/Oklahoma City"). |
| `espnAbbr` | string \| null | Abbreviation from the team link (`bos`, `lal`, `utah`). `null` for unlinked rows. |
| `teamLink` | string \| null | The team link URL, when present (same field as the NBA.com data). |
| `record` | string | As printed, e.g. `"29-3"`. Preseason editions show `"0-0"` or the previous season's record. |
| `summaryHtml` | string | The comment cell's inner HTML. |
| `summaryText` | string | `summaryHtml` passed through the shared `htmlToText`. |

### Team identity rules

1. If the row has a team link, look up `espnAbbr` in the abbreviation map.
2. Otherwise look up the printed `teamName` in the unlinked-name map (`New Orleans`, `NO/Oklahoma City`, `New Jersey`, `Seattle`, `Charlotte`).
3. Otherwise set `teamId: null` and print `warning: unmatched team "<name>" in <slug>`.

The maps are in [research.md §5](research.md#5-identifying-teams).

## EspnIndexEntry (`data/raw/espn/index.json`, array)

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Matches the edition file. |
| `title` | string \| null | |
| `season` | string | |
| `espnWeek` | integer | |
| `week` | integer \| null | |
| `editionType` | string | |
| `updatedText` | string \| null | |
| `teamCount` | integer | `rankings.length`. |
| `hasStructuredRankings` | boolean | |
| `file` | string | Relative to `data/raw/espn/`, e.g. `articles/2007-08/2007-08-week-10.json`. |

Sorted newest first: by `season` descending, then `espnWeek` descending. This doesn't use a date, because the printed dates can be wrong.

## Edition lifecycle within a run

```text
listed (season dropdown or default page)
  ├─ saved on disk and not --force ─────────► skipped (read from disk, added to index)
  └─ requested
       ├─ 3xx redirect ─────────────────────► missing (not saved, not in index, counted)
       ├─ parse or validation error, or HTTP error after retries ─► failed (counted, run continues)
       └─ parsed ───────────────────────────► fetched (written, added to index)
```

## Processed season (`data/processed/seasons/<season>.json`)

Built by `scripts/build-rankings.mjs` from NBA.com articles (2017-18 onward) and ESPN weekly editions (2003-04 to 2015-16). Only weekly editions are charted, so preseason and training camp editions are left out, as with NBA.com. One field was added:

| Field | Type | Notes |
|---|---|---|
| `source` | `"nba"` \| `"espn"` | Which scraper the season's rankings came from. NBA.com wins if a season exists in both. Validated by `SeasonDataSchema` (`src/schemas/season.ts`) as the `DataSource` enum (`src/types/nba.ts`) and passed to the season store as `Season.source`. |

ESPN rows use the edition's printed `record`, and the cleaned comment as `summary`.

