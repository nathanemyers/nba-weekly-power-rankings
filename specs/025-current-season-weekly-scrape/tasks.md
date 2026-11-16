---

description: "Task list for Current Season Support and Weekly Rankings Refresh"
---

# Tasks: Current Season Support and Weekly Rankings Refresh

**Input**: Design documents from `specs/025-current-season-weekly-scrape/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included where the plan and quickstart call for them: scraper parsing and validation, routing defaults, and the season picker label. Use Vitest (`npm test`). Script tests live next to the script as `*.test.mjs`.

**Organization**: Tasks are grouped by user story. US1 and US2 are both P1. US2 depends on US1's data but needs almost no code.

**Rules for every task** (from AGENTS.md):

- Never run `npm run build:summaries` or `scripts/build-summaries.mjs`.
- Comments are one sentence at most.
- No `Map`/`Set`, `useMemo`, or extra `useEffect`.
- Tailwind classes only, with no colors outside `src/index.css`.
- Clickable elements get `cursor-pointer`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Get on the feature branch and capture test fixtures before any code changes.

- [X] T001 Create and switch to branch `025-current-season-weekly-scrape` from the current HEAD (`git switch -c 025-current-season-weekly-scrape`), keeping the uncommitted `specs/025-current-season-weekly-scrape/` files.
- [X] T002 Save trimmed fixtures for the parser tests:
  - `scripts/nba-power-rankings-scraper/fixtures/article-html-only.json`: a `pageProps.article`-shaped object with `slug: "power-rankings-2026-27-week-1"`, `powerRankings: []`, and a `contentFiltered` holding intro HTML plus 30 `<h4>#N <img ... src="https://cdn.nba.com/logos/nba/{teamId}/primary/L/72x72/logo.png" ...> <a href="...">Team Name</a></h4>` blocks, each followed by a short `<p><strong>Preseason record:</strong> 2-3</p><p>...</p>` write-up. Use real team IDs from `TEAM_SLUGS` in `scripts/lib/articles.mjs` and keep each write-up to about one sentence.
  - `scripts/nba-power-rankings-scraper/fixtures/article-structured.json`: the same, but with 30 `powerRankings` entries (`teamId`, `teamName`, `teamLink`, `lastWeekRank`, `currentWeekRank`, `powerRankSummary`) and slug `power-rankings-2026-27-week-4`.
  - Build both by hand or with a small throwaway script in the scratchpad. Do not commit full scraped articles.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Scraper fixes that every story depends on. Without them, current-season data is wrong (Week 1 empty), partial weeks can get in, or the index silently loses old seasons.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Refactor `scripts/nba-power-rankings-scraper/articlePage.mjs` so the network fetch is separate from parsing. Export `parsePowerRankingsArticle(raw, url)` (takes the `pageProps.article` object and returns the normalized article) and keep `fetchPowerRankingsArticle(url)` as fetch, `extractNextData`, then `parsePowerRankingsArticle`. Behavior must not change for structured articles.
- [X] T004 Add the HTML fallback to `parsePowerRankingsArticle` in `scripts/nba-power-rankings-scraper/articlePage.mjs` (research R1):
  - Applies only when `raw.powerRankings` is empty **and** `raw.slug` matches `^power-rankings-\d{4}-\d{2}-week-\d+$`.
  - Split `raw.contentFiltered` on `<h4>#(\d+)`. For each block, `teamId` = the number in `/logos/nba/(\d+)/` within the `<h4>`, `teamName` = the `<a>` text in the `<h4>`, `teamLink` = that `<a>`'s `href`, and `summaryHtml` = the HTML after `</h4>` up to the next `<h4>` (or the end).
  - `summaryText` = `htmlToText(summaryHtml)`, `rank` = the number, `previousRank: null`. Sort by rank.
  - Set `hasStructuredRankings: true` when entries were found, and `rawText` stays `null` in that case.
- [X] T005 Add `validateWeeklyRankings(article)` to `scripts/nba-power-rankings-scraper/articlePage.mjs` (research R2). For articles whose slug matches `^power-rankings-\d{4}-\d{2}-week-\d+$` and whose `publishedAt` is on or after `2017-08-01`, throw an Error naming the slug unless:
  - `rankings` has exactly 30 entries,
  - every `teamId` is a key of `TEAM_SLUGS` (import from `scripts/lib/articles.mjs`),
  - the `teamId`s are distinct,
  - and ranks 1–30 each appear exactly once.

  For any other article, return without checking.
- [X] T006 [P] Add `scripts/nba-power-rankings-scraper/articlePage.test.mjs` using the T002 fixtures:
  - The structured fixture parses to 30 rankings with `previousRank` from `lastWeekRank`.
  - The HTML-only fixture parses to 30 rankings, ranks 1–30, `previousRank: null`, correct `teamId` for #1, `summaryText` containing "Preseason record", and `hasStructuredRankings: true`.
  - The HTML-only fixture with a non-weekly slug (e.g. `power-rankings-notebook-week-3`) stays unstructured with `rawText` set.
  - `validateWeeklyRankings` throws for the HTML fixture cut to 29 teams, throws for a duplicated `teamId`, and passes for both full fixtures.
- [X] T007 Update `scripts/nba-power-rankings-scraper/scrape.mjs`:
  - (a) Call `validateWeeklyRankings(article)` right after each **fetched** article is parsed and before it is written, so a failing article is not saved and counts toward `failed` (R2).
  - (b) Index rule from data-model.md, "the index lists every article from the listing that is inside the `--years` window or already saved on disk": also loop over listing items outside the window and, if `findExistingArticleFile` finds them, read the file and add its index row without fetching (R3).
  - (c) Write `index.json` only when its serialized content differs from the file on disk.
  - (d) Return `{ fetched, skipped, failed, fetchedSlugs }` from `scrape()`.
- [X] T008 Update `scripts/nba-power-rankings-scraper/cli.mjs` to set `process.exitCode = 1` when `scrape()` reports `failed > 0` (R2).
- [X] T009 [P] In `scripts/scrape-rosters.mjs`, replace `const LAST_END_YEAR = 2026` with a value derived from today: the current year + 1 from August onward, otherwise the current year. Keep the one-line comment style. `--season 2026-27` must then be accepted (R4).
- [X] T010 [P] Update `scripts/nba-power-rankings-scraper/README.md` to document the HTML fallback, the 30-team check, non-zero exit on failures, and that the index keeps saved articles outside `--years`.

**Checkpoint**: `npm test -- scripts/nba-power-rankings-scraper` passes. The scraper can collect current-season weeks correctly.

---

## Phase 3: User Story 1 - See the current season's rankings (Priority: P1) 🎯 MVP

**Goal**: 2026-27 is on the site with every published week for all 30 teams, and every view works for an in-progress season.

**Independent Test**: quickstart.md §1–§3. Open `/2026-27`: weeks 1–N for 30 teams, and every view loads without errors or unexplained blanks.

- [X] T011 [US1] Re-fetch the saved Week 1 and collect weeks 2–N:
  - Delete `data/raw/nba/articles/2026-27/power-rankings-2026-27-week-1.json`, then run `npm run scrape:powerRankings`.
  - Confirm the exit code is 0 and Week 1 now has `hasStructuredRankings: true` with 30 rankings.
  - Confirm `git diff data/raw/nba/index.json` only adds or changes 2026-27 rows and removes none.
- [X] T012 [US1] Run `npm run scrape:rosters -- --season 2026-27` to create `data/raw/basketball-reference/rosters/2026-27.json`. Confirm it lists coaches for all 30 teams.
- [X] T013 [US1] Run `npm run build:rankings`. Confirm `data/processed/seasons/2026-27.json` exists, `data/processed/seasons/index.ts` lists `2026-27` first with no `champion`, and the output reports 30 teams.
- [X] T014 [P] [US1] In `src/components/SeasonSelect.tsx`, show a muted "In progress" label (e.g. `text-sm text-muted-foreground`) on a season index entry that has no `champion`, in place of the champion logo (FR-005). No new colors.
- [X] T015 [P] [US1] Add a test (in `src/App.test.tsx`, or a new `src/components/SeasonSelect.test.tsx` following the existing test setup in `src/test/`) asserting the picker shows "In progress" for a season without a champion and the champion logo for a completed season.
- [X] T016 [US1] Check every view against FR-004 and SC-007 using `npm run dev` on `/2026-27`:
  - chart and tooltip (Week 1 shows no record)
  - Trends
  - Roster (pin a team)
  - Awards
  - Storylines (season and team)
  - team history (`/teamHistory/sas`)
  - player history for a 2026-27 player
  - link preview card (`dist/2026-27/index.html` after `npm run build`)

  Fix any blank, broken, or misleading state in the component involved under `src/components/` or `src/views/`. List what you checked and fixed in the commit message.
- [X] T017 [US1] Run `npm test && npm run lint && npm run build`. Fix any failure, including `src/data/realData.test.ts` (every bundled season, 2026-27 included, must validate and give every team a roster and coach). Commit the data and code: `Add 2026-27 season`.

**Checkpoint**: The site shows 2026-27 correctly. US1 is deliverable on its own.

---

## Phase 4: User Story 2 - Land on the current season by default (Priority: P1)

**Goal**: `/` opens the current season, defined as the newest season with at least one published week. Specific season links keep working, and unknown seasons go to the current season.

**Independent Test**: With US1 data present, open `/` in a fresh browser and land on `/2026-27`. `/2018-19` stays put, and `/1999-00` goes to `/2026-27`.

- [ ] T018 [P] [US2] Extend `src/data/seasonData.test.ts`: `latestSeason` equals the first `seasonIndex` entry, and a season whose raw articles have no structured numbered week is never in the index. Cover the second part in a small `scripts/lib/articles.test.mjs` asserting `loadSeasonEntries` skips unstructured and `week: null` articles, using a temp dir fixture (FR-006, R8).
- [X] T019 [P] [US2] Check that the existing tests in `src/App.test.tsx` ("lands on the latest season from the base address", "sends an unknown season to the latest season") cover FR-006 and FR-007. Add a case that a known older season address stays on that season, if one doesn't exist yet.
- [X] T020 [US2] Manually confirm quickstart.md §3's routing checks against the dev server. No routing code change is expected. If any check fails, fix it in `src/routes.tsx`.

**Checkpoint**: US1 and US2 together deliver the user's stated default.

---

## Phase 5: User Story 3 - New rankings appear each week without manual work (Priority: P2)

**Goal**: A workflow runs twice a week, collects new weeks, and publishes them through a pull request that merges itself once its checks pass.

**Independent Test**: quickstart.md §4 locally, then §5 with a manual workflow run.

- [ ] T021 [US3] Create `scripts/refresh-current-season.mjs` following `contracts/refresh-command.md`:
  1. Run the scraper (import `scrape` from `scripts/nba-power-rankings-scraper/scrape.mjs` with the default 10-year window, `outDir` `data/raw/nba`, and `--delay-ms` passthrough, default 400). If `failed > 0`, exit non-zero.
  2. From `fetchedSlugs`, keep the ones matching `^power-rankings-(\d{4}-\d{2})-week-(\d+)$`. If there are none, print `refresh: changed=false season=- weeks=-` and exit 0 without touching files.
  3. Otherwise set `season` to the newest captured season and `weeks` to its sorted captured week numbers. Run `node scripts/scrape-rosters.mjs --season <season>`, then `node scripts/build-rankings.mjs` (child processes with `stdio: 'inherit'`; exit non-zero if either fails).
  4. Print `refresh: changed=true season=<season> weeks=<w1,w2>`.
  5. If `process.env.GITHUB_OUTPUT` is set, append `changed=`, `season=`, and `weeks=` lines to it.

  Never call `build-summaries` or anything in `scripts/storylines/` (FR-015).
- [ ] T022 [US3] Add `"refresh:current": "node scripts/refresh-current-season.mjs"` to `scripts` in `package.json`.
- [ ] T023 [US3] Run `npm run refresh:current` right after T017. Confirm `changed=false` and that `git status --porcelain data/` is empty (SC-005).
- [ ] T024 [US3] Create `.github/workflows/weekly-refresh.yml` following `contracts/weekly-refresh-workflow.md`:
  - `on: schedule: - cron: '0 15 * * 2,5'` and `workflow_dispatch`.
  - `concurrency: { group: weekly-refresh, cancel-in-progress: false }`.
  - `permissions: contents: write, pull-requests: write, actions: write`.
  - One job on `ubuntu-latest`, with `GH_TOKEN: ${{ github.token }}` in the env.
  - Steps:
    1. Checkout, `actions/setup-node@v5` with Node 22 and npm cache (match `ci.yml`), `npm ci`.
    2. `npm run refresh:current` with `id: refresh`.
    3. Guard every later step with `if: steps.refresh.outputs.changed == 'true'`.
    4. Configure the git user `github-actions[bot]` / `41898283+github-actions[bot]@users.noreply.github.com`, `git switch -C data/weekly-refresh`, `git add data/`, commit `Refresh ${season} power rankings (week ${weeks})`, `git push --force origin data/weekly-refresh`.
    5. Open the pull request if none is open (`gh pr list --head data/weekly-refresh --state open --json number`, then `gh pr create --base master --head data/weekly-refresh --title ... --body ...`). The body lists the season and weeks, links the run (`${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`), notes that AI summaries and storylines are not updated, and ends with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
    6. `npm run lint`, `npm test`, and `npm run build` with `id: checks`.
    7. On checks failure (`if: failure() && steps.checks.outcome == 'failure'`), `gh pr comment data/weekly-refresh --body "Checks failed: <run link>"`. The job stays failed.
    8. On success, `gh pr merge data/weekly-refresh --merge --delete-branch`, then `gh workflow run deploy.yml --ref master`.

  No `ANTHROPIC_API_KEY` or other secrets.
- [ ] T025 [US3] Add a "Weekly refresh" section to `README.md` under "Refreshing data" (FR-018). Cover:
  - when it runs (Tue and Fri 15:00 UTC) and how to start it by hand (Actions → Weekly refresh → Run workflow)
  - what it updates (new NBA.com weeks, current-season rosters, season data)
  - how it publishes (a pull request from `data/weekly-refresh` that merges itself and deploys once lint, tests, and build pass, or stays open on failure)
  - what it never does (AI summaries, storylines, playoffs)
  - `npm run refresh:current` as the local fallback if a source blocks GitHub's runners
  - that GitHub may turn off the schedule after 60 inactive days in the offseason
- [ ] T026 [US3] Run the workflow file through a syntax check (`npx --yes @action-validator/cli .github/workflows/weekly-refresh.yml` if available, otherwise `python3 -c "import yaml,sys;yaml.safe_load(open(sys.argv[1]))" .github/workflows/weekly-refresh.yml`). Commit with the message `Add weekly power rankings refresh job`.

**Checkpoint**: Once merged to `master`, the job can run (quickstart §5, recorded in T029).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Update the "Data pipeline" bullet under Hosting & Technology Constraints in `.specify/memory/constitution.md` only if it lists the npm data scripts exhaustively. Otherwise leave the constitution alone. Do not amend principles.
- [ ] T028 Run the full quickstart.md §1–§4 end to end and `npm test && npm run lint && npm run build` one final time. Make sure `git status` is clean except for intended changes.
- [ ] T029 After the maintainer merges to `master`: start **Weekly refresh** by hand (quickstart.md §5) and record the result (no-op, merged pull request plus deploy, or which source blocked the runner) in the pull request or README.

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T010)** → US1 → US2 / US3.
- Within Foundational: T003 → T004 → T005 → T006, and T005 → T007 → T008. T009 and T010 are independent.
- **US1 (T011–T017)**: T011 → T012 → T013 → T016 → T017. T014 and T015 can run any time after T001.
- **US2 (T018–T020)**: needs T013 for manual checks. The tests (T018, T019) can be written in parallel with US1.
- **US3 (T021–T026)**: needs Foundational (T007's `fetchedSlugs`, T009). T023 needs T017. T024 needs T022.
- **Polish (T027–T029)**: after all stories. T029 also needs a merge to `master`.

### Parallel Opportunities

- T006, T009, and T010 together once T005 is done.
- T014 and T015 (picker UI and test) alongside the US1 data tasks T011–T013.
- T018 and T019 alongside US1.
- T024 and T025 can be written in parallel once T021 and T022 are done.

## Parallel Example: User Story 1

```text
Task: "T014 [US1] In-progress label in src/components/SeasonSelect.tsx"
Task: "T015 [US1] Picker label test"
# while, sequentially:
Task: "T011 → T012 → T013 data refresh"
```

## Implementation Strategy

1. **MVP = Foundational + US1 + US2**: commit the 2026-27 data. The site defaults to the current season. Can merge and deploy right away.
2. **Then US3**: add the refresh script and workflow. Merge, then run it once by hand (T029).
3. Storylines, AI summaries, and playoffs for 2026-27 are out of scope.
