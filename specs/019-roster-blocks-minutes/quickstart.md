# Quickstart: Roster Blocks and Minutes

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

Expected: all pass. Tests cover `blk` thresholds (0.19 poor, 0.2 fair, 0.6 good, 1.0 elite), `isRatable` at the 10-game / 10.0-minute boundaries, the column headers (MIN present, BLK present, TOV absent), gray cells for a non-qualifying player, and the key's accessible name.

## Manual check (dev server, `dev` in `.claude/launch.json`)

1. Open the chart view for 2015-16 and pin only the Golden State Warriors.
2. Headers read: Player, Pos, Age, G, MIN, PTS, REB, AST, STL, BLK, PER. No TOV.
3. Stephen Curry: MIN 34.2, BLK 0.2 in yellow.
4. Draymond Green: BLK 1.4 in purple. Andrew Bogut: BLK 1.6 in purple.
5. Kevon Looney (5 games, 4.2 MIN): PTS through PER are gray; name, Pos, Age, G and MIN are normal color.
6. Hover the color key's accessible name (or inspect `role="img"`): no mention of turnovers.
7. Resize to mobile width: the page does not scroll horizontally; the table scrolls inside the pane with the player column sticky.
8. Check dark and light themes: gray is distinguishable from the yellow rating color.

See [contracts/roster-pane.md](contracts/roster-pane.md) and [data-model.md](data-model.md) for the exact rules.
