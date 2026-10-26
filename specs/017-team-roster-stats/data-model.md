# Data Model: Team Roster Stats

## Raw: season roster file

`data/raw/basketball-reference/rosters/{season}.json`, written by `scripts/scrape-rosters.mjs`. One file per season. See [contracts/raw-rosters.md](contracts/raw-rosters.md) for the exact shape.

- **source**: `{ perGame: url, advanced: url, coaches: url }`
- **perGame**: array of rows from the regular-season per-game table, in page order, one per player-team stint plus one `nTM` summary row per multi-team player.
- **advanced**: array of rows from the regular-season advanced table, same row rules.
- **coaches**: array of rows from the league coaches table, in page order, one per coach-team stint, with `coachId`, `coach` (name), `team` (abbreviation) and every other `data-stat` column.

Each row keeps every `data-stat` cell from the page as a key, so nothing is lost ("liberal" scraping). Numeric cells are numbers, blank cells are `null`, `team_name_abbr`, `pos` and `name_display` are strings, plus `playerId`.

## Processed: roster entry

Built by `scripts/build-rankings.mjs` and stored in `data/processed/seasons/{season}.json` under `rosters[teamSlug]`. Validated by `RosterEntrySchema` in `src/schemas/season.ts`.

| Field | Type | From | Notes |
|---|---|---|---|
| `id` | string | `playerId` | Basketball-Reference id, for example `curryst01`. Future headshot key |
| `name` | string | `name_display` | |
| `pos` | string | per game `pos` | For example `PG`, `SF-PF` |
| `age` | int | per game `age` | Age on February 1 of the season, as the source defines it |
| `g` | int ≥ 1 | per game `games` | Games for this team |
| `gs` | int ≥ 0 | per game `games_started` | |
| `mpg` | number ≥ 0 | per game `mp_per_g` | |
| `pts`, `trb`, `ast`, `stl`, `blk`, `tov` | number ≥ 0 | per game `*_per_g` | One decimal, as displayed by the source |
| `per` | number \| null | advanced `per` | `null` when blank. Can be negative for tiny samples |
| `joinedFrom` | team slug, optional | stint order | Present when this stint is not the player's first of the season |
| `leftFor` | team slug, optional | stint order | Present when this stint is not the player's last of the season |

Joining rule: per-game and advanced rows are matched on `playerId` + `team_name_abbr`. Only team rows are used; `2TM`/`3TM` rows are only used for the sanity check below.

## Processed: team roster

`rosters: Partial<Record<Team, RosterEntry[]>>` on `SeasonData`, sorted by `g` descending, then advanced `mp` (season minutes) descending, then `name` ascending so the order is stable. In the app it becomes `TeamRankings.roster?: RosterEntry[]`.

## Processed: head coach stint

Stored in `data/processed/seasons/{season}.json` under `coaches[teamSlug]`, in the order the source lists them (the order they coached). Validated by `CoachStintSchema`. In the app it becomes `TeamRankings.coaches?: CoachStint[]`.

| Field | Type | From | Notes |
|---|---|---|---|
| `id` | string | `coachId` | Basketball-Reference coach id, for example `nurseni01c` |
| `name` | string | `coach` | |
| `g` | int ≥ 1 | `cur_g` | Regular-season games coached for this team this season |
| `w` | int ≥ 0 | `cur_w` | |
| `l` | int ≥ 0 | `cur_l` | `w + l = g` |

## Mid-season move

Not stored separately: it is the `joinedFrom` / `leftFor` pair on a roster entry. For a player with stints `[A, B, C]`: A has `leftFor: B`; B has `joinedFrom: A, leftFor: C`; C has `joinedFrom: B`. A player with one stint has neither.

## Validation rules (build fails with team, season and player named)

- Every team with rankings in a season has at least one roster entry.
- Every entry has `g ≥ 1`, `gs ≤ g`, and non-negative per-game values (`per` may be negative).
- Every `team_name_abbr` maps to a known slug.
- Each player-team stint has exactly one per-game row and one advanced row.
- For a multi-team player, the stints' games add up to the `nTM` row's games.

Coaching rules:

- Every team with rankings in a season has at least one head coach.
- Every stint has `g ≥ 1` and `w + l = g`.
- A team's stints add up to at most 82 games.

## Relationships

```text
Season ──< Team (slug) ──< RosterEntry >── Player (id)
                 │             └─ joinedFrom / leftFor ──> Team (slug)
                 └──────────< CoachStint >── Coach (id)
```
