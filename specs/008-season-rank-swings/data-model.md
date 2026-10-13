# Data Model: Season Rank Swings Pane

Nothing is stored. Everything below is derived from `TeamRankings[]` for the selected season.

## Rank swing (derived, per team per season)

| Field | Type | Rules |
|-------|------|-------|
| `team` | `TeamRankings` | The team, including the `rankings` its minimap draws |
| `startRank` | number | `rank` of the team's first recorded week |
| `endRank` | number | `rank` of the team's last recorded week |
| `change` | number | `startRank - endRank`; positive is a rise, negative a fall |

A team with fewer than two recorded weeks has no swing.

## Biggest swings (derived, per season)

`{ risers: RankSwing[], fallers: RankSwing[] }`

- `risers`: swings with `change > 0`, largest first.
- `fallers`: swings with `change < 0`, largest drop first.
- Each list holds the top 3 by magnitude plus every team tied with the third.
- Order within a tie follows the `Teams` list, so output is stable.
- Either list may be empty.

## Season completion (derived)

`completed` is true when the season's `playoffs` has a team at `PlayoffStage.Champion`. Returned by `loadSeason` alongside `teams` and `maxWeek`.

## View state

No new state. The pane is shown when `completed` is true and at least one list is non-empty. The highlighted card is whichever team is the single entry in `pinnedTeams`.

State change to existing behavior: selecting a season sets `pinnedTeams` to `[]`.
