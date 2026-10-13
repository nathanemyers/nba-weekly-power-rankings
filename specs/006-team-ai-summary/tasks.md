# Tasks: Team AI Season Summary

**Input**: Design documents from `/specs/006-team-ai-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for the generation decision logic and the panel, because SC-004 (byte-for-byte stability) and the constitution's `npm test` gate depend on them. No test calls the network.

## Phase 1: Setup

- [ ] T001 Add `@anthropic-ai/sdk` to `devDependencies` and a `"build:summaries": "node scripts/build-summaries.mjs"` script in package.json
- [ ] T002 [P] Create data/summaries/ with a `.gitkeep` so the directory is committed before any summaries exist

## Phase 2: Foundational (blocks all stories)

- [ ] T003 Fix the generated index template in scripts/build-rankings.mjs to `import type { SeasonData } from "../../types";` (the refactor removed `src/Chart/types`), then run `npm run build:rankings` and confirm `git diff src/data/seasons` is empty and `npm run build` passes
- [ ] T004 Extract the index -> season -> week -> team walk from scripts/build-rankings.mjs into scripts/lib/articles.mjs, exporting `TEAM_SLUGS` and `loadSeasonEntries()` returning `{ [season]: { [teamId]: [{ week, rank, summaryText }] } }` with the existing rules (weekly "power rankings" articles with structured rankings only; first article wins for a repeated week; first entry wins for a repeated team); make scripts/build-rankings.mjs use it and confirm its output is unchanged
- [ ] T005 [P] Add `summaries?: Record<string, string>` to `SeasonData` and `aiSummary?: string` to `TeamRankings` in src/types.ts

**Checkpoint**: `npm run build:rankings` is safe to run again and both scripts can share one reading of the articles.

## Phase 3: User Story 1 - View a team's AI-generated season summary (P1) 🎯 MVP

**Goal**: Clicking a team shows its pre-written, labeled summary for the selected season.

**Independent Test**: Generate one season, rebuild app data, pin a team in the app and see the labeled panel; pin a team in a season without summaries and see nothing.

### Tests for User Story 1

- [ ] T006 [P] [US1] Create scripts/lib/summary-plan.test.mjs covering: a team with no weekly entries -> `skip-no-data`; a team with entries and no stored entry -> `generate`; `buildPromptInput` lists weeks in ascending order with week, rank and full text and contains nothing but that team's entries; `hashInput` is stable for equal input and differs when any week's text changes
- [ ] T007 [P] [US1] Add tests to src/App.test.tsx (extend the `./data/seasons` mock with `summaries` for Boston in the "long" season only): pinning Boston shows a region named "AI-generated summary for Boston Celtics" containing the text "AI-generated summary" and the summary; unpinning removes it; pinning Miami shows no region; pinning Boston then switching to "mid" shows no region and throws nothing

### Implementation for User Story 1

- [ ] T008 [US1] Create scripts/lib/summary-plan.mjs exporting pure functions `buildPromptInput(entries)`, `hashInput(text)` (SHA-256 hex via `node:crypto`), and `decide({ entries, stored, complete })` returning `generate` when there are entries and no stored entry and `skip-no-data` when there are none (other cases added in US2 and US3)
- [ ] T009 [US1] Create scripts/build-summaries.mjs: for each season from `loadSeasonEntries()`, read data/summaries/<season>.json if present, call `decide` per team, and for `generate` call the Anthropic Messages API (`SUMMARY_MODEL`, default `claude-sonnet-5-5`) with the fixed system prompt from research.md §7 and the `buildPromptInput` text as the user message
- [ ] T010 [US1] In scripts/build-summaries.mjs validate each response and store it per data-model.md: `summary` "Non-empty, one paragraph, at most 1,200 characters" (trim; reject otherwise as a failure), `sourceHash` "SHA-256 hex of the exact prompt input", `weeks` "at least 1", `model`, `generatedAt` ISO-8601 UTC; write the season file with sorted keys after every successful team
- [ ] T011 [US1] In scripts/build-summaries.mjs implement the CLI contract in contracts/build-summaries-cli.md: `--dry-run`, repeatable `--season <id>`, one result line per season (generated / skipped-locked / skipped-unchanged / skipped-no-data / failed), continue past a failed team, exit 1 if any failed or the key is missing while work is pending, exit 0 with no key when nothing needs generating
- [ ] T012 [US1] In scripts/build-rankings.mjs read data/summaries/<season>.json when it exists and emit `summaries: { [teamId]: summary }` in src/data/seasons/<season>.json, omitting the field when there are none
- [ ] T013 [P] [US1] Create src/TeamSummary.tsx (styled-components at the top, props `teamName` and `summary`) rendering a `<section aria-label="AI-generated summary for {teamName}">` with the team name as a heading, a visible "AI-generated summary" badge, and the paragraph
- [ ] T014 [US1] In src/App.tsx attach `aiSummary: data.summaries?.[team.teamId]` in `loadSeason` and render `<TeamSummary>` under the chart inside `ChartColumn` only when `pinnedTeams` has exactly one team and that team has `aiSummary`
- [ ] T015 [US1] Run `npm run build:summaries -- --dry-run`, then with `ANTHROPIC_API_KEY` set run `npm run build:summaries -- --season 2024-25` and `npm run build:rankings`; confirm 30 entries in data/summaries/2024-25.json and a `summaries` object in src/data/seasons/2024-25.json (needs the maintainer's key)

**Checkpoint**: A visitor can read a labeled summary for any team in a generated season.

## Phase 4: User Story 2 - Summary stays current during an active season (P2)

**Goal**: After a weekly scrape, teams whose source text changed get a fresh summary; unchanged teams do not.

**Independent Test**: With a season that has no champion in data/playoffs.json, run the script, change one team's weekly text, run again, and see only that team regenerated.

- [ ] T016 [P] [US2] Add cases to scripts/lib/summary-plan.test.mjs for an active season: stored entry with equal hash -> `skip-unchanged`; stored entry with a different hash -> `generate`; a new week added for one team changes only that team's decision
- [ ] T017 [US2] Extend `decide` in scripts/lib/summary-plan.mjs so that when `complete` is false and a stored entry exists it returns `skip-unchanged` if `stored.sourceHash === hashInput(buildPromptInput(entries))`, else `generate`
- [ ] T018 [US2] In scripts/build-summaries.mjs derive `complete` per season as "`data/playoffs.json[season].champion` exists" and pass it to `decide`; tell the model to write in present tense for an active season and past tense for a complete one
- [ ] T019 [P] [US2] Document the weekly refresh routine (`npm run build:summaries` then `npm run build:rankings`, and the `ANTHROPIC_API_KEY` / `SUMMARY_MODEL` variables) in README.md

**Checkpoint**: Re-running the script on an active season is cheap and only touches what changed.

## Phase 5: User Story 3 - Completed-season summaries stay stable (P3)

**Goal**: Once a completed season's summary exists, no later run changes it.

**Independent Test**: Run the script twice on a completed, already-generated season; the second run reports every team as locked and `git diff data/summaries` is empty.

- [ ] T020 [P] [US3] Add cases to scripts/lib/summary-plan.test.mjs for a complete season: stored entry -> `skip-locked` even when the hash differs; no stored entry -> `generate`; a season that was active with a stale hash and is now complete with a stored entry -> `skip-locked`
- [ ] T021 [US3] Extend `decide` in scripts/lib/summary-plan.mjs so that `complete` with a stored entry returns `skip-locked` before any hash comparison
- [ ] T022 [US3] In scripts/build-summaries.mjs do not rewrite a season file when no team in it was generated, and never delete an existing entry, so locked files stay byte-for-byte identical
- [ ] T023 [US3] With `ANTHROPIC_API_KEY` set, backfill the remaining completed seasons with `npm run build:summaries`, run `npm run build:rankings`, then run `npm run build:summaries` again and confirm no diff in data/summaries/ (needs the maintainer's key)

**Checkpoint**: All nine seasons have summaries and historical ones are frozen.

## Phase 6: Polish & Cross-Cutting

- [ ] T024 Run `npm run lint`, `npm run build`, `npm test` and fix anything failing
- [ ] T025 Walk through specs/006-team-ai-summary/quickstart.md, including the in-browser checks, and confirm the client bundle in dist/ contains no API key and makes no request on click

## Dependencies & Execution Order

- Setup (T001–T002) then Foundational (T003–T005) block everything; T003 before T004 (same file).
- US1: T006, T007 and T013 can start together; T008 -> T009 -> T010 -> T011 (same file from T009); T012 after T004; T014 after T005 and T013; T015 last.
- US2 depends on US1's script; T017 before T018.
- US3 depends on US2 (`complete` is introduced in T018); T021 before T022 before T023.
- T015 and T023 call the paid API and need the maintainer's key; everything else runs offline.

## Parallel Example: User Story 1

```text
T006 scripts/lib/summary-plan.test.mjs
T007 src/App.test.tsx
T013 src/TeamSummary.tsx
```

## Implementation Strategy

- **MVP**: Phases 1–3. One generated season is enough to demo and to judge summary quality before paying for the full backfill.
- **Then** US2 so re-runs are incremental, and US3 before the backfill in T023, so the 240 remaining summaries are locked from the moment they are written.
- Review a handful of generated summaries after T015 and adjust the prompt before T023; a prompt change after the backfill cannot reach locked seasons without deleting entries by hand.
