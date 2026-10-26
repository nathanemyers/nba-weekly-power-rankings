# Contracts: Playoff Series Badges

## `PlayoffSeriesBadges` component (`src/components/PlayoffSeriesBadges.tsx`)

```ts
interface PlayoffSeriesBadgesProps {
  series: SeriesResult[] | undefined
  className?: string
}
```

- Renders nothing when `series` is undefined or empty: no wrapper element and no reserved space (FR-008).
- Otherwise renders one badge per entry, in the given order, inside a `role="list"` element labelled "Playoff series". Each badge is a `role="listitem"`.
- Each badge:
  - is a focusable tooltip trigger whose accessible name is the full result text (data-model "Badge")
  - shows the opponent logo (decorative, `alt=""`), then the games count, then the medal emoji (`aria-hidden`)
  - uses the theme roles `series-won` or `series-lost` for its border and tint
  - stops click propagation, so clicks never reach a parent card
- The tooltip shows the same result text on hover and keyboard focus.
- Fits four badges at phone width (375 px) without horizontal scrolling. Wraps if needed.

## Placement

| Where | When | Data |
|---|---|---|
| `src/views/ChartView.tsx`, centre column next to `TeamHistoryButton` | Exactly one team pinned (`getSinglePinnedTeam`) | That team's `playoffSeries` in the selected season |
| `src/components/TeamHistory.tsx`, each season card's header | Always, per card | That card's team `playoffSeries` for that season |

## Playoffs scraper: `scripts/scrape-playoffs.mjs` (changed)

- **CLI:** unchanged (`npm run scrape:playoffs`, `-- --force`).
- **Fetching:** a saved season is reused only if every series has `winnerWins` and `loserWins`. Otherwise it's fetched again. Pacing (3 s) and user agent are unchanged.
- **Logging:** each season's summary line now includes series scores, e.g. `first-round=4-2,4-1,…`.

## Shared module: `scripts/lib/playoffs.mjs` (new)

| Export | Purpose |
|---|---|
| `SLUG_BY_NAME` | Basketball-Reference team name → app slug (moved from the scraper) |
| `parseSeason(html)` | `{ champion, runnerUp, rounds }`, with `winnerWins` and `loserWins` on every series. Throws on any score that's missing or doesn't match. |
| `parseSeriesScores(html)` | Series table rows → `[{ stage, winner, loser, winnerWins, loserWins }]` |
| `hasSeriesScores(season)` | `true` when every series in a saved season has both score fields |
| `teamPlayoffRuns(bracket, season)` | `{ [slug]: SeriesResult[] }` for the processed data. Validates the data-model rules and throws naming the season and team. |

## Build: `scripts/build-rankings.mjs` (changed)

Writes `playoffSeries` from `teamPlayoffRuns` next to the existing `playoffs` stage map. All other output is unchanged.
