# Data Model: Responsive UI and Tabbed Detail Panel

This feature adds no new persisted or loaded data. Everything below is in-memory UI state or derived values over the existing season data.

## DetailTabId

`'summary' | 'trends' | 'roster' | 'awards'`

## DetailTab (derived per render)

| Field | Type | Source |
|---|---|---|
| `id` | `DetailTabId` | constant |
| `label` | string | "Summary", "Trends", "Roster", "Awards" |
| `available` | boolean | the availability rules in [contracts/detail-tabs.md](contracts/detail-tabs.md) |

**Selection state**

- `chosenTab: DetailTabId | undefined` is local `useState` in `DetailTabs`. It is set when the user clicks a tab and is never reset by an effect.
- `shownTab` is derived on each render: `chosenTab` if it is available, otherwise the default tab, otherwise none. When no tab is available, the whole panel is not rendered.

## StatColumn (extended)

The existing type in `src/components/PlayerStats/statColumns.tsx` gets one new field:

| Field | Type | Notes |
|---|---|---|
| `compact` | `true \| undefined` | New. Set on PTS, REB, and AST, which are the only columns visible below `sm`. |

## ChartLayout

A constant pair in `src/constants.ts`, selected by `useMediaQuery('(min-width: 640px)')`.

| Field | Wide (current) | Compact (phone) |
|---|---|---|
| `width` | 960 | ~400 |
| `height` | 600 | ~560 |
| `margin` | `{top:30,right:120,bottom:60,left:190}` | narrow left (~44, room for 22px logos), right ~70 |
| team label | text name | logo `<image>` |
| left medal glyph | shown | hidden |

The exact compact numbers are tuned during implementation against a 375px viewport.

## shortPlayerName(name: string): string

- Splits on the first space: `"<first char of first token>. <remainder>"`.
- A name with no space is returned unchanged.
- Only used for display. Full names stay in the data and in accessible text.
