# UI Contract: Trends Lists

Rendered by `RankSwings` inside the Trends tab panel.

## Structure

```text
container (1 column; 2 columns at sm and up)
├── section "Most improved"
│   ├── h3  "Most improved"
│   └── ol  (5 li, largest rise first)
└── section "Most declined"
    ├── h3  "Most declined"
    └── ol  (5 li, largest fall first)
```

## Row

Each `li` contains one toggle button (`aria-pressed`) with, left to right on a single line:

1. Team logo, `size-5`, alt "<Team Name> logo"
2. Team name, truncates when space runs out
3. Trend minimap, 20px tall
4. Signed rank change (`+N`, `−N`, or `0`), colored rank-up / rank-down / rank-mid, with an accessible label "up N places" / "down N places" / "no change"

## Behavior

- Click: dispatches `setPinnedTeams([team])`.
- `aria-pressed="true"` only on the row whose team is the single pinned team.
- Hover: pointer cursor and muted background.
- Below `sm`: improving section renders fully above declining section; no horizontal scroll at 375px.
