# Data Model: Player History Page

No new data files and no schema changes. Everything is derived in the browser from `RosterEntry` (`src/schemas/season.ts`) inside already loaded `Season`s.

## PlayerStint (derived, `src/data/playerHistory.ts`)

| Field | Type | Source |
|---|---|---|
| `season` | `string` | `Season.name`, e.g. `2015-16` |
| `team` | `Team` | key of `rosters` the entry was found under (`TeamRankings.teamId`) |
| `player` | `RosterEntry` | the roster entry itself, unchanged, so the shared stat cells and `statRating`/`isRatable` work on it directly |

`type PlayerStint = { season: string; team: Team; player: RosterEntry }`

## getPlayerHistory(seasons: Season[], playerId: string): PlayerStint[]

- Collects every roster entry with `id === playerId` across all teams of all seasons.
- Keeps the input season order (`loadAllSeasons` returns `seasonIndex` order, newest first), so the history is most recent first and test seasons with non-date names such as `long`/`short` order correctly too.
- Within a season: starts at the entry with no `joinedFrom`, then follows `leftFor`, and reverses the result so the latest team comes first. Any entry the chain doesn’t reach is still kept, so no row is dropped (SC-004).
- Returns `[]` for an unknown ID. The view shows "Player not found" for that.

## Player name

The heading uses `player.name` from the newest stint. The name doesn't change across seasons in the data, so taking the newest one is a tie-break only.

## Validation

- URL param `:player` must match `^[a-z]+\d{2}$` (Zod), or the loader throws a 404 with `statusText: 'Player not found'`.
- Season data is already Zod-parsed by `parseSeason`, so nothing new is validated there.
