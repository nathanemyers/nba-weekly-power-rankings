# Data Model: Current Season Support and Weekly Rankings Refresh

There are no new persisted data shapes. Below are the existing shapes this feature relies on, plus the rules it adds.

## Raw weekly article: `data/raw/nba/articles/<season>/<slug>.json`

Same shape as today (see `scripts/nba-power-rankings-scraper/articlePage.mjs`).

| Field | Rule added by this feature |
|---|---|
| `rankings[]` | Filled from `powerRankings` or, if that's empty, from the HTML fallback (research R1). Each entry: `rank`, `previousRank` (`null` from the fallback), `teamId`, `teamName`, `teamLink`, `summaryHtml`, `summaryText`. |
| `hasStructuredRankings` | `true` when `rankings` came from either source. |
| `rawText` | Still only set when no rankings could be parsed. |

**Validation, numbered weekly articles only** (slug matches `^power-rankings-\d{4}-\d{2}-week-\d+$`, fetched in this run): `rankings` has exactly 30 entries with distinct `teamId`s that are all in `TEAM_SLUGS`, and ranks 1–30 each appear once. If this fails, the article is not saved and the run fails (R2).

## Raw article index: `data/raw/nba/index.json`

Rows keep their current shape. **New rule**: the index lists every article from the listing that is inside the `--years` window or already saved on disk (R3). A run never removes rows for saved articles.

## Raw rosters: `data/raw/basketball-reference/rosters/<season>.json`

Unchanged shape. The current season's file is re-fetched whenever the refresh collects a new week (R4).

## Processed season and index: `data/processed/seasons/`

Unchanged. `build-rankings.mjs` produces `2026-27.json` and puts `2026-27` first in `index.ts`. The in-progress season has no `playoffs`, `playoffSeries`, `summaries`, or `storylines`, and no `champion` in its index entry.

## Derived in the app

- **Current season**: `seasonIndex[0]`, the newest season with at least one structured numbered week. Already `latestSeason`.
- **In progress**: a season index entry with no `champion`. The season picker labels it "In progress".

## Refresh run (workflow state, not persisted)

```text
start ─► scrape articles ─┬─ failed (fetch/parse/<30 teams) ─────────────► FAILED (no PR)
                          ├─ nothing new ─────────────────────────────────► NO-OP (no PR, no file changes)
                          └─ new week(s) ─► scrape current rosters ─► build:rankings
                                              │ failed ───────────────────► FAILED (no PR)
                                              ▼
                                   open/update PR on data/weekly-refresh
                                              ▼
                               lint + test + build ─┬─ pass ─► merge PR ─► dispatch deploy ─► PUBLISHED
                                                    └─ fail ─► PR left open, job fails ─────► FAILED (PR open)
```

"New" means at least one numbered weekly article that wasn't saved before this run. Offseason or notebook articles alone don't count.
