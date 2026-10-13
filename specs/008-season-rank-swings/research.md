# Research: Season Rank Swings Pane

## 1. Where swings are computed

- **Decision**: In the browser, at render time, from the `TeamRankings[]` that `loadSeason` already builds.
- **Rationale**: It is a first/last lookup and a sort over at most 30 teams. Precomputing in `build-rankings.mjs` would add a field to nine data files and a second place for the rule to live.
- **Alternatives considered**: A `swings` field in `src/data/seasons/<season>.json` (more data and pipeline surface for no measurable gain); `useMemo` (ruled out by `AGENTS.md`, and the React Compiler already memoizes).

## 2. Completed season

- **Decision**: A season is complete when its `playoffs` contains a team at `PlayoffStage.Champion`. `loadSeason` returns this as `completed`.
- **Rationale**: Same definition as 006 (`data/playoffs.json` has a champion), read from the reduced data the app already has. A season with no `playoffs` key is not complete, which covers the "no completion data" edge case.
- **Alternatives considered**: "Not the newest season" (wrong in the offseason); a `completed` flag written by the build script (duplicates what `playoffs` already says).

## 3. Swing metric

- **Decision**: `change = startRank - endRank`, where start and end are the first and last entries of the team's own `rankings` array. Positive is a rise. Teams with fewer than two entries are skipped.
- **Rationale**: FR-008 and FR-010. Arrays are already in week order. This matters in real data: in 2019-20 the eight teams left out of the restart end at week 21 while the rest end at week 24.
- **Alternatives considered**: Fixed week 1 and `maxWeek` (drops those eight teams or misreports them); peak-to-trough range (the spec's assumption explicitly chooses net change).

## 4. How many teams, and ties

- **Decision**: Three per direction. Sort each direction by magnitude, take the magnitude of the third, and include every team at or above it. Teams with zero change never appear. A direction with no qualifying teams is omitted; if both are empty the pane is not rendered.
- **Rationale**: Three fits one row per direction at 960px and matches SC-001's "within 5 seconds". Across the nine stored seasons this yields 3 cards in 15 of the 18 season-directions and 4 in the other three (2021-22 risers, 2023-24 risers and fallers), so the pane never exceeds 8 cards today. The threshold rule satisfies FR-009 without a special case.
- **Alternatives considered**: Five per direction (a third of the league, dilutes "biggest"); a minimum-magnitude threshold (contradicts the "mild season still shows its largest" edge case).

## 5. The infographic

- **Decision**: A general-purpose `TrendMinimap` component: a miniature of one team's line from the fully zoomed-out chart. It draws every recorded week of the season, with weeks 1 to `maxWeek` across and ranks 1–30 down (rank 1 at the top), and breaks the line at a missing week exactly as the main chart does. It has no axes, labels, dots or interaction. In the pane, text beside it gives `start → end` and an arrow with the magnitude.
- **Color**: The line is not drawn in the team color. It is colored by where it sits: green in ranks 1–10, yellow in ranks 11–20, red in ranks 21–30. This is done with one vertical SVG `linearGradient` in `userSpaceOnUse` units with hard stops halfway between ranks 10 and 11 and between ranks 20 and 21, applied as the stroke. A segment that crosses a band therefore changes color at the boundary rather than taking the color of one of its ends. Each instance gets its gradient id from `useId`. Colors are the bright variants that read on the dark panels: green `#30D158`, yellow `#FFD60A`, red `#FF453A`.
- **Rationale**: Per maintainer direction (2026-10-13), the component will be reused for purposes other than rank swings, so it must not encode the swing concept, and it is colored by rank band rather than by team. It therefore takes only a team's `rankings` and the season's `maxWeek`, and knows nothing about start/end, direction or team identity; the pane supplies the team name and swing numbers as text. Sharing `getYforRank` and the gap rule with the chart keeps the miniature faithful to the full line.
- **Color alternatives considered**: Coloring each week-to-week segment by the rank at one of its ends (a line from rank 8 to rank 15 would be all green or all yellow, misplacing the change); splitting segments at band boundaries by hand (same result as the gradient with more code).
- **Alternatives considered**: A two-point slope graphic (the original plan; simpler, but tied to rank swings and not a miniature of the trend line); rendering `RankingsChart` at a small size (it carries labels, hover, transitions and playoff medals that a thumbnail cannot use).

## 6. Click behavior

- **Decision**: Each card is a `<button>` calling the same handler `App` passes to the chart: pin the team, or unpin it if it is the only pinned team. `aria-pressed` reflects the pinned state.
- **Rationale**: The spec assumes reuse of the existing pin behavior. One handler keeps the pane, the chart and `TeamSummary` in agreement, and clicking a second card replaces the first (FR-006) with no new code.
- **Alternatives considered**: Pane clicks always pin and never unpin (two click behaviors for the same highlight); a separate "pane selection" state (must then be reconciled with `pinnedTeams`).

## 7. Season switch

- **Decision**: The season `<select>` handler clears `pinnedTeams` when it sets the season.
- **Rationale**: FR-007 requires a pane-originated highlight to be cleared. Tracking where a pin came from needs extra state; clearing in the event handler needs none and no `useEffect`. The pane itself is derived from the selected season, so it cannot be stale.
- **Behavior change**: Today a pin made in the chart survives a season switch. After this feature it does not, regardless of where the pin came from. No existing test depends on the old behavior.
- **Alternatives considered**: Record the pin's origin and clear only pane pins (more state for a distinction visitors cannot see); keying the pin by season.

## 8. Zoom

- **Decision**: Clicking a card does not change the zoom or the visible week window.
- **Rationale**: The spec asks only for the highlight. The visitor can zoom out to see the full swing; forcing it would override a view they chose.
