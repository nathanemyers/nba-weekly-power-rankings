# Data Model: Player History Page

No new data files and no schema changes. Everything is derived in the browser from `RosterEntry` (`src/schemas/season.ts`) inside already loaded `Season`s.

## PlayerStint (derived, `src/data/playerHistory.ts`)

| Field | Type | Source |
|---|---|---|
| `season` | `string` | `Season.name`, e.g. `2015-16` |
| `team` | `Team` | key of `rosters` the entry was found under (`TeamRankings.teamId`) |
| `playoff` | `PlayoffStage \| undefined` | the team's `playoff` finish that season, left empty when `player.leftFor` is set |
| `player` | `RosterEntry` | the roster entry itself, unchanged, so the shared stat cells and `statRating`/`isRatable` work on it directly |

`type PlayerStint = { season: string; team: Team; player: RosterEntry; playoff?: PlayoffStage }`

## getPlayerHistory(seasons: Season[], playerId: string): PlayerStint[]

- Collects every roster entry with `id === playerId` across all teams of all seasons.
- Keeps the input season order (`loadAllSeasons` returns `seasonIndex` order, newest first), so the history is most recent first and test seasons with non-date names such as `long`/`short` order correctly too.
- Within a season: starts at the entry with no `joinedFrom`, then follows `leftFor`, and reverses the result so the latest team comes first. Any entry the chain doesn’t reach is still kept, so no row is dropped (SC-004).
- Returns `[]` for an unknown ID. The view shows "Player not found" for that.

## Player name

The heading uses `player.name` from the newest stint. The name doesn't change across seasons in the data, so taking the newest one is a tie-break only.

## Season awards (`RosterEntry.awards`)

- Optional array of Basketball-Reference award codes, copied by `scripts/lib/rosters.mjs` from the per-game table's `awards` cell, for example `["MVP-1", "AS", "NBA1"]`.
- Each code matches `^((MVP|DPOY|ROY|6MOY|MIP|CPOY)-\d+|AS|NBA[123]|DEF[12])$`. The build throws on any other code, and the Zod schema checks the same pattern.
- A traded player's awards come from their summary row and go only on the team they finished the season with (the stint with no `leftFor`). The field is left out when a player earned none.
- `seasonAwards(codes)` in `src/data/awards.ts` turns codes into `{ code, label, title, kind }`, with `kind` `won`, `selection` or `vote`, sorted won, then selections, then votes by place.

## Validation

- URL param `:player` must match `^[a-z]+\d{2}$` (Zod), or the loader throws a 404 with `statusText: 'Player not found'`.
- Season data is already Zod-parsed by `parseSeason`, so nothing new is validated there.

## PlayerSummary (derived, `src/data/playerHistory.ts`)

`type PlayerSummary = { id: string; name: string; firstSeason: string; lastSeason: string }`

- `getAllPlayers(seasons)` lists each player ID once, sorted by name, with the name from their latest season and the names of their first and last seasons.
- `searchPlayers(players, query, limit)` returns up to `limit` players whose name has a word starting with every word of the query. Matching ignores case and accents, and treats spaces, periods, apostrophes and hyphens as word breaks. A blank query returns `[]`.
- The route loader returns `players: Promise<PlayerSummary[]>` alongside `history`, both from the same `loadAllSeasons()` call.
