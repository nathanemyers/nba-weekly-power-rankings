# Data Model: Roster Blocks and Minutes

No stored data changes. `RosterEntrySchema` (`src/schemas/season.ts`) already carries every field used here; `tov` stays in the schema and processed data.

## RosterEntry (existing, read-only)

| Field | Type | Used for |
|---|---|---|
| `g` | int ≥ 1 | G column; qualification |
| `mpg` | number ≥ 0 | New MIN column; qualification |
| `blk` | number ≥ 0 | New BLK column, rated |
| `tov` | number ≥ 0 | No longer shown or rated |

## RatedStat (changed)

`'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'per'` (was `… | 'tov' | …`).

## STAT_BREAKPOINTS (changed)

| Stat | low | high | elite |
|---|---|---|---|
| `pts` | 6 | 13.5 | 19 |
| `trb` | 2.5 | 5.5 | 7.5 |
| `ast` | 1 | 3 | 5 |
| `stl` | 0.5 | 1 | 1.4 |
| `blk` | 0.2 | 0.6 | 1.0 |
| `per` | 11 | 17 | 20 |

All stats are higher-is-better; the `lowerIsBetter` field is removed. Ratings: `< low` poor, `low` to `< high` fair, `high` to `< elite` good, `≥ elite` elite.

## Qualification (new export)

`isRatable(player: RosterEntry): boolean` → `player.g >= 10 && player.mpg >= 10` (`MIN_RATED_GAMES`, `MIN_RATED_MINUTES`).

| `isRatable` | value | Cell style |
|---|---|---|
| true | number | rating color (`text-stat-*`), `data-rating` = rating |
| true | `null` (PER only) | default text color, no `data-rating` |
| false | any | `text-muted-foreground`, `data-rating="unrated"` |

## RATING_BANDS (unchanged)

`poor 25, fair 50, good 15, elite 10`.
