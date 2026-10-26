# Contract: Roster pane (UI)

## Placement

`src/views/ChartView.tsx`, below the chart controls and the button group, inside the `data ? …` branch. Rendered only when `singlePinnedTeam` is set and that team's `roster` for the selected season is non-empty; otherwise nothing is rendered (no heading, no empty state).

## Component: `src/components/RosterPane.tsx`

- Reads the pinned team and selected season from the store; takes no props. Data comes from selectors `getPinnedTeamRoster` and `getPinnedTeamCoaches` returning `RosterEntry[] | undefined` and `CoachStint[] | undefined`.
- Heading: "{Team name} roster, {season}" (for example "Toronto Raptors roster, 2018-19").
- Under the heading, a coach line: "Head coach: Nick Nurse (58-24)". With more than one stint: "Head coaches: Fred Hoiberg (5-19) → Jim Boylen (17-41)", in data order, with the arrow's accessible text "then". Hidden if the team has no coach data.
- Uses shadcn/ui `Table` (`src/components/ui/table.tsx`, generated, not edited).

| Column | Header | Content |
|---|---|---|
| Player | Player | Name, plus a move mark when `joinedFrom` and/or `leftFor` is set |
| Pos | Pos | `pos` |
| Age | Age | `age` |
| G | G | `g` |
| PTS | PTS | `pts`, one decimal |
| REB | REB | `trb`, one decimal |
| AST | AST | `ast`, one decimal |
| STL | STL | `stl`, one decimal |
| TOV | TOV | `tov`, one decimal |
| PER | PER | `per`, one decimal, `–` when `null` |

- Header cells carry an `abbr`/`title` with the full stat name (for example "Points per game").
- Rows render in the order given by the data (already sorted at build time).
- The player column stays visible when the table scrolls horizontally on narrow screens (sticky first column). The page itself never scrolls horizontally.

## Move mark

- An arrow-in mark for `joinedFrom`, an arrow-out mark for `leftFor` (lucide icons), each wrapped in the existing shadcn `Tooltip`.
- Tooltip and accessible name: "Joined from {full team name} mid-season" / "Left for {full team name} mid-season". The mark is focusable so keyboard users get the tooltip.
- Colors come from theme tokens in `src/index.css` only.

## Interactions

- Changing the season or the pinned team re-renders the pane for the new pair; unpinning or pinning a second team hides it.
- No sorting controls (spec: games played is the only order).
