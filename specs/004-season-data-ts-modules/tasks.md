---
description: "Task list for Season & Postseason Data as Plain JS/TS Modules"
---

# Tasks: Season & Postseason Data as Plain JS/TS Modules

**Input**: Design documents from `/specs/004-season-data-ts-modules/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (no `contracts/` — see plan.md)

**Tests**: Not explicitly requested in the spec; no new test-writing tasks are included. Existing
Vitest suite is re-run for regression coverage (see Polish phase), and `quickstart.md`'s manual
checks serve as the acceptance tests for this refactor.

**Organization**: Tasks are grouped by user story per `spec.md`'s priorities (P1, P2, P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 = instant season switching, US2 = regenerating data after new scrapes, US3 = editor type-checking

## Path Conventions

Single existing project (Vite + React app with Node build scripts) — all paths are relative to
the repository root, per `plan.md`'s Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirm the migration's starting state before touching any generator or app code.

- [X] T001 Inventory the exact files this migration must replace: list `src/data/seasons/*.json` (9 files) and `data/playoffs.json`, and confirm no other code reads them besides `scripts/build-rankings.mjs` (reads `data/playoffs.json`) and `src/App.tsx` (reads `src/data/seasons/*.json` via `import.meta.glob`) — no new dependency is required (plan.md Technical Context).

**Checkpoint**: Scope confirmed — proceed to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rewrite both data-generation scripts to emit the new file formats and regenerate the
actual data files. Every user story below depends on these files existing in their new form.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `scripts/scrape-playoffs.mjs`, change the output target from `const outFile = join(root, 'data', 'playoffs.json')` to `data/playoffs.js`, and change the write step from `writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n')` to emit a plain ESM module body: `export default ${JSON.stringify(results, null, 2)};\n` (research.md Decision 2; data-model.md Postseason Result — shape of `results` is unchanged).
- [X] T003 One-time migrate the existing postseason data without re-scraping the network (Constitution Principle IV — don't re-fetch data already stored): read the current `data/playoffs.json`, write its exact contents to `data/playoffs.js` in the `export default {...};` form from T002, then delete `data/playoffs.json`.
- [X] T004 In `scripts/build-rankings.mjs`, replace `const PLAYOFFS = JSON.parse(readFileSync(join(dataDir, 'playoffs.json'), 'utf8'))` with a static top-of-file `import PLAYOFFS from '../data/playoffs.js'`, and drop `readFileSync`/`JSON.parse` for this value (research.md Decision 2).
- [X] T005 In `scripts/build-rankings.mjs`, replace the per-season write step `const file = join(outDir, \`${season}.json\`); writeFileSync(file, JSON.stringify(output))` with a `.ts` output: write to `join(outDir, \`${season}.ts\`)` with a module body that imports the `SeasonData` type and default-exports the data with `satisfies SeasonData` (not a type assertion), e.g. `import type { SeasonData } from '../../Chart/types';\n\nexport default ${JSON.stringify(output)} satisfies SeasonData;\n` — using `satisfies` (not `as`) is required so structurally invalid data fails `tsc -b` instead of being silently coerced (data-model.md Season Ranking Record validation rules; spec edge case on malformed data).
- [X] T006 In `scripts/build-rankings.mjs`, after the existing per-season loop, add a step that writes `src/data/seasons/index.ts`: for every season written in T005, add a static `import` of its default export, then emit a `seasonData: Record<string, SeasonData>` map keyed by season string and a `seasons: string[]` export equal to `Object.keys(seasonData)` sorted descending (data-model.md Season Index; research.md Decision 1 — this is what lets `App.tsx` use one static import instead of a glob).
- [X] T007 Run `npm run build:rankings`. Confirm: the old `src/data/seasons/*.json` files are gone (the script's existing `rmSync(outDir, { recursive: true, force: true })` already clears the directory each run), `src/data/seasons/*.ts` (9 files) and `src/data/seasons/index.ts` now exist, and the console output logs the same per-season week/team counts as before the migration.
- [X] T008 Update the descriptive header comments at the top of `scripts/build-rankings.mjs` ("Reduces the scraped articles in /data into one compact JSON file per season under src/data/seasons.") and `scripts/scrape-playoffs.mjs` ("Scrapes postseason results from Basketball-Reference into data/playoffs.json.") to describe the new `.ts`/`.js` output instead of JSON.

**Checkpoint**: `src/data/seasons/*.ts`, `src/data/seasons/index.ts`, and `data/playoffs.js` all
exist and are regenerable from scratch via the same two commands as before. All user stories can
now proceed.

---

## Phase 3: User Story 1 - Instant season switching (Priority: P1) 🎯 MVP

**Goal**: A site visitor picks a season and sees its rankings chart immediately, with no
"Loading…" state ever appearing.

**Independent Test**: Load the site, switch between several seasons in the dropdown, and confirm
no loading placeholder appears at any point (spec Acceptance Scenarios 1–2).

### Implementation for User Story 1

- [X] T009 [US1] In `src/App.tsx`, replace the `import.meta.glob<{ default: SeasonData }>("./data/seasons/*.json")` block and the `seasons` derivation that reads its keys with a static `import { seasonData, seasons } from "./data/seasons"` of the barrel from T006.
- [X] T010 [US1] In `src/App.tsx`, remove the `async function loadSeason` and the `loaded`/`useEffect`/`cancelled` state machine; instead derive `{ teams, maxWeek }` synchronously on every render straight from `seasonData[season]`, keeping the same `TEAMS.map(...).filter(...)` logic that currently lives inside `loadSeason` (map each `TEAMS` entry to `{ ...team, rankings: data.rankings[team.slug] ?? [], playoff: data.playoffs?.[team.slug] }`, filtered to teams with rankings).
- [X] T011 [US1] In `src/App.tsx`, delete the `Status` styled component and the `data ? <RankingsChart .../> : <Status>Loading {season}…</Status>` conditional; render `RankingsChart` unconditionally since `seasonData[season]` is always synchronously available.
- [X] T012 [US1] Run `npm run dev` and manually verify: the initial (most recent) season's chart is present on first paint, and switching through every season in the dropdown renders immediately with no loading indicator at any point (spec FR-004, SC-001; quickstart.md §3).

**Checkpoint**: User Story 1 is fully functional and independently testable — the app loads and
switches seasons with zero async loading state.

---

## Phase 4: User Story 2 - Regenerating data after new scrapes (Priority: P2)

**Goal**: The maintainer's existing data-refresh workflow (scrape, then rebuild) keeps working
unchanged from their point of view, now emitting the new module format.

**Independent Test**: Run the build step against the existing scraped article data and confirm it
produces one data module per season plus the postseason module, with no manual fix-up required
(spec Acceptance Scenarios 1–2).

### Implementation for User Story 2

- [X] T013 [US2] Review `package.json`'s `scrape:playoffs` and `build:rankings` scripts and confirm they remain the only two commands in the regeneration workflow, invoked the same way as before T002–T008 (no new scripts, flags, or manual steps were added by the migration) — spec FR-005, SC-003.
- [X] T014 [US2] Verify full data parity for the one-time migration: using `git show HEAD:data/playoffs.json` and `git show HEAD:src/data/seasons/<season>.json` (pick one season with postseason data and one without) against their post-migration counterparts, confirm every ranking entry, record, summary, and playoff stage is identical — spec FR-006, SC-002; quickstart.md §4.
- [X] T015 [US2] [P] Search the repo (`README.md` and any other docs) for references to `src/data/seasons/*.json` or `data/playoffs.json` and update them to reference the new `.ts`/`.js` filenames.

**Checkpoint**: The maintainer-facing regeneration workflow is validated end-to-end with full data
parity against the pre-migration JSON.

---

## Phase 5: User Story 3 - Reading and reviewing data in the editor (Priority: P3)

**Goal**: Malformed or incomplete season data is caught by the type checker at build time instead
of silently rendering wrong or missing data.

**Independent Test**: Introduce a type error into a migrated season file and confirm `tsc -b`
fails the build (spec Acceptance Scenario 1).

### Implementation for User Story 3

- [X] T016 [US3] Run `npm run build` and confirm `tsc -b` passes against the migrated data. Then temporarily edit one file in `src/data/seasons/*.ts` to set an out-of-range `PlayoffStage` string (e.g. `"relegated"` instead of `"finals"`) or remove a required field, re-run `npm run build`, confirm it fails with a type error pointing at that file (proving the `satisfies SeasonData` from T005 does its job), then revert the edit — quickstart.md §2; spec edge case on malformed data.

**Checkpoint**: Type checking is confirmed to catch malformed season/postseason data before it
ships.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final repo-wide verification across all three stories.

- [X] T017 [P] Run `npm run lint` and remove now-unused imports left behind by the migration (e.g. `readFileSync`/`JSON.parse` no longer used for the postseason value in `scripts/build-rankings.mjs`, and any now-dead code in `src/App.tsx` from T009–T011).
- [X] T018 Run `npm test` and confirm the full Vitest suite passes against the migrated data modules.
- [X] T019 Run `npm run build && npm run preview` and confirm the production build serves and behaves identically to `npm run dev`, with all season/postseason data bundled and no network requests made for it — quickstart.md §5; Constitution Principles I/II.
- [X] T020 Run `git status` and `git diff --stat` and confirm the change set is exactly the expected renames/additions (old `src/data/seasons/*.json` and `data/playoffs.json` removed; new `src/data/seasons/*.ts`, `src/data/seasons/index.ts`, and `data/playoffs.js` added) with nothing unintended staged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories — T002–T008 must all
  complete (they edit the same two script files sequentially) before any story's tasks can be
  meaningfully executed or tested.
- **User Stories (Phase 3–5)**: All depend on Foundational completion (T007 in particular — the
  regenerated files must exist). The stories touch disjoint files (`src/App.tsx` for US1; review
  of `package.json`/docs for US2; `src/data/seasons/*.ts` for US3's negative test) so, once
  Foundational is done, they could be worked in parallel — but US1 is the MVP and should land
  first since US2/US3 are mostly verification of what Foundational already built.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each Phase

- Phase 2 tasks are sequential (T002 → T003 → T004 → T005 → T006 → T007 → T008): T003 needs the
  export format from T002; T007 needs the script edits from T004–T006 in place first; T008 edits
  the same files T002–T006 already changed.
- Phase 3 tasks are sequential (T009 → T010 → T011 → T012): all three edit `src/App.tsx`, and T012
  verifies the result of T009–T011.
- Phase 4 and Phase 5 tasks have no file overlap with each other or with Phase 3, so they may run
  in parallel with Phase 3 once Phase 2's checkpoint is reached.

### Parallel Opportunities

- T015 (docs update) can run in parallel with T013/T014 (both Phase 4) and with Phase 3/5.
- T017 (lint cleanup) can run in parallel with T018/T019/T020 once all stories are implemented, since it touches different concerns (lint vs. test vs. build vs. git review).
- Phases 3, 4, and 5 can be executed in parallel by different people once Phase 2's checkpoint is reached, since they touch disjoint files.

---

## Parallel Example: Phases 3–5 (after Phase 2 checkpoint)

```bash
# Different people/sessions could pick these up at the same time:
Task: "US1 — replace import.meta.glob with the static barrel import in src/App.tsx (T009)"
Task: "US2 — verify data parity between pre- and post-migration files (T014)"
Task: "US3 — confirm tsc -b catches a deliberately broken season file (T016)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (T002–T008) — this is the bulk of the actual migration work.
3. Complete Phase 3: User Story 1 (T009–T012).
4. **STOP and VALIDATE**: confirm no loading state ever appears (quickstart.md §3).
5. This alone is a complete, shippable increment — the visible behavior change is delivered.

### Incremental Delivery

1. Setup + Foundational → all data exists in the new format, regenerable from scratch.
2. Add User Story 1 → app behavior validated → this is the MVP.
3. Add User Story 2 → maintainer workflow and full data parity validated.
4. Add User Story 3 → type-checking safety net validated.
5. Polish → lint, full test suite, production build, and clean diff confirmed.

---

## Notes

- This is a storage/loading-mechanism refactor, not a new feature with independent business
  verticals — most of the real work is concentrated in Phase 2 (Foundational). Phases 4 and 5
  are intentionally thin: they verify properties (unchanged workflow, type-checking safety net)
  that Phase 2's rewrite already provides, rather than adding new behavior.
- No test-writing tasks were added (not requested in spec.md); T018 re-runs the existing suite,
  and T012/T016 are the manual acceptance checks called for by `quickstart.md`.
- Commit after each phase checkpoint, or after each task if preferred.

---

## Phase 7: Convergence

**Purpose**: Remaining work found by `/speckit-converge` after implementation — gaps between
`spec.md`/`plan.md`/`tasks.md` and the current code. See that command's in-session findings
summary for full detail; this phase records only the actionable item.

- [X] T021 Review `src/App.test.tsx` (added during implementation of T012 as a substitute for a manual browser check, since no browser-automation tool was available in-session) per T012 / FR-004 (unrequested): either keep it and add a line to this file's Notes section recording why it exists and what it covers, or remove it if an automated test for this behavior isn't wanted. **Resolved: removed** — the user chose not to keep it as a permanent test.
