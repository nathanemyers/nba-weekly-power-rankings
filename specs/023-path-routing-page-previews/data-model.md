# Data Model: Path-Based Addresses and Per-Page Link Previews

All of these are build-time values computed in the Vite plugin from `data/processed/seasons/*.json` and `Teams`. None of them is stored or committed.

## PageEntry

One known address and the entry file written for it.

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `'season' \| 'team' \| 'player'` | |
| `path` | string | Router path without the base, e.g. `/2018-19`, `/teamHistory/bos`, `/playerHistory/jamesle01` |
| `file` | string | Output path inside `dist/`: `2018-19.html`, `teamHistory/bos.html`, `playerHistory/jamesle01.html` |
| `head` | `PageHead \| null` | `null` for players, which means the site-wide `<head>` is used unchanged |

**Validation rules**
- Season names come from the validated season index (`SeasonIndexEntrySchema`). Team IDs come from the `Team` enum. Player IDs match `/^[a-z]+\d{2}$/`, the same rule as `playerHistoryLoader`. Anything that fails is skipped, logged, and doesn't fail the build.
- `path` values are unique. A player ID can never equal a season name or `teamHistory`, because they live under their own prefix.

## PageHead

Preview information written into a season or team entry file.

| Field | Type | Example |
|-------|------|---------|
| `title` | string | `2018-19 · NBA Weekly Power Rankings` |
| `description` | string | `Week-by-week power rankings for the 2018-19 NBA season. Champions: Toronto Raptors.` |
| `canonicalUrl` | absolute URL | `https://nathanemyers.github.io/nba-weekly-power-rankings/2018-19` |
| `imageUrl` | absolute URL | `https://nathanemyers.github.io/nba-weekly-power-rankings/previews/season-2018-19.png` |

## PreviewCard

Input to the SVG template for one PNG.

| Field | Type | Notes |
|-------|------|-------|
| `file` | string | `previews/season-<name>.png` or `previews/team-<id>.png` |
| `heading` | string | Season name, or the team's full name |
| `fact` | string | Headline fact (see research R8) |
| `accentColor` | hex string | Featured team's `color`, or the neutral site accent |
| `logo` | `Team \| null` | Team whose logo is shown |

**Derivation**
- **Season**: `champion = seasonIndex[i].champion`. If it's set, the fact is "Champions: <name>" and `logo` and `accent` come from the champion. If not, the fact is "#1 in week <maxWeek>: <name>", where that team has `rank === 1` in the latest week. In that case `logo` is the #1 team and `accent` is neutral.
- **Team**: scan every season's `playoffs[team]` and `rankings[team]`, and use the first that applies:
  1. Championships: "Champions in <season>" for one title, or "N× champions since <first season>" for more than one.
  2. The deepest `PlayoffStage` reached, and the earliest season it was reached in.
  3. The best final-week rank, and its season.

## LegacyAddress

| Input | Output |
|-------|--------|
| `<base>#/<rest>` | `<base><rest>` (via `history.replaceState`) |
| Any hash not starting with `#/` | Left unchanged |
