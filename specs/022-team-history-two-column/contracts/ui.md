# UI Contract: Team History Page

The accessible structure tests and assistive technology rely on. Route is unchanged: `#/teamHistory/:team`.

## Shared

- Page heading (h1): `<Team name> Team History`, with the logo, as today.
- No element contains AI summary text or the text "AI-generated summary".

## Season detail (both layouts)

Rendered once per season, as a `section` with `aria-labelledby` pointing at its heading.

| Element | Role / name |
| --- | --- |
| Heading | `heading` (h2), text `<season>` |
| Storylines | `list` named `<season> <Team name> storylines` (unchanged from today), or a paragraph "No storylines for this season" / "Storylines appear once the season is complete" |
| Top players | `list` named `<season> top players by minutes`, up to 6 `listitem`s, each holding a `link` named with the player's full name, `href` `#/playerHistory/<id>` |
| Chart link | `link` named `View <season> chart`, goes to `#/<season>` and pins the team |
| Source | existing `DataSourceBadge` link |

## Desktop (min-width 1024px)

| Element | Role / name |
| --- | --- |
| Left column | `navigation` named `Seasons`, scrollable |
| Left entry | `button` named `<season>`, with `aria-current="true"` on the active entry only; carries `data-season` |
| Entry contents | minimap (decorative SVG, as today) and the `Playoff series` list, whose badges stay separately focusable |
| Right column | scrollable region holding the season detail sections in the same order, each with `data-season` |

Behaviour: see [data-model.md](../data-model.md), "Desktop view state".

## Narrow (below 1024px)

| Element | Role / name |
| --- | --- |
| Each season | Accordion item; the header is a `button` named `<season>` with `aria-expanded` |
| Collapsed | Only the overview (name, minimap, playoff badges) is visible |
| Expanded | The season detail appears directly under its header |

There are no nested scroll containers; the page scrolls normally.
