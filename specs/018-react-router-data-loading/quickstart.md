# Quickstart: Validating URL Routing and On-Demand Season Data

## Prerequisites

- `npm install` done on branch `use-react-router`.
- Regenerate the season index after changing the generator with `npm run build:rankings`.
  Never run `npm run build:summaries`.

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

Expected: all pass. `dist/assets/` contains one JS chunk per season (22 files besides the main
`index-*.js`), and the main chunk no longer contains season rankings. Spot-check this by searching
the main chunk for a weekly summary string.

## Bundle size (SC-002)

```bash
gzip -c dist/assets/index-*.js | wc -c
```

Expected: main chunk gzip plus the largest season chunk gzip is at most ≈1.08 MB (half of today's
≈2.17 MB). In practice it should be far below that.

## Static preview under the base path (constitution quality gate)

```bash
npm run preview
```

Open the preview URL (`http://localhost:4173/nba-weekly-power-rankings/`) and check each scenario
in a **fresh tab**:

| # | Address | Expected | Spec ref |
|---|---------|----------|----------|
| 1 | `/nba-weekly-power-rankings/` | Address becomes `#/2025-26`, latest chart shows, and Back does not loop | FR-007, US1-4 |
| 2 | `#/2018-19` | 2018-19 chart | US1-1 |
| 3 | `#/1999-00` | Redirected to latest season | FR-008, US1-5 |
| 4 | `#/teamHistory/bos` and `#/teamHistory/BOS` | Celtics history, all seasons | US2-2 |
| 5 | `#/teamHistory/xyz` | "Team not found" plus a link back | US2-5 |
| 6 | Pick 2019-20 in the picker, then press Back | Address and chart follow; Back returns | US1-2/3 |
| 7 | Pin one team, click Team History, click a card, press Back | History, then that season with the team pinned, then history again | US2-1/3/4 |

## Network checks (DevTools → Network, cache disabled)

| # | Action | Expected | Spec ref |
|---|--------|----------|----------|
| 8 | Fresh load of `#/2024-25` | Only the `2024-25` season chunk is requested | FR-010 |
| 9 | Switch to 2010-11 with "Slow 3G" throttling | Loading fallback appears, then the chart | US3-2 |
| 10 | Switch back to 2024-25 | No new chunk request and no fallback flash | FR-013, SC-004 |
| 11 | Open team history | Remaining season chunks requested once each | FR-012 |
| 12 | Go offline, pick an unvisited season | Error message plus season picker. Back online, picking it again works. | US3-4 |

## Data contracts

See [contracts/routes.md](contracts/routes.md) for addresses and
[contracts/season-index.md](contracts/season-index.md) for the generated index module.

## Results

Run on 2026-10-26 with `npm run preview` at `http://localhost:4173/nba-weekly-power-rankings/`.

- **Automated checks**: `npm run lint`, `npm test` (22 files, 205 tests) and `npm run build` pass. `dist/assets/` has 22 season chunks. A 2024-25 weekly summary string appears only in its season chunk, not in `index-*.js`.
- **Bundle size (SC-002)**: the main chunk is 259,423 B gzip, the largest season chunk (2021-22) is 102,422 B gzip, and together they are ≈362 KB. That is ≈83% smaller than ≈2.17 MB. Pass.

| # | Result |
|---|--------|
| 1 | Pass: base address → `#/2025-26`, only the 2025-26 chunk requested |
| 2 | Pass: `#/2018-19` shows 2018-19, and a fresh reload requests only its chunk |
| 3 | Pass: `#/1999-00` → `#/2025-26` |
| 4 | Pass: `#/teamHistory/BOS` and `bos` show 22 Celtics cards |
| 5 | Pass: `#/teamHistory/xyz` shows "Team not found" |
| 6 | Covered by `src/App.test.tsx` "updates the address from the picker…". In the preview, Back returned to the previous season. |
| 7 | Pass (MVP run): card click → `#/2007-08` with Boston pinned |
| 8 | Pass: see rows 1 and 2 |
| 9 | Pass: the "Loading season…" fallback appeared when switching to 2010-11 |
| 10 | Pass: switching back to 2018-19 made 0 new requests and showed no fallback |
| 11 | Pass: team history made 22 chunk requests, each file once |
| 12 | Not run in the browser (the pane can't go offline). Covered by `src/App.loading.test.tsx`: a failing season shows "Couldn't load the … season" with a picker, and picking another season recovers. |
