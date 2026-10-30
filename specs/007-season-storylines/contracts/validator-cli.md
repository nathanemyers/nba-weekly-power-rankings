# Contract: storyline validator

`npm run check:storylines -- <season> [--finalize] [--revise]`
→ `node scripts/storylines/validate.mjs`. No network access.

## Checks (always)

| Rule | Source |
|---|---|
| Raw file parses against the Candidate / Guidance shapes in data-model.md | — |
| Every candidate URL matches an approved source and no excluded path | FR-005, SC-004 |
| Every `eventDate` is inside the season window from `draft-dates.json` | FR-012 |
| Every `teams` entry is a valid team code for that season | FR-010 |
| `teams.length > 0 \|\| featured` | FR-010 |
| `kind: "trade"` with `blockbuster: true` has `featured: true` | FR-013 |
| Every candidate lists at least one existing guidance ID | FR-006 |
| Candidate IDs and URLs are unique | — |

## Additional checks with `--finalize`

| Rule | Source |
|---|---|
| No candidates are `pending` | FR-007 |
| Each playoff team has ≥ 1 included `kind: "playoffs"` candidate | FR-011 |
| `data/processed/storylines/<season>.json` does not already exist, unless `--revise` | FR-003, SC-002 |
| Season is completed | FR-002 |

On success with `--finalize`, writes the processed file from included candidates (Storyline
fields only, sorted by `eventDate`). Exit code 0 on success, 1 with one line per failure
otherwise.
