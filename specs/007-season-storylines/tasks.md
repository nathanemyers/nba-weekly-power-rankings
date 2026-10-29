# Tasks: Season Storylines

**Input**: Design documents from `/specs/007-season-storylines/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. quickstart.md requires validator rule tests, and the project keeps Vitest
tests beside components and scripts.

**Organization**: Grouped by user story. US1 (visitor display) is built first against a
hand-written processed file, so it does not need the skill.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 visitor display, US2 discovery, US3 review & finalize

---

## Phase 1: Setup

- [X] T001 Create directories `scripts/storylines/`, `data/raw/storylines/`, `data/processed/storylines/` (add a `.gitkeep` to each data directory so they exist in a clean checkout)
- [X] T002 Add `"check:storylines": "node scripts/storylines/validate.mjs"` to the `scripts` block of `package.json`

---

## Phase 2: Foundational

**Purpose**: The Storyline shape used by every story.

- [X] T003 Add `StorylineSchema` to `src/schemas/season.ts` per data-model.md: `id` non-empty kebab-case string; `title` non-empty string; `eventDate` and `article.publishedAt` `YYYY-MM-DD` strings; `teams: z.array(z.enum(Team))`; `featured: z.boolean()`; `article: { headline: non-empty string, publisher: non-empty string, url: https URL }`; refine `teams.length > 0 || featured` ("Every storyline MUST have at least one team or be a season storyline"). Export `type Storyline = z.infer<typeof StorylineSchema>`
- [X] T004 Add `storylines: z.array(StorylineSchema).optional().catch(undefined)` to `SeasonDataSchema` in `src/schemas/season.ts` so bad storyline data drops storylines instead of failing the season

**Checkpoint**: Schema compiles (`npm run build`); existing tests still pass (`npm test`).

---

## Phase 3: User Story 1 - Visitor sees a completed season's storylines (Priority: P1) 🎯 MVP

**Goal**: Finalized storylines render as a season Storylines tab and under a pinned team's
Summary; nothing renders for unfinalized or active seasons.

**Independent Test**: With a hand-written `data/processed/storylines/2024-25.json`, run
`npm run build:rankings` and `npm run dev`; follow quickstart.md scenario 5.

### Tests for User Story 1

- [X] T005 [P] [US1] Add accessor tests to `src/data/seasonData.test.ts`: `getSeasonStorylines` returns only `featured` entries sorted by `eventDate`; `getTeamStorylines` returns entries whose `teams` include the team, sorted by `eventDate`; both return `[]` when `completed` is false or `storylines` is absent; invalid `storylines` data leaves the season loadable with no storylines
- [X] T006 [P] [US1] Create `src/components/SeasonStorylinesPane.test.tsx` (pattern: `src/components/SeasonAwardsPane.test.tsx`): renders title, headline link with `target="_blank"` and `rel="noreferrer"`, publisher, and date per featured storyline
- [X] T007 [P] [US1] Add `DetailTabs` cases to `src/components/DetailTabs.test.tsx`: Storylines tab disabled when there are no featured storylines; Storylines is the default tab when unpinned and storylines exist; Summary tab is available for a pinned team that has storylines but no AI summary

### Implementation for User Story 1

- [X] T008 [US1] In `scripts/build-rankings.mjs`, read `data/processed/storylines/<season>.json` when it exists (same pattern as the summaries block) and add `...(storylines.length && { storylines })` to `output`, sorted by `eventDate`
- [X] T009 [US1] In `src/data/seasonData.ts`, add `storylines: Storyline[]` to the `Season` type (from `data.storylines ?? []` in `parseSeason`) and export `getSeasonStorylines(season)` and `getTeamStorylines(season, team)` as described in T005
- [X] T010 [P] [US1] Create `src/components/StorylineList.tsx`: list of storylines, each showing `title`, `article.headline` as a link (`target="_blank" rel="noreferrer"`, `cursor-pointer`), `article.publisher`, and formatted `eventDate`, with `TeamLogo` for each team except an optional `hideTeam` prop; Tailwind classes and `src/index.css` tokens only
- [X] T011 [US1] Create `src/components/SeasonStorylinesPane.tsx` rendering `StorylineList` with `getSeasonStorylines(useSeason())`
- [X] T012 [US1] In `src/components/TeamSeasonSummary.tsx`, render `StorylineList` with `getTeamStorylines(season, singlePinnedTeam)` and `hideTeam={singlePinnedTeam}` below the summary paragraph, under a "Storylines" heading; render when either the summary or storylines exist
- [X] T013 [US1] In `src/components/DetailTabs.tsx`, add a `storylines` tab labelled "Storylines" (available when `getSeasonStorylines(season).length > 0`), put it first in `UNPINNED_ORDER` and last in `PINNED_ORDER`, render `SeasonStorylinesPane` in its `TabsContent`, and make `summary` available when the pinned team has an AI summary or team storylines
- [X] T014 [US1] Hand-write `data/processed/storylines/2024-25.json` (`{ season, finalizedAt, storylines }`) with 4–6 storylines from the exploration: the Dončić trade (`teams: ["dal","lal","uta"]`, `featured: true`), Thunder title (`["okc"]`, featured), Pacers Finals run (`["ind"]`), Cavaliers 15-0 start (`["cle"]`); use the article URLs in research.md / the exploration; then run `npm run build:rankings`

**Checkpoint**: quickstart.md scenario 5 passes; `npm test` passes.

---

## Phase 4: User Story 2 - Maintainer discovers candidate articles (Priority: P2)

**Goal**: `/season-storylines <season> discover` writes guided, source-restricted candidates to
`data/raw/storylines/<season>.json`, checked by the validator.

**Independent Test**: quickstart.md scenarios 1 (base rules) and 2.

### Tests for User Story 2

- [X] T015 [P] [US2] Create `scripts/storylines/rules.test.mjs` covering: `matchSource` accepts `https://www.espn.com/nba/story/...` and `https://www.nba.com/pacers/news/...`, rejects `https://www.espn.com/nba/recap?gameId=1`, `https://www.si.com/nba/pacers/onsi/...`, and an unlisted domain; `seasonWindow('2024-25')` is `{ start: '2024-06-28', end: '2025-06-26' }` and accepts `2025-06-26` but rejects `2025-06-27` and `2024-06-27`; `checkCandidate` flags unknown team codes, `teams: []` without `featured`, `kind: "trade"` + `blockbuster: true` without `featured`, empty or unknown `guidance` IDs; `checkRaw` flags duplicate IDs and duplicate URLs

### Implementation for User Story 2

- [X] T016 [P] [US2] Create `scripts/storylines/sources.json` from research.md R4: ESPN (`espn.com`), NBA.com (`nba.com`), The Ringer (`theringer.com`), CBS Sports (`cbssports.com`, exclude `/fantasy/`), Sports Illustrated (`si.com`, exclude `/onsi/`, `/betting/`), Bleacher Report (`bleacherreport.com`), Yahoo Sports (`sports.yahoo.com`), Indy Cornrows (`indycornrows.com`); top-level `excludePaths`: `/recap`, `/boxscore`, `/game/`, `/watch/`. Shape: `{ "excludePaths": [...], "publishers": [{ "publisher", "domains", "excludePaths" }] }`
- [X] T017 [P] [US2] Create `scripts/storylines/draft-dates.json` mapping each draft year 2016–2026 to the final night's date (`YYYY-MM-DD`), verifying each against nba.com or basketball-reference (e.g. 2020 → `2020-11-18`, 2021 → `2021-07-29`, 2024 → `2024-06-27`, 2025 → `2025-06-26`)
- [X] T018 [US2] Create `scripts/storylines/rules.mjs` exporting pure functions `matchSource(url, sources)` (host equals or is a subdomain of a listed domain, path contains no global or publisher `excludePaths`; returns the publisher name or null), `seasonWindow(season, draftDates)` (day after draft `YYYY` through draft `YYYY+1`, inclusive), `checkCandidate(candidate, ctx)` and `checkRaw(raw, ctx)` returning arrays of failure strings per contracts/validator-cli.md "Checks (always)"
- [X] T019 [US2] Create `scripts/storylines/validate.mjs` CLI: arg `<season>`; load `data/raw/storylines/<season>.json`, `sources.json`, `draft-dates.json`, and team codes from `Object.keys(rankings)` in `data/processed/seasons/<season>.json`; print one line per failure and exit 1, or print a summary (candidate counts by `kind` and `status`) and exit 0
- [X] T020 [US2] Create `.claude/skills/season-storylines/SKILL.md` (frontmatter `name: season-storylines`, description naming discover/review/finalize/revise) with the Preconditions, Tool use, and Guardrails sections of contracts/skill.md, and the `discover` phase: build guidance topics in research.md R3 order (retrospectives, `playoffSeries`, awards, each team's weekly `rankings` blurbs, cross-team themes, lottery & draft) with the Guidance Topic fields from data-model.md; one `WebSearch` per topic with `allowed_domains` from `sources.json`; `WebFetch` only when headline or date is unclear; assign `kind`, `teams` (every team in a trade), `blockbuster`, `featured`, `eventDate`, `guidance`, `status: "pending"`; skip URLs and topics already in the raw file; write the raw file; run `npm run check:storylines -- <season>` and fix or drop failing candidates

**Checkpoint**: `npm test -- scripts/storylines` passes; quickstart.md scenario 2 produces a
valid raw file for 2024-25 and leaves `data/processed/storylines/` untouched.

---

## Phase 5: User Story 3 - Maintainer reviews and finalizes (Priority: P3)

**Goal**: Batched review records decisions; finalize writes the static processed file through
the validator; finalized seasons cannot change without an explicit revise.

**Independent Test**: quickstart.md scenarios 3 and 4.

### Tests for User Story 3

- [X] T021 [P] [US3] Add `--finalize` cases to `scripts/storylines/rules.test.mjs` via an exported `checkFinalize(raw, ctx)`: fails with any `status: "pending"`; fails when a team in `playoffs` has no included `kind: "playoffs"` candidate; fails when the season has no champion; and `buildProcessed(raw)` keeps only `included` candidates, keeps only Storyline fields, and sorts by `eventDate`

### Implementation for User Story 3

- [X] T022 [US3] Add `checkFinalize` and `buildProcessed` to `scripts/storylines/rules.mjs` per T021
- [X] T023 [US3] Extend `scripts/storylines/validate.mjs` with `--finalize` (run `checkFinalize`; refuse with "already finalized" if `data/processed/storylines/<season>.json` exists and `--revise` is absent; otherwise write `buildProcessed` output with `finalizedAt` set to today) and `--revise` (allow overwriting)
- [X] T024 [US3] Add the `review`, `finalize`, `revise`, and default-phase sections to `.claude/skills/season-storylines/SKILL.md` per contracts/skill.md: batches (season storylines first, then teams alphabetically, playoff-run candidates flagged), table columns (title, headline, publisher, event date, teams, featured), write each decision to the raw file immediately; finalize runs `npm run check:storylines -- <season> --finalize` then `npm run build:rankings`; revise requires explicit maintainer confirmation and uses `--finalize --revise`; never edit `data/processed/storylines/` directly

**Checkpoint**: quickstart.md scenarios 3 and 4 pass.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T025 [P] Replace the hand-written `data/processed/storylines/2024-25.json` from T014 with the output of a real `/season-storylines 2024-25` run once US3 is done, then `npm run build:rankings`
- [X] T026 [P] Add a short "Storylines" section to `README.md` (or `docs/`), covering the skill, `check:storylines`, where files live, and that the skill is maintainer-run and never in CI
- [X] T027 Run `npm run lint`, `npm run build`, `npm test`, and `npm run preview` under the base path; confirm the Storylines tab with no new network requests (quickstart.md scenario 6)

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T004)** → user stories.
- **US1 (T005–T014)** depends only on Foundational. It is the MVP.
- **US2 (T015–T020)** depends on Setup. It does not need US1, but its candidates use the same
  fields as `StorylineSchema`.
- **US3 (T021–T024)** depends on US2 (`rules.mjs`, `validate.mjs`, `SKILL.md`).
- **Polish**: T025 needs US1–US3; T026 and T027 come last.

Within stories: tests first (T005–T007, T015, T021), then implementation. T008 → T014;
T009 → T011–T013; T010 → T011–T012; T018 → T019 → T020; T022 → T023 → T024.

## Parallel Opportunities

- US1: T005, T006, T007, T010 together; then T011 and T012.
- US2: T015, T016, T017 together; US2 can run alongside US1 since they touch different files.
- US3: T021 while finishing T020.

## Parallel Example: User Story 2

```text
T015 rules.test.mjs   |  T016 sources.json   |  T017 draft-dates.json
        ↓
T018 rules.mjs → T019 validate.mjs → T020 SKILL.md (discover)
```

## Implementation Strategy

1. **MVP**: Setup, Foundational, US1 with the hand-written 2024-25 file. Ships visible
   storylines for one season.
2. **US2**: validator rules and the skill's discover phase; trial on 2024-25.
3. **US3**: finalize/revise; replace the hand-written file with a real run (T025).
4. Expand to other completed seasons one at a time with the skill.

## Notes

- Never run `npm run build:summaries` or `scripts/build-summaries.mjs`.
- No `useMemo`; keep `useEffect` out; Tailwind only; colors from `src/index.css`; `cursor-pointer` on links.
- Commit after each checkpoint.
