# UI Contract: Detail Tabs Panel

The panel sits on the season page directly below the chart and `ChartControls`. It replaces the `ButtonGroup` (AI Summary / Season Trends / Team History), the standalone `RosterPane` section, and the standalone `SeasonAwardsPane` section.

## Tabs, in display order

| Tab | Label | Available when | Content |
|---|---|---|---|
| `summary` | Summary | Exactly one team pinned **and** that team has an AI summary for the season | Team name, "AI-generated summary" badge, summary text |
| `trends` | Trends | Risers or fallers list is non-empty | "Biggest Up" / "Biggest Down" rows of logo and trend minimap toggles. These wrap on narrow screens. Activating one pins that team. |
| `roster` | Roster | Exactly one team pinned **and** that team has a non-empty roster | Logo heading (team name visually hidden below `sm`), coach line, rating key, roster table |
| `awards` | Awards | The season has at least one award group | Season awards and honors cards (current `SeasonAwardsPane` body) |

All four tabs are always shown, and unavailable tabs are **disabled** (changed at the user's request). The tab bar fills the panel's full width, with the tabs sharing it equally.

## Default tab (used when the user has not chosen one, or their choice is unavailable)

1. One team pinned: `roster`, else `summary`, else `trends`, else `awards`.
2. Otherwise: `awards`, else `trends`.
3. No tab available: the panel is not rendered.

## Behavior

- The user's choice persists across pin changes while it stays available. It is not stored in the URL or browser storage.
- Tabs are keyboard operable: arrow keys move between tabs and Tab moves into the panel, with roles `tablist` / `tab` / `tabpanel` (shadcn Tabs).
- All tab triggers have `cursor-pointer`.
- Content never requires hover to view.

## Roster table columns by width

| Width | Columns |
|---|---|
| < 640px | Player (short name, e.g. "L. James", plus move marks), PTS, REB, AST |
| ≥ 640px | Player (full name, plus move marks), Pos, Age, G, MIN, PTS, REB, AST, STL, BLK, PER |

Below 640px, the full player name stays in the accessible name (screen-reader text) and in the link's `title`.

## Rankings chart by width

| Width | Layout |
|---|---|
| < 640px | Compact viewBox. Team labels are logos, no left medal glyphs. Tap a line or logo to pin. Tap a dot to show its tooltip without unpinning. |
| ≥ 640px | Current layout, unchanged |
