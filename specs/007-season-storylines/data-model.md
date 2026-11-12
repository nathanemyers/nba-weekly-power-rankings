# Data Model: Season Storylines

## Storyline (shipped to the app)

One curated entry. Stored in `data/processed/storylines/<season>.json` and merged into the
season file as `storylines`.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique within the season; kebab-case slug (e.g. `doncic-trade-lakers`). |
| `title` | string | Short storyline label written during review (e.g. "Dončić traded to the Lakers"). |
| `eventDate` | `YYYY-MM-DD` | Date of the event; MUST be inside the season window (FR-012). |
| `teams` | `Team[]` | Zero or more team codes; a trade lists every team involved (FR-013). |
| `featured` | boolean | `true` = also shown in the season storylines section. |
| `article.headline` | string | Article headline as published (FR-008). |
| `article.publisher` | string | Publisher name from the approved source list (FR-008). |
| `article.url` | string (https URL) | MUST match an approved source and no excluded path (FR-005). |
| `article.publishedAt` | `YYYY-MM-DD` | Publication date of the article. |

Rules:
- `teams.length > 0 || featured` (FR-010).
- A storyline whose topic is a blockbuster trade MUST have `featured: true` (FR-013;
  maintainer judgment, recorded by the skill via the candidate's `kind`).

## Season Storyline List (processed file)

```json
{ "season": "2024-25", "finalizedAt": "2026-11-02", "storylines": [Storyline, ...] }
```

- Exists only once finalized; never rewritten by a discovery run (FR-003).
- For every team in that season's `playoffs`, at least one storyline with that team and
  `kind: "playoffs"` in the candidates file MUST be included (FR-011, checked by the validator
  against the raw file).
- `storylines` MAY be empty (edge case: nothing worth including).

## Candidate (raw file only)

Stored in `data/raw/storylines/<season>.json`; never read by the app.

| Field | Type | Rules |
|---|---|---|
| all Storyline fields | | As above. |
| `kind` | `"team" \| "playoffs" \| "trade" \| "season" \| "draft"` | Category assigned by the skill. |
| `blockbuster` | boolean | Only for `kind: "trade"`; forces `featured`. |
| `guidance` | string[] | IDs of the guidance topics that motivated it (FR-006, US2-AS2). |
| `status` | `"pending" \| "included" \| "excluded"` | Set during review (FR-007). |

## Guidance Topic (raw file only)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique within the season. |
| `summary` | string | e.g. "Jalen Johnson wrist fracture". |
| `origin` | `"weekly" \| "playoffs" \| "awards" \| "retrospective" \| "theme" \| "draft"` | Where it came from (R3). |
| `teams` | `Team[]` | Teams it concerns, may be empty. |
| `weeks` | number[] | Weekly ranking weeks it came from, when `origin: "weekly"`. |

Raw file shape:

```json
{ "season": "2024-25", "updatedAt": "2026-11-01", "guidance": [GuidanceTopic], "candidates": [Candidate] }
```

## Approved Source (config)

`scripts/storylines/sources.json`:

```json
[{ "publisher": "ESPN", "domains": ["espn.com"], "excludePaths": ["/recap", "/boxscore", "/game/"] }]
```

A URL matches when its host equals or is a subdomain of a listed domain and its path contains
none of the publisher's `excludePaths` (plus any global exclusions).

## Season Window (config)

`scripts/storylines/draft-dates.json`: `{ "2024": "2024-06-27", "2025": "2025-06-26", ... }`
(final night of each draft). Window for `YYYY-YY` = day after draft `YYYY` → draft `YYYY+1`.

## State transitions

```
(no files) → discovery → raw file, candidates pending
raw pending → review → candidates included / excluded (repeatable, resumable)
raw reviewed → finalize (validator passes) → processed file written → build:rankings
processed exists → later discovery runs only touch the raw file
processed exists → explicit maintainer revise → processed file rewritten (validator --revise)
```
