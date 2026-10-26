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
| Player | Player | Name on the left; move badges right-aligned in the same cell when `joinedFrom` and/or `leftFor` is set |
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

- Each move is a shadcn `Badge` (outline) holding an arrow then the other team's logo (`TeamLogo`, decorative `alt=""`): lucide `ArrowLeft` for `joinedFrom` (came from that team), `ArrowRight` for `leftFor` (went to that team). A player with both shows the joined badge first.
- Badges sit at the right edge of the Player cell (the cell's content is a `justify-between` row: name left, badges right).
- The arrow is colored by the theme tokens `--move-joined` (green, `text-move-joined`) for `joinedFrom` and `--move-left` (red, `text-move-left`) for `leftFor`; the logo keeps its own colors.
- The badge renders as a `<button>` (`Badge asChild`). Clicking it dispatches `setPinnedTeams([team])`, pinning the other team in the same season.
- Each badge is wrapped in the existing shadcn `Tooltip`.
- Tooltip and accessible name: "Joined from {full team name} mid-season" / "Left for {full team name} mid-season". The badge button carries that accessible name, so keyboard users get the tooltip on focus and can pin the team with Enter or Space.
- Colors come from theme tokens in `src/index.css` only.

## Stat colors

- Columns PTS, REB, AST, STL, TOV and PER are rated by `statRating(player, stat)` in `src/components/statRating.ts`, which holds `STAT_BREAKPOINTS`, `MIN_RATED_GAMES = 10` and `MIN_RATED_MINUTES = 10`.

| Stat | Low | High | Below low | Low to high | High and up |
|---|---|---|---|---|---|
| `pts` | 6 | 13.5 | poor | fair | good |
| `trb` | 2.5 | 5.5 | poor | fair | good |
| `ast` | 1 | 3 | poor | fair | good |
| `stl` | 0.5 | 1 | poor | fair | good |
| `tov` | 0.9 | 1.8 | good | fair | poor |
| `per` | 11 | 17 | poor | fair | good |

- `good`, `fair` and `poor` map to the text classes `text-stat-good`, `text-stat-fair` and `text-stat-poor` (theme tokens `--stat-good`, `--stat-fair`, `--stat-poor` in `src/index.css`) through a fixed lookup, never a built class name. Each rated cell carries `data-rating`.
- Unrated: players under 10 games or 10 minutes per game, and `per: null`.
- A note under the table explains the colors in words.

## Interactions

- Changing the season or the pinned team re-renders the pane for the new pair; unpinning or pinning a second team hides it.
- No sorting controls (spec: games played is the only order).
