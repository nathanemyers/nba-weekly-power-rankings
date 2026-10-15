# Quickstart: Validating the Tooltip Fixes

## 1. Automated checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

All three must pass. The new chart tests in `src/components/Chart/Chart.test.tsx` cover every row of [contracts/chart-ui.md](contracts/chart-ui.md).

## 2. Pinned team's dots in a crowded area (User Story 1)

```bash
npm run dev
```

1. Open the 2025-26 season and pin a team whose line runs through the crowded middle ranks, such as a team ranked 10–20 all season.
2. Hover each of its dots, especially where other lines cross it. Every dot shows its tooltip (SC-001).
3. In DevTools, check that the pinned team's `<g>` is the last group inside the clipped plot group.
4. Unpin the team. Overlapping areas behave as they did before this change.

## 3. Right-edge tooltip width (User Story 2)

1. Pin any team and hover the dot for its final week. The tooltip opens to the left of the dot, is about as wide as a mid-season tooltip (about 320 px on desktop), and wraps to a few lines (SC-002).
2. Hover a dot just right of the middle of the chart. The tooltip opens to the left. Hover a dot just left of the middle; the tooltip opens to the right.
3. Resize the browser to phone width (375 px). The last-week and mid-season tooltips have equal widths, and neither goes past the chart's edges (SC-003).
4. Zoom in and page through the season. Tooltips follow the same rules during and after the animation.
