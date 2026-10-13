# Research: Restore Chart Behavior After Refactor

## 1. Where each lost behavior belongs in the new structure

- **Decision**: Navigation (window position, zoom, arrow keys, readout, paging and zoom controls, pin toggling) lives in `App`. Presentation (animation, hover, tooltip, labels, medals) lives in `RankingsChart` / `TeamLabels`.
- **Rationale**: The refactor made `App` the owner of `zoomedOut`, the window, and `pinnedTeams`, and made the chart take `startWeek`/`endWeek`. Behaviors follow the state they read or write.
- **Alternatives considered**: Moving `start`/`pinned` back into the chart (reverts the refactor); passing `zoomedOut`/`maxWeek` into the chart (widens the new, narrower interface for no gain).

## 2. Window state shape

- **Decision**: `App` keeps separate `zoomedInStartWeek` and `zoomedInEndWeek` states, as the refactor introduced them. Paging moves both by the same amount. On read, the pair is slid back inside the season (`end = min(end, maxWeek)`, `start = max(1, end - span)`).
- **Rationale**: The number of visible weeks will become variable when the chart responds to window size, so the span must be state, not a constant. Sliding on read needs no effect and fixes FR-002 after a season switch.
- **Alternatives considered**: A single start plus a constant span (rejected: blocks the planned responsive span); an effect that resets the window on season change (extra `useEffect`, one wrong frame).

## 3. Animation

- **Decision**: Call the existing `useChartTransition({ start: startWeek, span: endWeek - startWeek })` inside `RankingsChart` and feed the animated values to the x-scale.
- **Rationale**: The hook already implements easing, mid-flight retargeting, exact settling, and reduced motion, and is driven purely by a target, which is what the new props are.
- **Alternatives considered**: CSS transitions on SVG attributes (cannot animate path `d` consistently or retarget labels).

## 4. Team label position

- **Decision**: `TeamLabels` receives the transition state and interpolates between the team's rank in the first ranked week of the "from" range and of the "to" range, looked up by week number.
- **Rationale**: The refactor indexed `rankings[week]` by array position, which is off by one and throws when a team has fewer entries (2019-20 season). The interpolation restores the label glide from spec 003.
- **Alternatives considered**: Position from the live animated window (jumps when a boundary crosses an integer week).

## 5. Hover, tooltip, pin

- **Decision**: Highlighted team = pinned team if any, else hovered team. The tooltip shows only for the highlighted team. `App` toggles: clicking the pinned team clears it. The chart clears hover when the visible span changes, using the adjust-state-during-render pattern.
- **Rationale**: Matches pre-refactor behavior; span changes exactly when zoom changes, so the chart needs no `zoomedOut` prop and no effect.

## 6. Playoff stages and medal column

- **Decision**: Set `PlayoffStage.SecondRound = "semis"` and `PlayoffStage.Champion = "champion"`. Show the right-edge column when `endWeek` reaches the last week present in `teams`.
- **Rationale**: All nine data files and both scripts use `semis`/`champion`; the enum's `second-round`/`champ` matched nothing, hiding 5 of 16 medals per season. Deriving the last week from `teams` avoids a `maxWeek` prop.

## 7. Tests

- **Decision**: `Chart.test.tsx` renders `RankingsChart` with fixture teams and explicit props. `App.test.tsx` mocks `./data/seasons` with fixtures and drives the real `App`.
- **Rationale**: A hand-written harness would duplicate `App`'s paging logic and test the copy, not the app.
