# Data Model: Compact Trends Lists

No new stored data. One derived shape, already returned by `src/data/analysis.ts`.

## TrendEntry

| Field | Type | Description |
|-------|------|-------------|
| `team` | `Team` | Team id. |
| `value` | `number` | Net rank change: first in-season rank minus final rank. Positive = improved, negative = declined, 0 = no change. |

### Derivation rules

- Start rank = the team's second recorded ranking (the first is the preseason ranking); falls back to the first ranking when only one exists.
- End rank = the team's last recorded ranking.
- **Most improved**: all season teams sorted by `value` descending, ties by team id ascending, first 5.
- **Most declined**: all season teams sorted by `value` ascending, ties by team id ascending, first 5.
- A list has fewer than 5 entries only when the season has fewer than 5 teams (test fixtures only).

## Selection state (existing)

- `chart.pinnedTeams` in the Redux store. A row is selected when `pinnedTeams` is exactly `[team]`. Clicking a row dispatches `setPinnedTeams([team])`.
