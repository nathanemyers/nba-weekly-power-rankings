# CLI Contracts

## ESPN scraper: `scripts/espn-power-rankings-scraper/cli.mjs`

Runnable as `node scripts/espn-power-rankings-scraper/cli.mjs [options]` (with a shebang and the executable bit) or `npm run scrape:espnPowerRankings -- [options]`.

| Option | Default | Meaning |
|---|---|---|
| `--from <season>` | `2003-04` | First season to scrape, inclusive. |
| `--to <season>` | `2015-16` | Last season to scrape, inclusive. |
| `--out <dir>` | `data/raw/espn` (repo-relative) | Output folder. |
| `--delay-ms <n>` | `1000` | Wait between requests to ESPN. |
| `--force` | off | Fetch editions again even when saved. |
| `--help` | | Print usage and exit 0. |

**Exit codes**
- `0`: the run finished. Missing and failed editions are reported but don't fail the run, same as the NBA.com scraper.
- `1`: unknown argument, a season that isn't `YYYY-YY`, a season outside 2003-04 to 2015-16, or `--from` later than `--to`. These are rejected before any request is made, with the supported range in the message. An unexpected crash also exits 1.

**Console output**
```text
Fetching 2007-08 season page...
  25 editions listed (Preseason, weeks 1-24).
[1/25] 2007-08-preseason
[2/25] 2007-08-week-1
  warning: unmatched team "Foo" in 2007-08-week-1
...
Done. Fetched 300, skipped (already saved) 20, missing 1, failed 0. Index written to data/raw/espn/index.json.
```

## NBA.com scraper: `scripts/nba-power-rankings-scraper/cli.mjs` (changed)

Options are unchanged. The only change is the `--out` default, which goes from `data/raw` to `data/raw/nba`. The help text and README say so.

## Playoffs scraper: `scripts/scrape-playoffs.mjs` (changed)

Writes `data/raw/basketball-reference/playoffs.json` instead of `data/raw/playoffs.json`.

## Shared modules: `scripts/lib/` (moved)

| Module | Exports | Change |
|---|---|---|
| `http.mjs` | `sleep(ms)`, `fetchTextWithRetry(url, { retries, baseDelayMs, allowRedirect })`, `fetchJsonWithRetry(url, opts)` | Moved from the NBA.com scraper. Every request sends the project user agent. With `allowRedirect: false`, a 3xx response resolves to `null` instead of being followed. 3xx responses are never retried. |
| `htmlToText.mjs` | `htmlToText(html)` | Moved. Numeric entities 128-159 are decoded as Windows-1252. |

## Build scripts (changed paths only)

| Script | Reads |
|---|---|
| `scripts/build-rankings.mjs` | `data/raw/nba/` (via `loadSeasonEntries`) and `data/raw/basketball-reference/playoffs.json` |
| `scripts/build-summaries.mjs` | same |
