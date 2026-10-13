# UI Contract: Chart components

## `RankingsChart` (unchanged from the refactor)

| Prop | Type | Meaning |
|------|------|---------|
| `teams` | `TeamRankings[]` | Teams with week-numbered rankings |
| `startWeek`, `endWeek` | number | Target visible range, inclusive; the chart animates toward it |
| `width`, `height`, `margin` | number, number, `Margin` | SVG coordinate space |
| `pinnedTeams` | `Team[]` | Teams to keep highlighted |
| `onClick` | `(team?: Team) => void` | Team clicked, or `undefined` for the background |

## `TeamLabels`

| Prop | Type | Meaning |
|------|------|---------|
| `teams`, `margin`, `height` | as above | |
| `transition` | `ChartTransitionState` | Replaces `week`; gives from/to ranges and progress |
| `activeTeams` | `Team[]` | Replaces `pinnedTeams`; bold these, dim the rest when non-empty |
| `onHover`, `onClick` | `(teamId: Team) => void` | |

## Visible controls (rendered by `App`)

- Buttons named "Earlier", "Later" (disabled at limits and when zoomed out) and "Zoom out" / "Zoom in" (absent when the season fits).
- Readout text `Weeks A–B` or `Full season (Weeks 1–N)`.
- Left/Right arrow keys page the window when zoomed in.
