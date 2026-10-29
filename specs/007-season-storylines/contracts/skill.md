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
| `more <team\|season>` | section summary from `scripts/storylines/section.mjs`, sources, draft dates | additions file merged by `scripts/storylines/add.mjs` (new pending candidates and topics only) | edit existing candidates; ask questions (it runs headless from the review tool) |
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

When `discover` finishes, the skill starts the internal review tool (`npm run review:storylines`,
`tools/storyline-review/`, a separate Vite app that is not part of the site) and opens it at
`http://127.0.0.1:5180/?season=<season>`. The tool reads and writes the raw file and reports
`checkRaw` / `checkFinalize` failures on save. When the maintainer says they are done, the skill
re-reads the raw file and runs the check.

Chat review is the fallback when the maintainer asks for it or the tool cannot start: one batch at
a time, season storylines first, then each team alphabetically, playoff teams' playoff-run
candidates flagged. Each batch is a table of title, headline, publisher, event date, teams,
featured; the maintainer replies with include/exclude/edit per row.

Selecting a section in the review tool shows a "Find more" button. It saves pending edits, then the
dev server runs `claude -p "/season-storylines <season> more <section>"` with a tool allowlist
(search, read, the additions file, `section.mjs`, `add.mjs`, `check:storylines`) and a
`--max-budget-usd` cap, and merges the new pending candidates into the page. The run's summary is
not shown inline; when it finishes the button plays a short animation to alert the maintainer.

Discovery leaves every team with at least 5 candidates, and `more <team>` tops a team up to at
least 5 non-excluded candidates; either reports any team the approved sources cannot fill.

A "Finalize" button next to Save saves pending edits, then the dev server runs
`npm run check:storylines -- <season> --finalize` and `npm run build:rankings` and shows any
failures. It is disabled for an already finalized season; revising stays with the skill.
