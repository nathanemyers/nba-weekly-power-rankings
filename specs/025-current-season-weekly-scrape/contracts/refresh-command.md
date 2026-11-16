# Contract: `npm run refresh:current`

Script: `scripts/refresh-current-season.mjs`. It runs the same way locally and in CI, and never spends API tokens (FR-015).

## Steps

1. Run the NBA.com scraper with the default window. It fetches only articles that aren't saved yet (FR-012).
2. Work out which **new numbered weekly articles** were saved in this run, by comparing `data/raw/nba/index.json` before and after.
3. If there are none, stop. Exit 0 and report `changed=false`. No files are touched (FR-013, SC-005). The scraper rewrites `index.json` either way, so the script must leave it byte-for-byte unchanged when nothing new was added (write only if the content changed).
4. Otherwise, work out the current season (the newest season among the new weekly articles) and run `scripts/scrape-rosters.mjs --season <current>`.
5. Run `npm run build:rankings`.
6. Exit 0 and report `changed=true`, `season=<current>`, and `weeks=<comma-separated new week numbers>`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success: either nothing new, or new data written under `data/raw/` and `data/processed/seasons/`. |
| non-zero | A step failed: listing or article fetch error, a weekly article without 30 teams, roster fetch error, or a build-rankings error. Files may be partly written. CI throws away the checkout, and locally `git checkout data/` undoes it. |

## Outputs

- Always prints a summary line to stdout: `refresh: changed=<bool> season=<name|-> weeks=<list|->`.
- When `GITHUB_OUTPUT` is set, appends `changed`, `season`, and `weeks` to it for the workflow.

## Flags

| Flag | Effect |
|---|---|
| `--delay-ms <n>` | Passed through to the NBA.com scraper (default 400). |

## Scraper changes it relies on

- `scripts/nba-power-rankings-scraper/articlePage.mjs`: HTML fallback for numbered weekly articles with an empty `powerRankings` (research R1).
- `scripts/nba-power-rankings-scraper/scrape.mjs`: rejects a numbered weekly article that doesn't have exactly 30 teams (R2), and keeps saved articles in the index even when they're outside the `--years` window (R3).
- `scripts/nba-power-rankings-scraper/cli.mjs`: exits non-zero when any article failed (R2).
- `scripts/scrape-rosters.mjs`: works out `LAST_END_YEAR` from the date, so `--season 2026-27` is valid (R4).
