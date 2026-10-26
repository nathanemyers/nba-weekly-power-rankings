# Contract: Raw roster files and scraper CLI

## CLI

```text
npm run scrape:rosters                      # fetch seasons with no saved file
npm run scrape:rosters -- --season 2025-26  # re-fetch one season
npm run scrape:rosters -- --force           # re-fetch every season
```

- Seasons: 2003-04 (`NBA_2004`) through 2025-26 (`NBA_2026`).
- Three requests per fetched season (per game, advanced, coaches), at least 3 seconds apart, with the project user agent (via `scripts/lib/http.mjs`).
- Writes each season as soon as it is fetched, so an interrupted run keeps its progress.
- Exits non-zero if a page has no `per_game_stats`, `advanced` or `NBA_coaches` table, or no rows.

## File: `data/raw/basketball-reference/rosters/{season}.json`

```json
{
  "season": "2018-19",
  "source": {
    "perGame": "https://www.basketball-reference.com/leagues/NBA_2019_per_game.html",
    "advanced": "https://www.basketball-reference.com/leagues/NBA_2019_advanced.html",
    "coaches": "https://www.basketball-reference.com/leagues/NBA_2019_coaches.html"
  },
  "perGame": [
    {
      "playerId": "gasolma01",
      "name_display": "Marc Gasol",
      "age": 34,
      "team_name_abbr": "TOR",
      "pos": "C",
      "games": 26,
      "games_started": 19,
      "mp_per_g": 24.9,
      "pts_per_g": 9.1,
      "trb_per_g": 6.6,
      "ast_per_g": 3.9,
      "stl_per_g": 0.9,
      "blk_per_g": 0.9,
      "tov_per_g": 1.4,
      "fg_pct": 0.465,
      "awards": null
    }
  ],
  "advanced": [
    {
      "playerId": "gasolma01",
      "name_display": "Marc Gasol",
      "team_name_abbr": "TOR",
      "games": 26,
      "mp": 648,
      "per": 16.0,
      "ts_pct": 0.565,
      "ws": 2.1
    }
  ],
  "coaches": [
    { "coachId": "hoibefr99c", "coach": "Fred Hoiberg", "team": "CHI", "cur_g": 24, "cur_w": 5, "cur_l": 19, "seas_franch": 4, "seas_overall": 4, "car_g": 270, "car_w": 115, "car_l": 155 },
    { "coachId": "boyleji02c", "coach": "Jim Boylen", "team": "CHI", "cur_g": 58, "cur_w": 17, "cur_l": 41, "seas_franch": 1, "seas_overall": 1, "car_g": 58, "car_w": 17, "car_l": 41 }
  ]
}
```

The example shows a subset of keys; every `data-stat` column on the page is kept. Values are the displayed text parsed as numbers (`.465` → `0.465`), blank cells are `null`, and rows keep page order (multi-team rows: `2TM`, then each team in the order played).

## Parser: `scripts/lib/rosters.mjs`

- `parseStatsTable(html, tableId)` → array of rows as above. Strips HTML comments first, reads only up to the table's `</table>`, skips rows without `data-append-csv`.
- `slugForAbbr(abbr)` → app team slug, throws on unknown abbreviations.
- `parseCoachesTable(html)` → coach rows as above, reading `coachId` from the `/coaches/{id}.html` link and `team` from the team link.
- `teamCoaches(raw, season)` → `{ [slug]: CoachStint[] }` in page order, validated per data-model.md.
- `teamRosters(raw, season)` → `{ [slug]: RosterEntry[] }` (shape in [season-rosters.md](season-rosters.md)), sorted and validated per [data-model.md](../data-model.md); throws an error naming season, team and player on any rule violation.
