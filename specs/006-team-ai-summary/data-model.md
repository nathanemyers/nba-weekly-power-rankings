# Data Model: Team AI Season Summary

## Stored summary — `data/summaries/<season>.json`

An object keyed by team id (`"bos"`, `"lal"`, ...). Each value:

| Field | Type | Rules |
|-------|------|-------|
| `summary` | string | Non-empty, one paragraph, at most 1,200 characters |
| `sourceHash` | string | SHA-256 hex of the exact prompt input the summary was generated from |
| `weeks` | number | Count of weekly entries in that input; at least 1 |
| `model` | string | Model id used |
| `generatedAt` | string | ISO-8601 UTC timestamp |

A team with no weekly entries has no key. Keys are written in sorted order so diffs stay small.

## Season status (derived, not stored)

`complete` when `data/playoffs.json[season].champion` exists, else `active`.

## Generation decision (derived)

| Weekly entries | Season | Stored entry | Action |
|----------------|--------|--------------|--------|
| none | any | any | skip |
| some | complete | present | skip (locked) |
| some | complete | absent | generate |
| some | active | absent | generate |
| some | active | present, hash equal | skip |
| some | active | present, hash differs | generate |

Lifecycle of one team-season: absent -> generated -> (regenerated while active and source changes) -> locked once the season is complete.

## App data

- `SeasonData.summaries?: Record<string, string>` — team id to summary text; omitted when a season has none.
- `TeamRankings.aiSummary?: string` — attached in `loadSeason`, alongside `playoff`.

## View state

No new state. The panel is derived: shown when `pinnedTeams` has one team and that team has `aiSummary` in the selected season.
