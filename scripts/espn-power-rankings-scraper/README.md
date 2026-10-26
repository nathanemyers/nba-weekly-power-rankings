# espn-power-rankings-scraper

Scrapes ESPN's weekly NBA Power Rankings (written by Marc Stein) for the
2003-04 through 2015-16 seasons into JSON. It's a separate tool, but it works
like the [NBA.com scraper](../nba-power-rankings-scraper/README.md) and writes
the same kind of layout.

## How it works

ESPN still serves these seasons as structured pages at
`espn.com/nba/powerrankings/_/year/<endYear>/week/<n>`, where `endYear` is
the year the season ends (2007-08 is `2008`).

- **The season page is the final edition.** `/year/<endYear>` shows the last
  edition of the season. Its heading names the week, e.g. "2007-08 Power
  Rankings: Week 24".
- **The week dropdown lists the rest.** It lists every other edition, so the
  scraper never guesses week numbers (2011-12, the lockout season, ends at
  week 17). The one exception is the "Training Camp" edition (week `-1`),
  which most seasons have but the dropdown never lists, so the scraper always
  tries week `-1` and quietly skips it when ESPN redirects.
- **A redirect means "never published".** ESPN redirects a week that doesn't
  exist to its current rankings page. The scraper counts that as missing and
  saves nothing.

Each edition's table gives rank, team, record, last week's rank and a comment
for every team. Season and week come from the URL, not the page's dates,
because some old pages carry wrong "Updated" dates.

**Coverage notes**

- 2003-04 ranks 29 teams; later seasons rank 30. 2003-04 pages have no byline.
- Training camp editions (week `-1`) have no previous ranks. ESPN has them for
  every season except 2003-04 and 2011-12.
- ESPN no longer serves 2003-04's preseason edition or 2004-05's preseason
  through week 18, even though the dropdowns list them. The scraper reports
  them as missing; [`wayback.mjs`](#recovering-editions-espn-no-longer-serves)
  recovers them from the Wayback Machine.
- Data is kept as ESPN published it, with a warning: 2005-06 week 18 has two
  teams at No. 13 and none at No. 12, 2004-05 week 3 has two at No. 27, the
  2005-06 training camp edition has two blank comments, and the 2010-11
  training camp table has no rows (saved with `hasStructuredRankings: false`
  and empty `rankings`).
- Pages are UTF-8 with stray Windows-1252 bytes (e.g. "5½ games"), which are
  decoded as Windows-1252. 2012-13 week 23 and the 2014-15 training camp
  edition contain bytes ESPN itself mangled; those come out as "�".
- From 2016-17 on, ESPN publishes power rankings as regular articles in a
  different format, which this tool doesn't handle.

## Usage

```bash
npm run scrape:espnPowerRankings
# or directly:
node scripts/espn-power-rankings-scraper/cli.mjs
```

By default this fetches every season into `data/raw/espn`. Options:

- `--from <season>` / `--to <season>`: limit the seasons, e.g.
  `--from 2007-08 --to 2007-08`. Seasons outside 2003-04 to 2015-16 are
  rejected before any request is made.
- `--out <dir>`: output directory (default `data/raw/espn`).
- `--delay-ms <n>`: delay between requests to ESPN (default 1000).
- `--force`: fetch editions again even if they're already saved.

Re-running without `--force` reuses every edition already on disk. It still
fetches each season's page, because that's how it learns which weeks exist,
and tries the training camp week of 2003-04 and 2011-12, but nothing else.
Editions recovered from the Wayback Machine are kept even with `--force`,
since ESPN redirects those weeks. The index keeps entries for seasons outside
the current `--from`/`--to` range.

## Recovering editions ESPN no longer serves

```bash
node scripts/espn-power-rankings-scraper/wayback.mjs
```

For each season, this finds weeks between the preseason and the last saved
week that aren't saved yet, then looks for the Wayback Machine's copies of
ESPN's 2003-05 pages (`sports.espn.go.com/nba/powerranking`). It tries
captures of the exact `?season=…&week=…` URL first, then the undated
"current week" page a few days apart, and stops once every gap is filled.
Each archived page's heading must name the right season and week before it's
saved. Those older pages use a different layout, parsed by
`legacyEditionPage.mjs` into the same edition format plus an `archiveUrl`.

It takes `--from`, `--to`, `--out` and `--delay-ms` (default 3000). With
nothing missing it makes no requests.

## Output

The folders are called `articles/` to match the NBA.com layout, but each file
is one ESPN *edition*.

```
data/raw/espn/
  index.json                           # one row per edition: slug, title,
                                       # season, ESPN week, edition type,
                                       # date as printed, team count, file
  articles/
    2015-16/
      2015-16-preseason.json
      2015-16-week-1.json
      ...
    2012-13/
      2012-13-training-camp.json
      ...
```

Each edition file looks like this (comment text shortened and made up):

```jsonc
{
  "slug": "2007-08-week-10",
  "url": "https://www.espn.com/nba/powerrankings/_/year/2008/week/10",
  "title": "Power Rankings: ...",
  "heading": "2007-08 Power Rankings: Week 10",
  "author": "Marc Stein",
  "updatedText": "January 7, 2008, 11:52 AM ET",
  "season": "2007-08",
  "espnWeek": 10,
  "week": 10,                 // null for preseason and training camp
  "editionType": "weekly",    // or "preseason", "training-camp"
  "hasStructuredRankings": true,
  "rankings": [
    {
      "rank": 1,
      "previousRank": 2,
      "teamId": 1610612738,
      "teamName": "Boston",
      "espnAbbr": "bos",
      "teamLink": "https://www.espn.com/nba/team/_/name/bos/boston-celtics",
      "record": "29-3",
      "summaryHtml": "A comment with <i>inline</i> markup.",
      "summaryText": "A comment with inline markup."
    }
    // ...one entry per ranked team, sorted by rank
  ]
}
```

## Team ids

`teamId` uses the same NBA.com franchise ids as the NBA.com data, so a team can
be matched across both sources. Most rows link to an ESPN team page, and the
link's abbreviation (e.g. `lal` vs `lac`, which ESPN both prints as "Los
Angeles"/"LA") decides the team. Relocated or renamed franchises have no link
and are matched by name:

| ESPN name | Franchise |
|---|---|
| New Orleans, NO/Oklahoma City | Pelicans (then Hornets) |
| New Jersey | Nets |
| Seattle | Thunder (then SuperSonics) |
| Charlotte | Hornets (then Bobcats) |

A team that can't be matched is saved with `teamId: null` and a warning is
printed.
