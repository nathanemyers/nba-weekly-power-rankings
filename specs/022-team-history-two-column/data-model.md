# Data Model: Two-Column Team History Page

No stored data, schema or build-script output changes. Everything below comes from the existing `Season` objects returned by `loadAllSeasons()` (see `src/data/seasonData.ts`).

## TeamSeason (existing, read-only)

The team's entry in one season: `season.teams.find((t) => t.teamId === team)`. Seasons where the team has no entry are skipped, as they are today.

| Field | Used for |
| --- | --- |
| `season.name` | Left entry label, right section heading, `data-season` key, chart link target |
| `season.source` | `DataSourceBadge` in the detail |
| `season.completed` | Picks which no-storylines note to show |
| `rankings` | `TrendMinimap` in the overview |
| `playoffSeries` | `PlayoffSeriesBadges` in the overview |
| `roster` | Input to `getTopPlayersByMinutes` |
| `aiSummary` | **No longer read by this page** |

Storylines: `getTeamStorylines(season, team)`, unchanged.

## TopPlayer (derived)

```ts
type TopPlayer = { id: string; name: string; minutes: number }
```

`getTopPlayersByMinutes(roster: RosterEntry[] | undefined, count = 6): TopPlayer[]`

- `minutes = Math.round(entry.g * entry.mpg)`
- Sort by `minutes` descending, then `name.localeCompare` ascending
- Return the first `count` entries; return `[]` for a missing or empty roster
- A traded player appears in each team's roster separately, so only minutes for this team count

## Desktop view state (component state in the two-column layout)

| State | Type | Initial | Meaning |
| --- | --- | --- | --- |
| `active` | season name | first season shown | The highlighted left entry |
| `scrollTarget` | season name or `undefined` | `undefined` | Set while a click-started scroll is running; stops the scroll spy changing `active` |

Transitions:

| Event | Effect |
| --- | --- |
| Left entry activated (click, Enter, Space) | `active = s`. If the right column's scroll position for `s` differs from the current one: `scrollTarget = s` and scroll the right column (smooth unless reduced motion) |
| Right column `scroll`, `scrollTarget` set | If the computed season equals `scrollTarget` or the column is at its end: clear `scrollTarget`. Otherwise no change |
| Right column `scroll`, `scrollTarget` not set | `active = computed season` (last season when at the end). If it changed, scroll the left column the minimum distance to fully show that entry |
| Right column `scrollend` | Clear `scrollTarget`; `active` stays as is |

Nothing goes in the URL, Redux or browser storage (spec assumption: no deep-linking to a season).

## Narrow view state

Accordion `type="multiple"`, uncontrolled, default value `[]`. Each item's value is the season name. State is lost on navigation or when crossing the breakpoint (spec edge case).
