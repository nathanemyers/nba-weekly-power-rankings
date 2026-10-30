# Implementation Plan: Season Storylines

**Branch**: `007-season-storylines` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-season-storylines/spec.md`

## Summary

Curated, maintainer-approved article links for each completed season: team storylines shown
with each team, plus a separate set of featured season storylines. Discovery and categorization
are done by a project Claude Code skill (`season-storylines`), because the work needs judgment:
choosing events from weekly blurbs, playoffs, awards, and season retrospectives; deciding which
teams a story touches; spotting blockbuster trades; and filtering recaps and fan posts. A
network-free Node validator enforces the spec's hard rules (approved sources, season window,
team tagging, playoff coverage, immutability) and writes the finalized file. The finalized list
is merged into the existing season JSON by `build:rankings` and rendered in a new Storylines
tab and the team Summary tab. See [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (app), Node 22 ESM `.mjs` (scripts), Markdown (skill)

**Primary Dependencies**: React, React Router, Redux Toolkit, Zod, Tailwind + shadcn/ui
(existing); Claude Code `WebSearch` / `WebFetch` tools in the skill. No new packages.

**Storage**: JSON files: `data/raw/storylines/<season>.json` (candidates),
`data/processed/storylines/<season>.json` (finalized), merged into
`data/processed/seasons/<season>.json`

**Testing**: Vitest (`npm test`), including `scripts/storylines/*.test.mjs` for the validator

**Target Platform**: GitHub Pages static site; skill and validator run on the maintainer's machine

**Project Type**: Static web app + offline data pipeline

**Performance Goals**: No new runtime requests; storylines add a few KB to each season JSON

**Constraints**: No backend, no runtime third-party calls, no API-token-spending scripts

**Scale/Scope**: ~9 NBA.com-era completed seasons (2017-18 → 2025-26) to start; per season ~30
teams × 3–8 storylines + ~8–12 featured. ESPN-era seasons are possible later, with thinner
web coverage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static hosting only | ✅ | Storylines ship in existing season JSON; no backend. |
| II. Data prepared at build time | ✅ | Finalized lists are committed under `data/processed/`; the browser makes no third-party calls. Article links are plain `<a href>` that visitors choose to follow, not runtime fetches. |
| III. Base-path-safe navigation | ✅ | New tab uses existing in-page tab state; no new routes. |
| IV. Respectful, offline collection | ✅ | Discovery runs locally in the maintainer's session; WebSearch/WebFetch respect robots (blocked publishers stay unapproved); candidates are stored in `data/raw/` and reused instead of re-searched; the app reads only `data/processed/`. |
| V. Simplicity | ✅ | No new dependencies. The skill is a Markdown file; the validator is plain Node. |
| Zod at trust boundaries | ✅ | `StorylineSchema` added to `SeasonDataSchema`. |
| Spec Kit gate: no backend / no runtime third-party calls | ✅ | Confirmed. |

Post-design re-check: unchanged, all pass. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-season-storylines/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── skill.md
│   ├── validator-cli.md
│   └── ui.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
.claude/skills/season-storylines/
└── SKILL.md                     # discover / review / finalize / revise workflow

scripts/storylines/
├── sources.json                 # approved publishers, domains, excluded paths
├── draft-dates.json             # final night of each draft, by year
├── rules.mjs                    # pure checks: source match, season window, team/featured rules
├── rules.test.mjs
└── validate.mjs                 # CLI: check raw file, --finalize writes processed file

scripts/build-rankings.mjs       # merge data/processed/storylines/<season>.json → storylines

data/raw/storylines/<season>.json
data/processed/storylines/<season>.json

src/schemas/season.ts            # StorylineSchema, SeasonDataSchema.storylines
src/data/seasonData.ts           # season and team storyline accessors
src/components/StorylineList.tsx      # shared row list
src/components/SeasonStorylinesPane.tsx
src/components/TeamSeasonSummary.tsx  # append team storylines
src/components/DetailTabs.tsx         # new storylines tab, summary availability
```

**Structure Decision**: Follow the existing single-project layout. The pipeline pieces mirror
the AI summaries flow (`data/processed/summaries/` → `build-rankings.mjs` → season JSON), and
UI pieces mirror `SeasonAwardsPane`.

## Phasing

1. **Validator and config** (`scripts/storylines/`, `check:storylines` npm script). Testable
   with hand-written fixtures before any skill exists.
2. **Pipeline and UI** (schema, `build-rankings.mjs` merge, accessors, tabs). Testable with one
   hand-written processed file (e.g. a few 2024-25 storylines from the exploration).
3. **Skill** (`SKILL.md`). Trial on 2024-25, the season used in exploration, then expand.

## Open items for tasks / implementation

- Draft dates for every season in scope must be verified while filling `draft-dates.json`.
- The initial approved-source list in research R4 is a starting point; the maintainer edits
  `sources.json` directly.

## Complexity Tracking

None.
