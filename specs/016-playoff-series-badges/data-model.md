# Data Model: Playoff Series Badges

## Raw: `data/raw/basketball-reference/playoffs.json` (extended)

The shape is unchanged except for two new fields on each series:

```jsonc
{
  "2005-06": {
    "source": "https://www.basketball-reference.com/playoffs/NBA_2006.html",
    "champion": "mia",
    "runnerUp": "dal",
    "rounds": [
      {
        "round": "first-round",               // first-round | semis | conf-finals | finals
        "series": [
          {
            "teams": ["was", "cle"],
            "winner": "cle",
            "winnerWins": 4,                  // NEW
            "loserWins": 2                    // NEW
          }
        ]
      }
    ]
  }
}
```

**Validation** (enforced in `scripts/lib/playoffs.mjs`, both when scraping and when building):
- `winnerWins === 4` and `0 <= loserWins <= 3`. Games played is `4 + loserWins`, which is 4 to 7.
- `winner` is one of `teams`.
- A completed season (one with a `champion`) has 15 series: 8 first-round, 4 semis, 2 conf-finals and 1 Finals.
- A season counts as already scraped only if every series has both new fields (research §3).

## Processed: `data/processed/seasons/<season>.json` (one new field)

| Field | Type | Notes |
|---|---|---|
| `playoffSeries` | `{ [team slug]: SeriesResult[] }` (optional) | Only on seasons with playoff data. Keyed by every team that played a series. Each list is in round order. |

### SeriesResult

| Field | Type | Notes |
|---|---|---|
| `round` | `"first-round" \| "semis" \| "conf-finals" \| "finals"` | The existing `PlayoffStage` values, excluding `champion`. |
| `opponent` | team slug (`Team`) | The other team in the series. |
| `wins` | int 0–4 | Games this team won. |
| `losses` | int 0–4 | Games the opponent won. |

Derived (not stored): `won = wins === 4`, `games = wins + losses`.

**Rules**
- Exactly one of `wins` and `losses` is 4. The other is 0–3.
- A team's list has 1 to 4 entries, with rounds strictly increasing. Every entry except the last is a win. The last entry is a loss, unless it's a won Finals.
- The existing `playoffs[slug]` stage must equal the last entry's round when that series was lost, or `champion` when it's a won Finals (SC-002).

`build-rankings.mjs` checks all of these and stops with an error naming the season and team if any fails (FR-011).

## App

- `src/schemas/season.ts`: new `SeriesResultSchema`, and `playoffSeries: z.partialRecord(z.enum(Team), z.array(SeriesResultSchema)).optional()` on `SeasonDataSchema`.
- `TeamRankings` (in `src/types/nba.ts`): new optional `playoffSeries?: SeriesResult[]`, filled in by `loadSeasons`. It stays undefined for teams without series.
- `SeriesRound` type: `Exclude<PlayoffStage, PlayoffStage.Champion>`.

## Badge (view model)

Built from one `SeriesResult` for display:

| Shown | From |
|---|---|
| Opponent logo | `TeamLogo team={opponent}` |
| Games | `wins + losses` |
| Medal | `PLAYOFF_MEDALS[round].icon`, or `PLAYOFF_MEDALS.champion.icon` when `round === 'finals' && won` |
| Colour | `series-won` when `won`, otherwise `series-lost` |
| Accessible text | `"<Round label>: <beat \| lost to> <opponent full name> <wins>-<losses>"`, e.g. "Conference finals: beat Toronto Raptors 4-2" or "First round: lost to Detroit Pistons 0-4" |
