# Quickstart: Validating the Tailwind CSS and shadcn/ui Conversion

Run these after implementation to confirm the feature meets its spec. Roles and state attributes referenced here are defined in [contracts/theme-tokens.md](contracts/theme-tokens.md) and [contracts/ui-states.md](contracts/ui-states.md).

## Prerequisites

```bash
npm install
```

Do not run `npm run build:summaries` or `scripts/build-summaries.mjs`; they spend API tokens and are unrelated to this feature.

## 1. Quality gates (SC-001)

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

Expected: all three pass. The only test assertions that changed are the four listed under "Test migration" in the UI-states contract.

## 2. Old styling approach is gone (SC-004)

```bash
grep -rn "styled-components" src package.json
```

Expected: no output.

## 3. No stray color values (SC-003)

Run the grep in the "Verification" section of the theme-tokens contract.

Expected: only team-color constants in test files and non-color strings.

## 4. Bundle size (SC-008)

Read the gzip sizes printed by `npm run build` and add the script and stylesheet together.

Expected: **≤ 801 kB gzip** (baseline 728.63 kB, measured 2026-10-13).

## 5. Sub-path serving and no third-party requests (SC-009)

```bash
npm run preview
```

Open the printed URL, which is under `/nba-weekly-power-rankings/`. In the browser's network panel, reload.

Expected: the page is fully styled; every request is same-origin; nothing returns 404.

## 6. Behavior parity walk-through (SC-001)

With `npm run dev` running, on one completed season and on the current season:

1. Change the season. The chart and week range update and any pin clears.
2. Hover a line, a dot, and a team label. The team highlights, others dim, and the tooltip follows the pointer.
3. Click a team to pin it, click it again to unpin, click empty chart space to unpin.
4. Zoom in. Page with Earlier and Later, then with the left and right arrow keys. Each control disables at the season's end.
5. Zoom out and back in. The chart animates rather than jumping.
6. On a completed season: the rank-swings panel shows both groups; clicking a card pins that team on the chart and the card shows as pressed.
7. Pin a team that has a summary. The summary panel appears with its "AI-generated summary" label.
8. The GitHub link opens the repository in a new tab.

## 7. One-edit theme change (SC-002)

1. In `src/index.css`, change `--card` to an obviously different color, e.g. `#402020`. Save.
2. Expected: the rank-swings panel, the team-summary panel, and the controls all change, with no other file edited.
3. Change `--rank-up` to `#00ffff`. Expected: the rising-rank figures in swing cards and the top band of every trend minimap change.
4. Change `--chart-grid` to `#ff00ff`. Expected: the chart's grid lines change.
5. Revert all three.

## 8. Keyboard and focus (SC-005)

Starting from the address bar, press Tab repeatedly.

Expected: focus reaches the GitHub link, the season picker, Earlier, Later, Zoom, and each rank-swing card, with a visible ring on each. The season picker opens and changes with the keyboard alone. Space or Enter presses a swing card.

## 9. Narrow viewport (SC-006)

Set the browser to 375 px wide.

Expected: the header and toolbar wrap to fit; panels fill the width; the page does not scroll sideways.

## 10. Newcomer guide (SC-007)

Following only `docs/styling.md`:

1. Change one theme color and see it apply.
2. Add one new library component:

```bash
npx shadcn@latest add separator
```

Expected: both done in under 15 minutes; the new file appears under `src/components/ui/`. Remove the added component afterwards if it is not used.

## Validation record (2026-10-13)

Results from running this guide after implementation.

| Step | Result |
| --- | --- |
| 1. Quality gates | Pass. 64 of 64 tests. Two assertions changed: one team-label `fill` in `Chart.test.tsx`, and the stop colors in `TrendMinimap.test.tsx`. `App.test.tsx` needed no change. |
| 2. Old styling gone | Pass. |
| 3. No stray colors | Pass. Only the three team-color constants in `Chart.test.tsx` remain. |
| 4. Bundle size | Pass. 734.81 kB script + 7.07 kB stylesheet = 741.88 kB gzip, 1.8% over the 728.63 kB baseline. |
| 5. Sub-path | Pass. Three same-origin requests under `/nba-weekly-power-rankings/`, all 200. |
| 6. Parity | Pass in the browser on 2025-26 and 2024-25. Reduced-motion behavior was not re-checked; the animation hook is unchanged. |
| 7. One-edit theme change | Pass for `--card`, `--rank-up`, and `--chart-grid`. |
| 8. Keyboard and focus | Pass. Focus ring on the GitHub link, season picker, buttons, and swing cards; Space pins a swing card. |
| 9. Narrow viewport | Pass at 375 px, no sideways scroll. |
| 10. Newcomer guide | The steps were run as written (`add separator` worked, then removed). Not timed with a person new to the libraries. |

Deviations from the plan:

- `shadcn init` still prompted for a preset with the planned flags; `-p nova` was added. It installed the Geist font, which was removed.
- The CLI now generates `src/lib/utils.ts` as a re-export from a `cn` package, and adds `shadcn` as a dependency for `shadcn/tailwind.css`, in place of `clsx` and `tailwind-merge`.
- `--rank-down` was lightened from `#ff453a` to `#ff5a50`, and pressed or hovered swing cards use the `muted` surface instead of `accent`, so the falling-rank figure meets 4.5:1 in every state.
- `TrendMinimap` carries `size-auto` because library toggles shrink nested SVGs that have no `size-` class.
- Browser checks for US1 to US3 were run together after US3 rather than at each checkpoint; the automated gates were run at each.
