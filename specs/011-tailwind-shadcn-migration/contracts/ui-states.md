# Contract: UI States and Roles Exposed to Tests

Styling that depends on state is driven by attributes on the element. Tests assert these attributes; they do not assert colors or class names.

## State attributes (new)

| Element | Attribute | Values | Meaning | Theme role applied |
| --- | --- | --- | --- | --- |
| Team label (`<text>` in the chart) | `data-state` | `active` | Hovered or pinned | `foreground` |
| | | `dimmed` | Another team is active | `dim` |
| | | `idle` | No team is active | `foreground-soft` |
| Rank change in a swing card | `data-direction` | `up` / `down` | Rose / fell over the season | `rank-up` / `rank-down` |
| Trend minimap gradient `<stop>` | `data-band` | `top` / `middle` / `bottom` | Which third of the league the band covers | `rank-up` / `rank-mid` / `rank-down` |
| Rank-swing card (library Toggle) | `data-state` | `on` / `off` | Team is pinned / not | `accent` surface when `on` |

The minimap keeps four stops in the order top, middle, middle, bottom, at the same offsets as today.

## Preserved as-is

These are what existing tests query and assert. The conversion MUST NOT change them.

| Element | Preserved |
| --- | --- |
| Season picker | A native `<select>`; role `combobox`; option values are season keys |
| Earlier / Later / Zoom in / Zoom out | Role `button` with those accessible names; `disabled` when unavailable |
| Chart | `<svg>` with role `img`; click on empty area clears the pin; `mouseleave` clears hover |
| Team label | `<text>` containing the team name; `font-weight` attribute `700` when active, else `400`; `y` attribute |
| Team line | `stroke` attribute equal to the team's color; `stroke-width` and `opacity` attributes |
| Rank-swing card | Role `button`; `aria-pressed`; `aria-label` in today's sentence form |
| Rank-swings panel | Role `region`; `aria-label="Biggest rank swings"`; headings "Biggest Improvements" and "Biggest Fall Offs" at heading role |
| Team summary panel | Role `region`; `aria-label="AI-generated summary for <team>"`; team name at heading role |
| Trend minimap | `aria-hidden` `<svg>`; `viewBox`, gradient `id` wiring, `gradientUnits="userSpaceOnUse"`, path `d` |
| GitHub link | `aria-label="View this project on GitHub"`; opens in a new tab |
| Keyboard | Left/right arrow keys page by one week when zoomed in |

## Test migration

| Today's assertion | Becomes |
| --- | --- |
| Team label `fill` is `#f5f5f7` | `data-state` is `active` |
| Team label `fill` is `#5c5c63` | `data-state` is `dimmed` |
| Team label `fill` is `#d1d1d6` | `data-state` is `idle` |
| Minimap stops' `stop-color` are `#30D158`, `#FFD60A`, `#FFD60A`, `#FF453A` | Stops' `data-band` are `top`, `middle`, `middle`, `bottom` |

No other assertion should need to change. If one does, that is a parity regression to investigate, not a test to rewrite.
