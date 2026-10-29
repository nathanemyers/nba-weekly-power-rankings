# Contract: `season-storylines` skill

Location: `.claude/skills/season-storylines/SKILL.md`. Maintainer-invoked only
(`/season-storylines <season> [discover|review|finalize|revise]`); never run in CI.

## Preconditions

- The season is completed (has a champion in `data/processed/seasons/<season>.json`). Otherwise
  stop and say so (FR-002 edge case: active seasons are excluded).
- `scripts/storylines/sources.json` and a draft date for both ends of the window exist.

## Phases

| Phase | Reads | Writes | Must not |
|---|---|---|---|
| `discover` | processed season file, raw candidates file (if any), sources, draft dates | raw candidates file (adds guidance + pending candidates; dedupes by URL) | write to `data/processed/`; search domains outside `sources.json` |
| `review` | raw candidates file | raw candidates file (status, title, teams, featured, kind edits) | change anything without the maintainer's decision |
| `finalize` | raw candidates file | `data/processed/storylines/<season>.json` via `check:storylines --finalize`, then runs `npm run build:rankings` | write the processed file itself; overwrite an existing one |
| `revise` | processed file, raw candidates file | processed file via `check:storylines --finalize --revise`, only after the maintainer explicitly confirms | run discovery implicitly |

Default with no phase argument: `discover` if no raw file exists, `review` if pending candidates
remain, otherwise `finalize`.

## Tool use

- `WebSearch` with `allowed_domains` taken from `sources.json` (never broader).
- `WebFetch` only to confirm headline / publication date of a candidate URL.
- Must reuse candidates already in the raw file instead of re-searching the same topic
  (Principle IV: avoid re-fetching stored data).

## Guardrails

- Runs `npm run check:storylines -- <season>` after `discover` and `review`, and
  `npm run check:storylines -- <season> --finalize` before writing the processed file. A
  failing check blocks finalize; the skill reports each failure to the maintainer.
- Must not run `npm run build:summaries` or `scripts/build-summaries.mjs` (AGENTS.md).

## Review presentation

One batch at a time: season storylines first, then each team alphabetically, playoff teams'
playoff-run candidates flagged. Each batch is a table of title, headline, publisher, event date,
teams, featured; the maintainer replies with include/exclude/edit per row.
