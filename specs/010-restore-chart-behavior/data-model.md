# Data Model: Restore Chart Behavior After Refactor

No stored data changes. View state only.

## App state

| State | Type | Rules |
|-------|------|-------|
| `season` | string | One of `seasons` |
| `zoomedOut` | boolean | Survives season switch |
| `zoomedInStartWeek`, `zoomedInEndWeek` | number | Stored window, initially `1` and `1 + DEFAULT_WINDOW_WEEKS`; slid inside `1..maxWeek` when read, keeping the span where the season allows |
| `pinnedTeams` | `Team[]` | Zero or one entry today |

Derived each render: `windowEnd = min(zoomedInEndWeek, maxWeek)`, `windowStart = max(1, windowEnd - span)`, `startWeek = zoomedOut ? 1 : windowStart`, `endWeek = zoomedOut ? maxWeek : windowEnd`, `canZoom = windowStart > 1 || windowEnd < maxWeek`.

## Chart state

| State | Type | Rules |
|-------|------|-------|
| `hover` | `{ teamId, week? }` or undefined | Cleared on mouse leave and when `endWeek - startWeek` changes |
| transition | `ChartTransitionState` | From `useChartTransition`; target `{ start: startWeek, span: max(1, endWeek - startWeek) }` |

Derived: `activeTeams = pinnedTeams.length ? pinnedTeams : hover ? [hover.teamId] : []`.

## PlayoffStage

`first-round`, `semis`, `conf-finals`, `finals`, `champion` — the values in `src/data/seasons/*.json`.

## Team label position

`y = interpolate(y(rankFrom), y(rankTo), progress)` where each rank is the team's first ranking with `week` inside that endpoint's range; falls back to the other endpoint; omitted when neither exists.
