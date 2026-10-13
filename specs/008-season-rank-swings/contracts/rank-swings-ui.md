# UI Contract: Rank swings pane

## `RankSwings`

| Prop | Type | Meaning |
|------|------|---------|
| `teams` | `TeamRankings[]` | The selected season's teams |
| `maxWeek` | number | The season's last week, passed through to each minimap |
| `pinnedTeams` | `Team[]` | Current pins; a card is pressed when its team is the only one |
| `onClick` | `(team: Team) => void` | Card clicked |

- Rendered by `App` only when the season is complete, between the zoom control and the team summary.
- Renders nothing when neither direction has a team.
- Exposed as a region labeled "Biggest rank swings".
- Contains up to two groups headed "Biggest risers" and "Biggest fallers"; a group with no teams is absent.
- Each team is a button whose accessible name is `<team name>: rose N places, from A to B` or `<team name>: fell N places, from A to B`, with `aria-pressed` set when that team is pinned.
- Each button visibly shows the team name, the team's `TrendMinimap`, `A → B`, and `▲ N` or `▼ N`.

## `TrendMinimap`

A miniature of one team's line from the fully zoomed-out chart. General purpose: it has no notion of swings, start/end ranks, direction or team identity.

| Prop | Type | Meaning |
|------|------|---------|
| `rankings` | `WeekRanking[]` | The team's recorded weeks for one season |
| `maxWeek` | number | Horizontal extent; week 1 is the left edge, `maxWeek` the right |
| `width`, `height` | number, optional | SVG size; defaults suit a card thumbnail |

- Plots every recorded week; rank 1 is at the top, rank 30 at the bottom.
- The line is colored by vertical position, not by team: green in ranks 1–10, yellow in ranks 11–20, red in ranks 21–30. A segment crossing between bands changes color at the boundary.
- Breaks the line at a missing week instead of bridging it, as the main chart does.
- A team whose data ends before `maxWeek` leaves the remainder blank.
- No axes, labels, dots, hover or click handling.
- Decorative by default (`aria-hidden`); the surrounding element carries the text.

## Changes to existing behavior

- Choosing a season in the season selector clears any pinned team.
- `RankingsChart` and `TeamSummary` props are unchanged.
