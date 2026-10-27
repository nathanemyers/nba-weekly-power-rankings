# Research: Roster Blocks and Minutes

## R1. Blocks breakpoints

- **Decision**: `blk: { low: 0.2, high: 0.6, elite: 1.0 }`, higher is better.
- **Rationale**: Same method as the other stats (comment on `STAT_BREAKPOINTS`): 25th, 75th and 90th percentiles of 2003-04 to 2025-26 player-team seasons with 10+ games and 10+ minutes per game. Measured over 9,388 qualifying entries in `data/processed/seasons/*.json` on 2026-10-26. Resulting split: 23.1% red, 49.3% yellow, 15.8% green, 11.8% purple, inside SC-001's ranges.
- **Alternatives considered**: Elite at 1.1 (9.9% purple, closer to 10%) was rejected to stay with the plain percentile value like the other stats. Blocks are recorded to one decimal, so no value hits 25/50/15/10 exactly.

## R2. Remove turnovers from rating

- **Decision**: Replace `'tov'` with `'blk'` in `RatedStat` and drop the `lowerIsBetter` flag and branch from `statRating`, since no remaining stat uses it.
- **Rationale**: Spec FR-002 removes turnovers from the pane; keeping dead reverse-rating code contradicts Principle V.
- **Alternatives considered**: Keeping `tov` rated but hidden was rejected as unused code. `tov` stays in the schema and data (FR-008), since the build script and validation still produce it.

## R3. Qualification check

- **Decision**: Export `isRatable(player)` from `statRating.ts` (`g >= MIN_RATED_GAMES && mpg >= MIN_RATED_MINUTES`); `statRating` calls it, and `RosterPane` uses it to choose gray.
- **Rationale**: One definition of the cutoff, so color and gray can never disagree (SC-003). Uses the raw `mpg`, not the rounded display (spec edge case).
- **Alternatives considered**: Having `statRating` return a fifth `'unrated'` value was rejected because a qualifying player's missing PER is also undefined but must stay uncolored, not gray.

## R4. Gray styling

- **Decision**: Unrated players' rated cells get `text-muted-foreground`, applied through a fixed class in the cell's `cn(...)`, plus `data-rating="unrated"` for tests. Non-rated columns (Pos, Age, G, MIN) keep the default color.
- **Rationale**: `--muted-foreground` already exists in `src/index.css` and is what the pane uses for secondary text (coach line). No new token needed.
- **Alternatives considered**: Lowering opacity was rejected because it reads poorly on hover rows and isn't a theme token.

## R5. Minutes column

- **Decision**: `{ label: 'MIN', title: 'Minutes per game', value: (p) => decimal(p.mpg) }` placed after `G`, unrated.
- **Rationale**: Matches spec FR-004 and the existing column pattern. `mpg` is a non-null number in the schema.
