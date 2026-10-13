# Tasks: Restore Chart Behavior After Refactor

**Input**: Design documents from `/specs/010-restore-chart-behavior/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chart-props.md, quickstart.md

**Tests**: Included — FR-017 requires the suite to be ported to the refactored API.

## Phase 1: Setup

- [X] T001 Record the failing baseline (`npm run lint`, `npm run build`, `npm test`) for comparison in specs/010-restore-chart-behavior/quickstart.md terms

## Phase 2: Foundational (blocks all stories)

- [X] T002 Set `PlayoffStage.SecondRound = "semis"` and `PlayoffStage.Champion = "champion"` in src/types.ts
- [X] T003 Move `PLAYOFF_MEDALS` from src/Chart/TeamLabels.tsx to src/Chart/utils.ts and add `firstRankingInRange(rankings, start, end)` there (fixes the react-refresh lint error)
- [X] T004 In src/Chart/Chart.tsx call `useChartTransition` with target `{ start: startWeek, span: max(1, endWeek - startWeek) }` and drive the x-scale, ticks, playoffs marker, lines and dots from the animated values

## Phase 3: User Story 1 - Read the chart correctly (P1)

**Independent Test**: Label rows, week ticks and medals match the fixture data in src/Chart/Chart.test.tsx.

- [X] T005 [US1] Render an inclusive tick for every visible week, limited to weeks 1..last data week, inside a `week-ticks` group in src/Chart/Chart.tsx
- [X] T006 [US1] Rework src/Chart/TeamLabels.tsx to take `transition` and `activeTeams`, placing each label and medal at `interpolate(y(rankFrom), y(rankTo), progress)` using week-number lookup and omitting teams with no ranking in view
- [X] T007 [US1] Restore the right-edge medal column in src/Chart/Chart.tsx, shown only when `endWeek` reaches the last data week, each medal at the team's last ranking within the target range
- [X] T008 [US1] Restore `max-width` on the chart wrapper from the `width` prop in src/Chart/Chart.tsx

## Phase 4: User Story 2 - Move around the season (P1)

**Independent Test**: src/App.test.tsx drives paging, keys, zoom and season switching against mocked season data.

- [X] T009 [US2] Keep the separate `zoomedInStartWeek`/`zoomedInEndWeek` states in src/App.tsx (the span will become variable), page both together, and slide the pair inside `1..maxWeek` when read per data-model.md
- [X] T010 [US2] Add the controls row in src/App.tsx: "◀ Earlier", readout (`Weeks A–B` / `Full season (Weeks 1–N)`), "Later ▶", disabled at limits and when zoomed out
- [X] T011 [US2] Show the zoom button in src/App.tsx only when the window does not already cover the whole season
- [X] T012 [US2] Add left/right arrow-key paging in src/App.tsx, inactive while zoomed out

## Phase 5: User Story 3 - Inspect and follow a team (P2)

**Independent Test**: Hover and click interactions in src/Chart/Chart.test.tsx and pin toggling in src/App.test.tsx.

- [X] T013 [US3] In src/Chart/Chart.tsx derive `activeTeams = pinnedTeams.length ? pinnedTeams : hover ? [hover.teamId] : []` and use it for line weight, dimming, dots and `TeamLabels`
- [X] T014 [US3] In src/Chart/Chart.tsx show the tooltip only for an active team, with the team's full name, and clear hover when `endWeek - startWeek` changes
- [X] T015 [US3] Toggle pinning in src/App.tsx: clicking the pinned team or the background clears `pinnedTeams`

## Phase 6: Tests & Polish

- [X] T016 [P] Rewrite src/Chart/Chart.test.tsx against the prop-driven API (ticks, gaps, labels, medals, medal column, animation, retarget, reduced motion, hover, tooltip)
- [X] T017 [P] Create src/App.test.tsx with `./data/seasons` mocked (paging, keys, readout, disabled states, zoom round trip, zoom visibility, season switch clamp, zoom carry-over, pin toggle)
- [X] T018 Run `npm run lint`, `npm run build`, `npm test` until all pass
- [X] T019 Walk through specs/010-restore-chart-behavior/quickstart.md in the browser

## Dependencies

- T002–T004 before everything else; T006 depends on T003 and T004.
- US1, US2, US3 touch overlapping files (src/Chart/Chart.tsx, src/App.tsx), so run them in order.
- T016 and T017 are parallel with each other once Phases 3–5 are done.

## Implementation Strategy

MVP is Phase 2 + US1 (the chart tells the truth again). US2 restores navigation, US3 restores inspection; each leaves the app working.
