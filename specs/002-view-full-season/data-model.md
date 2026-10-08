# Data Model: View Full Season (Zoom Out)

This feature introduces no new persisted data and no changes to `SeasonData`, `WeekRanking`, or
`Team` (`src/Chart/types.ts`, `src/Chart/teams.ts`). The entities below describe the in-memory UI
state this feature adds, so requirements can be traced to concrete state.

## View Mode

Component-level state representing how the chart currently renders a season's weeks.

| Field | Description | Validation |
|-------|-------------|------------|
| `zoomedOut` | `boolean`; `true` = full-season view, `false` = windowed view | Lives in `App.tsx`, not `Chart.tsx` (research.md §1), so it survives the per-season remount |
| `start` | First visible week in windowed mode | `1 <= start <= maxStart`; forced to `1` whenever `zoomedOut` is `true` |

**State transitions**:

```text
windowed (start = s) --zoom out--> full-season (start = 1, all weeks 1..maxWeek shown)
full-season           --zoom in--> windowed (start = s, unchanged from before the zoom out)
```

- Toggling either direction clears `hover` but preserves `pinned` (research.md §6).
- Switching the selected season does not reset `zoomedOut` (US3/FR-010); it does reset `pinned`
  and `hover`, same as today, because `Chart.tsx` remounts via `key={season}`.

## Window Width Configuration

A single configured value controlling both the windowed view's span and whether the zoom-out
control appears at all.

| Field | Description | Validation |
|-------|-------------|------------|
| `windowWeeks` | Number of weeks shown at once in windowed mode | Defaults to `10` (`DEFAULT_WINDOW_WEEKS`); maintainer-level configuration, not a visitor-facing control (per spec Assumptions) |
| `canZoomOut` | Derived: whether the zoom-out control is shown | `= maxWeek > windowWeeks`, recomputed from the current season's `maxWeek` on every render (research.md §7), never cached |

## Relationships

`SeasonData.maxWeek` (existing, per season) + `windowWeeks` (configured) ──derive──►
`canZoomOut` ──gates visibility of──► the zoom-out control ──toggles──► `zoomedOut` (in `App.tsx`)
──controls──► which weeks `Chart.tsx` renders and whether paging controls are shown.
