# Contract: Player history page and roster pane link

## Page layout

- `h1`: `{player name}`, with the same heading style as Team History (`text-4xl`, `mb-10`)
- Color key (`RatingKey`, shared with the roster pane), right-aligned above the table
- Table inside `Suspense`, with the fallback "Loading…" (`text-muted-foreground`), as in Team History

## Columns

| Column | Header | `title` | Content | Sticky |
|---|---|---|---|---|
| Season | Season | — | `2015-16` | `left-0` |
| Team | Team | — | `TeamLogo` (size-5) + `getTeamName(team)` | yes, after Season |
| Pos … PER | as `specs/019-roster-blocks-minutes/contracts/roster-pane.md` | same | same | — |

Stat cells come from the shared `StatCells`, so they have the same `data-rating`, color classes and gray as the roster pane.

## Rows

- One row per `PlayerStint`, in `getPlayerHistory` order.
- `className`: `group cursor-pointer hover:bg-muted`. Sticky cells use `group-hover:bg-muted`.
- `tabIndex={0}`; Enter triggers the same action as a click.
- Accessible name for the row action: `aria-label="{Team name} {season} season"`.
- No move badges on this page.

## Roster pane change

- The player's name is a link to `/playerHistory/{id}` with `cursor-pointer hover:underline`.
- Move badges are siblings of the link and still pin the other team (FR-003).
- Columns, colors and the key are unchanged. They are now imported from `statColumns.tsx`.
