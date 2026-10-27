# Contract: Roster pane columns and ratings (delta from 017)

Supersedes the column table, the stat colors section and the key label in `specs/017-team-roster-stats/contracts/roster-pane.md`. Placement, heading, coach line, move badges and the key bar are unchanged.

## Columns

| Column | Header | `title` | Content | Rated |
|---|---|---|---|---|
| Player | Player | — | name + move badges | — |
| Pos | Pos | Position | `pos` | — |
| Age | Age | Age on February 1 of the season | `age` | — |
| G | G | Games played | `g` | — |
| MIN | MIN | Minutes per game | `mpg`, one decimal | — |
| PTS | PTS | Points per game | `pts`, one decimal | yes |
| REB | REB | Rebounds per game | `trb`, one decimal | yes |
| AST | AST | Assists per game | `ast`, one decimal | yes |
| STL | STL | Steals per game | `stl`, one decimal | yes |
| BLK | BLK | Blocks per game | `blk`, one decimal | yes |
| PER | PER | Player Efficiency Rating | `per`, one decimal, `–` when `null` | yes |

There is no TOV column.

## Rated cell styling

- Qualifying player (`isRatable`): `text-stat-{elite|good|fair|poor}` from a fixed lookup and `data-rating` set to the rating; a `null` value gets neither.
- Non-qualifying player: `text-muted-foreground` and `data-rating="unrated"` on every rated cell, including a `–`.
- Unrated columns (Pos, Age, G, MIN) and the Player cell are never gray.

## Color key accessible name

`Stat colors, lowest to highest: red 25%, yellow 50%, green 15%, purple 10%. Players under 10 games or 10 minutes per game are gray and not rated.`

The sentence about turnovers is removed. The numbers 10 come from `MIN_RATED_GAMES` and `MIN_RATED_MINUTES`.
