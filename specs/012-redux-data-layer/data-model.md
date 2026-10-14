# Data Model: Centralized Data Layer

## Validated input: `SeasonData` (schema in `src/schemas/season.ts`)

| Field | Type | Rule |
|-------|------|------|
| `season` | string | non-empty |
| `maxWeek` | integer | ≥ 1 |
| `rankings` | partial record `Team → WeekRanking[]` | keys must be a known `Team` |
| `playoffs?` | partial record `Team → PlayoffStage` | keys `Team`, values `PlayoffStage` |
| `summaries?` | partial record `Team → string` | keys `Team` |

`WeekRanking`: `week` integer ≥ 1, `rank` integer 1–30, `record?` string, `summary` string.

The schemas don't check relationships between fields, such as `week ≤ maxWeek`. Today's data doesn't need it and the chart tolerates it. The schemas can be tightened later if needed.

## Store state (`RootState`)

```text
seasons     { order: string[]; bySeason: Record<string, SeasonView>; invalid: InvalidSeason[] }
navigation  { season: string | undefined }
chartView   { zoomedOut: boolean; windowStart: number; windowEnd: number }
selection   { pinnedTeams: Team[] }
```

- **SeasonView**: `{ teams: TeamRankings[]; maxWeek: number; completed: boolean }`. It is built once by `loadSeasons`. `teams` contains only teams with at least one ranking, in the order of `Teams`. `completed` is true when any playoff value is `Champion`.
- **InvalidSeason**: `{ season: string; message: string }`, where `message` is the output of `z.prettifyError`.

### Initial state

| Slice | Initial value |
|-------|---------------|
| seasons | the result of `loadSeasons(seasons, seasonData)` |
| navigation.season | `order[0]`, or `undefined` if `order` is empty |
| chartView | `zoomedOut: true`, `windowStart: 1`, `windowEnd: 1 + DEFAULT_WINDOW_WEEKS` |
| selection | `pinnedTeams: []` |

## Actions and transitions

| Action | Slice(s) | Effect |
|--------|----------|--------|
| `navigation/seasonSelected(season)` | navigation, selection | Sets `season`. Clears `pinnedTeams`. Does not touch `chartView`. |
| `chartView/zoomToggled()` | chartView | Flips `zoomedOut`. |
| `chartView/windowSet({start,end})` | chartView | Sets the window, with no clamping. Only `pageWindow` calls it. |
| `pageWindow(delta)` thunk | chartView | Clamps `delta` to `[1 − effectiveStart, maxWeek − effectiveEnd]`. If the result is ≠ 0, dispatches `windowSet` with the effective window shifted by that amount. |
| `selection/pinToggled(team?)` | selection | If `team` is set and not already pinned, sets `pinnedTeams` to `[team]`. Otherwise sets it to `[]`. |

## Selectors (all return primitives or stored references)

These are the same derivations App.tsx does today, moved into the store.

- `selectSeasonOrder`, `selectSeason`, `selectSeasonView` (returns `bySeason[season]`), `selectZoomedOut`, `selectPinnedTeams`
- `selectWindowEnd` = `min(windowEnd, maxWeek)`
- `selectWindowStart` = `max(1, windowEnd' − (windowEnd − windowStart))`
- `selectStartWeek` / `selectEndWeek`: either `1`/`maxWeek` when zoomed out, or the effective window
- `selectCanPageEarlier` / `selectCanPageLater` / `selectCanZoom`
- `selectPinnedTeam`: the `TeamRankings` entry when exactly one team is pinned, otherwise `undefined`
