# Quickstart: Validate Responsive UI and Tabbed Detail Panel

## Prerequisites

- `npm install`
- Do **not** run `npm run build:summaries`. The existing processed data is enough.

## Automated checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

Expected: all pass. The tests cover:

- `shortPlayerName` cases (simple, suffix, hyphenated first name, single-word name).
- Tab availability and defaults per [contracts/detail-tabs.md](contracts/detail-tabs.md):
  - no pin shows Awards
  - one pin with a roster shows Roster
  - a pin with no roster falls back to Summary
  - a chosen tab survives a pin change while it is still available
- The roster renders PTS/REB/AST for every player and keeps the full name accessible.
- The Trends tab pins a team when one is activated.

## Manual viewport pass

Run `npm run dev`, then open a completed season (e.g. `#/2024-25`) at each width: **375×812**, **768×1024**, **1280×800**.

| Check | Expected |
|---|---|
| Page horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`) | No scroll at all three widths, on season, team history (`#/teamHistory/bos`), and player history (`#/playerHistory/jamesle01`) pages |
| Chart at 375 | Whole chart visible, logo labels, text legible |
| Tap a line or logo | Team pinned. Roster tab shown. |
| Tap a dot of the pinned team | Tooltip shows. Team stays pinned. |
| Roster tab at 375 | Logo heading without the written name, columns Player/PTS/REB/AST, names like "L. James", no table scroll |
| Roster tab at 768 / 1280 | All columns, full names, team name in heading |
| Unpin | Awards tab shown. Summary and Roster tabs hidden. |
| Trends tab, tap a team | That team is pinned |
| Keyboard (desktop) | Arrow keys still pan the chart when focus is not in the tab list. Tabs are reachable and switchable with the keyboard. |
| Rotate 375 → landscape (812 wide) | Layout switches to wide without a reload |

## Base-path check

Run `npm run build && npm run preview` and confirm the logo images in the compact chart load under the configured base path.
