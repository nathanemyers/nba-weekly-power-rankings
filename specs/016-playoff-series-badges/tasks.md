# Tasks: Playoff Series Badges

**Input**: Design documents from `/specs/016-playoff-series-badges/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-and-scripts.md](contracts/ui-and-scripts.md), [quickstart.md](quickstart.md)

**Tests**: Included, because the plan and quickstart call for them. Script tests are `*.test.mjs` next to the module. Component and App tests use Vitest with jsdom and Testing Library. Fixtures are synthetic: never paste real Basketball-Reference HTML into a test.

**Organization**: User Story 2 (data) is done before User Story 1 (badges). Both are P1, but the badges need the series scores.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 (badges) or US2 (series data)

## Rules for every task (AGENTS.md and the constitution)

- No `useMemo`. Keep `useEffect` to a minimum. Don't use `useRef` for state. Use no `Map` or `Set`; plain objects and arrays only.
- Tailwind classes only, and never build a class name from a variable. Colours live only in `src/index.css`.
- Use shadcn/ui components from `src/components/ui/`. Add new ones with `npx shadcn@latest add <name>` and never edit the generated files.
- Comments are one sentence at most, and match the surrounding code style.
- **Never run `npm run build:summaries` or `scripts/build-summaries.mjs`.**
- Basketball-Reference requests happen only in T010. They use the scraper's existing 3-second delay and the `nba-weekly-power-rankings (personal project)` user agent.

---

## Phase 1: Setup

- [X] T001 Run `npx shadcn@latest add tooltip` from the repo root to create `src/components/ui/tooltip.tsx`. Don't edit the generated file. Confirm `package.json` gains no new dependency, because `radix-ui` is already installed. If the CLI asks to overwrite existing UI files, answer no.
- [X] T002 [P] Add two colour roles to `src/index.css`:
  - in `:root`: `--series-won: #30d158;` and `--series-lost: #ff5a50;`, placed after `--rank-down`
  - in `@theme inline`: `--color-series-won: var(--series-won);` and `--color-series-lost: var(--series-lost);`, placed after `--color-rank-down`
  - in the "Names specific to this site" table in `docs/styling.md`: a row "`series-won`, `series-lost` | Won / lost playoff series badges"

---

## Phase 2: Foundational (shared playoff module)

**Purpose**: Make playoff parsing importable and testable ([research §5](research.md#5-making-the-parser-testable)). Both stories depend on it.

- [X] T003 Create `scripts/lib/playoffs.mjs` by moving these out of `scripts/scrape-playoffs.mjs` unchanged and exporting them: `SLUG_BY_NAME`, `ROUND_BY_HEADER`, `slugFor`, `parseSeason`. Then reduce `scripts/scrape-playoffs.mjs` to its constants (`FIRST_END_YEAR`, `LAST_END_YEAR`, `CRAWL_DELAY_MS`, `USER_AGENT`, `outFile`), `sleep`, `fetchPage`, and the saved/`--force` loop. It imports `parseSeason` from `./lib/playoffs.mjs`. Behaviour must not change yet. Check with `node --check scripts/scrape-playoffs.mjs` and `node -e "import('./scripts/lib/playoffs.mjs')"`, which must make no network requests.

**Checkpoint**: `npm test` still passes, and the scraper's logic is unchanged.

---

## Phase 3: User Story 2 - Complete series results for every season (Priority: P1)

**Goal**: Every series in `data/raw/basketball-reference/playoffs.json` has `winnerWins` and `loserWins`, and every processed season has a validated per-team `playoffSeries` (FR-001, FR-002, FR-003, FR-010, FR-011).

**Independent Test**: In the quickstart §1 check, every season prints `15 0`. `npm run build:rankings` adds only `playoffSeries` to `data/processed/seasons/*.json`, and every `playoffs` map is unchanged.

### Tests for User Story 2

- [X] T004 [P] [US2] Create `scripts/lib/playoffs.test.mjs` with a synthetic season page. It contains:
  - (a) the menu bracket in the existing format: `<p class="listhead"><strong>East Conf 1st Round</strong></p><ul class=""><li><a href="/" ><a href="/playoffs/x.html">Washington Wizards vs. Cleveland Cavaliers</a></a></li></ul>`, and so on for every round header in `ROUND_BY_HEADER`
  - (b) a `League Champion</strong>: <a href="/teams/MIA/2006.html">Miami Heat</a>` line
  - (c) a series table started by `id="all_all_playoffs"`, whose rows look like `<tr><td><span class='tooltip opener'><strong>Eastern Conference First Round</strong></span></td><td><a href='/teams/CLE/2006.html'>Cleveland Cavaliers</a> over <a href='/teams/WAS/2006.html'>Washington Wizards</a> &nbsp;(4-2) </td><td><a href='/x.html'>Series Stats</a></td></tr>`, followed by game rows that contain no `over`

  Keep the fixture small: one series per round header (7 series) is enough for parsing tests. Cover:
  - `parseSeriesScores` returns `{ stage, winner, loser, winnerWins, loserWins }` for each row. Round labels map `Eastern|Western Conference First Round` → `first-round`, `…Semifinals` → `semis`, `…Conference Finals` → `conf-finals`, and `Finals` → `finals`.
  - `parseSeason` adds `winnerWins` and `loserWins` to every bracket series, matched by unordered team pair within the stage.
  - `parseSeason` throws with the team names when a bracket series has no score row, or when the score row's winner differs from the bracket winner.
  - `hasSeriesScores({ rounds: [...] })` is true only when every series has numeric `winnerWins` and `loserWins`.
  - `teamPlayoffRuns(bracket, '2005-06')` on a complete 15-series bracket object (built in the test, not from HTML) returns, for the champion, 4 entries `{ round, opponent, wins: 4, losses }` in round order. A first-round loser gets 1 entry with `wins` 0–3 and `losses: 4`.
  - It throws, naming the season and team, for each data-model rule: "`winnerWins === 4` and `0 <= loserWins <= 3`", "A completed season (one with a `champion`) has 15 series: 8 first-round, 4 semis, 2 conf-finals and 1 Finals", "Every entry except the last is a win", and a run whose final stage disagrees with the champion.

### Implementation for User Story 2

- [X] T005 [US2] In `scripts/lib/playoffs.mjs`, add and export `parseSeriesScores(html)`:
  - Take the HTML from `id="all_all_playoffs"` up to the next `id="all_advanced_team"`, or to the end of the page if that's missing.
  - Collect each `<tr>` whose HTML matches `/<\/a>\s*over\s*<a/`.
  - The round is the text inside the first `<td>`'s `<strong>`, mapped as in T004. Ignore unknown labels.
  - The winner and loser come from the two `<a>` texts in the second `<td>`, through `slugFor`. The score comes from `/\((\d)-(\d)\)/` as `winnerWins` and `loserWins`.
- [X] T006 [US2] In `scripts/lib/playoffs.mjs`, extend `parseSeason(html)` so that every `{ teams, winner }` series also gets `winnerWins` and `loserWins` from `parseSeriesScores`. Match by stage and unordered team pair. Throw `Error(\`No series score for ${a} vs ${b} in ${stage}\`)` or `Error(\`Series winner mismatch for ${a} vs ${b}\`)` as in T004. Keep the existing `winner` logic as the source of truth for `winner`.
- [X] T007 [US2] In `scripts/lib/playoffs.mjs`, add and export `hasSeriesScores(season)`. It returns `season.rounds.every((r) => r.series.every((s) => Number.isInteger(s.winnerWins) && Number.isInteger(s.loserWins)))`.
- [X] T008 [US2] In `scripts/lib/playoffs.mjs`, add and export `teamPlayoffRuns(bracket, season)`. It returns `{ [slug]: [{ round, opponent, wins, losses }] }`, ordered by `['first-round', 'semis', 'conf-finals', 'finals']`. It validates, throwing `Error` with the season and team or series:
  - "`winnerWins === 4` and `0 <= loserWins <= 3`"
  - "`winner` is one of `teams`"
  - "A completed season (one with a `champion`) has 15 series: 8 first-round, 4 semis, 2 conf-finals and 1 Finals"
  - "A team's list has 1 to 4 entries, with rounds strictly increasing. Every entry except the last is a win. The last entry is a loss, unless it's a won Finals."

  Makes T004 pass.
- [X] T009 [US2] In `scripts/scrape-playoffs.mjs`, change the reuse check from `if (saved[season])` to `if (saved[season] && hasSeriesScores(saved[season]))`, importing `hasSeriesScores`. Extend the final summary log so each round also lists its scores, e.g. `first-round=4-2,4-1,4-0,4-3`. Add `the series scores` to the header comment's description of what is scraped.
- [X] T010 [US2] Run `npm run scrape:playoffs`. This makes about 23 requests to basketball-reference.com, 3 s apart, roughly 70 s. Then:
  - Run the quickstart §1 node check and confirm every season prints `15 0`.
  - Run `npm run scrape:playoffs` again and confirm it prints no `Fetching` lines.
  - Confirm `git diff data/raw/basketball-reference/playoffs.json` only adds `winnerWins` and `loserWins` lines. `champion`, `runnerUp`, `teams` and `winner` must be unchanged.
- [X] T011 [US2] In `scripts/build-rankings.mjs`, import `teamPlayoffRuns` from `./lib/playoffs.mjs`. When `bracket` exists for the season, set `const playoffSeries = teamPlayoffRuns(bracket, season)` and add `...(Object.keys(playoffSeries).length && { playoffSeries })` to `output`, right after `playoffs`. Leave the existing `playoffs` stage logic untouched.
- [X] T012 [US2] Run `npm run build:rankings`, then check that each of the 22 season files in `data/processed/seasons/` gained a `playoffSeries` key and that nothing else changed. Use a node one-off that loads each file from `git show HEAD:<file>` and the working copy, deletes `playoffSeries` from the new one, and compares with `JSON.stringify`. Also check SC-002: for every team in `playoffSeries`, the last entry's round equals `playoffs[slug]`, or `playoffs[slug] === 'champion'` for a won Finals.

**Checkpoint**: The data is complete, and processed seasons carry `playoffSeries`. The app still builds, because `SeasonDataSchema` doesn't strip unknown keys. Confirm with `npm test`.

---

## Phase 4: User Story 1 - See a team's playoff run series by series (Priority: P1) 🎯 MVP

**Goal**: Badges with the opponent logo, games, medal, and green or red, on team-history cards and in the chart view when one team is pinned (FR-004 to FR-010).

**Independent Test**: `npm test` passes the new component and App tests. In the production preview, the quickstart §3 spot checks match.

### Tests for User Story 1

- [X] T013 [P] [US1] In `src/test/fixtures.ts`, add and export `PLAYOFF_SERIES`, which must agree with the existing `PLAYOFFS` (Boston champion, Miami eliminated in the second round):

  ```ts
  {
    [Team.Boston]: [
      { round: 'first-round', opponent: Team.Detroit, wins: 4, losses: 0 },
      { round: 'semis', opponent: Team.Miami, wins: 4, losses: 2 },
      { round: 'conf-finals', opponent: Team.Toronto, wins: 4, losses: 3 },
      { round: 'finals', opponent: Team.LALakers, wins: 4, losses: 1 },
    ],
    [Team.Miami]: [
      { round: 'first-round', opponent: Team.Orlando, wins: 4, losses: 3 },
      { round: 'semis', opponent: Team.Boston, wins: 2, losses: 4 },
    ],
  }
  ```

  Use the `PlayoffStage` enum values for `round`. Add `playoffSeries: PLAYOFF_SERIES` next to `playoffs: PLAYOFFS` in the `long` season of `src/test/mockSeasons.ts`, and in the `season()` helper in `src/App.test.tsx`. In `buildTeams()`, also set `playoffSeries` from it, so chart tests get the data too.
- [X] T014 [P] [US1] Create `src/components/PlayoffSeriesBadges.test.tsx`. With `PLAYOFF_SERIES[Team.Boston]`, check:
  - 4 `listitem`s inside a `list` named "Playoff series"
  - accessible names, in order: "First round: beat Detroit Pistons 4-0", "Second round: beat Miami Heat 4-2", "Conference finals: beat Toronto Raptors 4-3", "Finals: beat Los Angeles Lakers 4-1"
  - visible games counts `4`, `6`, `7`, `5`
  - medals 🥉 🥈 🥇 👑

  With Miami, check the last badge is named "Second round: lost to Boston Celtics 2-4", shows 🥈, and has the `border-series-lost` class while the first has `border-series-won`. A lost Finals entry shows 🏆. `series={undefined}` and `series={[]}` render nothing (`container` is empty). Clicking a badge inside a parent `div` with an `onClick` spy doesn't call the spy. Hovering or focusing a badge shows a tooltip with the same text; use `findByRole('tooltip')`. Wrap renders in `TooltipProvider` as the component needs.

### Implementation for User Story 1

- [X] T015 [US1] In `src/types/nba.ts`, add `export type SeriesRound = Exclude<PlayoffStage, PlayoffStage.Champion>`. In `src/schemas/season.ts`, add the following and export `type SeriesResult = z.infer<typeof SeriesResultSchema>`:

  ```ts
  export const SeriesResultSchema = z.object({
    round: z.enum([PlayoffStage.FirstRound, PlayoffStage.SecondRound, PlayoffStage.ConferenceFinals, PlayoffStage.Finals]),
    opponent: z.enum(Team),
    wins: z.int().min(0).max(4),
    losses: z.int().min(0).max(4),
  })
  ```

  Then add `playoffSeries: z.partialRecord(z.enum(Team), z.array(SeriesResultSchema)).optional()` to `SeasonDataSchema`. Re-export `SeriesResult` from `src/types/nba.ts` next to `SeasonData`, and add `playoffSeries?: SeriesResult[]` to `TeamRankings`.
- [X] T016 [US1] In `src/store/slices/seasons/loadSeasons.ts`, add `playoffSeries: data.playoffSeries?.[team.teamId],` to each team object, after `playoff`.
- [X] T017 [US1] Wrap the `<main>` contents in `src/App.tsx` with `<TooltipProvider>` from `components/ui/tooltip`, so the providers aren't duplicated per badge.
- [X] T018 [US1] Create `src/components/PlayoffSeriesBadges.tsx` per the [contract](contracts/ui-and-scripts.md):
  - Props: `{ series?: SeriesResult[]; className?: string }`. Return `null` when the list is missing or empty.
  - Render `<ul aria-label="Playoff series" className={cn('flex flex-wrap items-center gap-1.5', props.className)}>` with one `<li>` per series.
  - Each `<li>` wraps a `Tooltip` whose `TooltipTrigger asChild` is a shadcn `Badge` with `variant="outline"`, `tabIndex={0}`, an `aria-label` of the result text, and `onClick={(e) => e.stopPropagation()}`.
  - The badge's classes are the literal strings `'border-series-won bg-series-won/15 text-foreground'` when won, and `'border-series-lost bg-series-lost/15 text-foreground'` when lost, chosen with a ternary (never built from variables), plus `'h-7 gap-1 px-1.5'`.
  - Badge contents: `<TeamLogo team={opponent} alt="" className="size-5 object-contain" />`, `<span>{wins + losses}</span>` and `<span aria-hidden>{medal}</span>`.
  - `medal` is `PLAYOFF_MEDALS[PlayoffStage.Champion].icon` when `round === PlayoffStage.Finals && wins === 4`, otherwise `PLAYOFF_MEDALS[round].icon`, from `components/Chart/utils`.
  - `TooltipContent` shows the same result text.
  - Result text: `${ROUND_LABELS[round]}: ${won ? 'beat' : 'lost to'} ${getTeamName(opponent)} ${wins}-${losses}`, with `ROUND_LABELS = { 'first-round': 'First round', semis: 'Second round', 'conf-finals': 'Conference finals', finals: 'Finals' }` as a plain object keyed by `PlayoffStage`.

  Makes T014 pass.
- [X] T019 [US1] In `src/views/ChartView.tsx`, read the pinned team's series with `data.teams.find((t) => t.teamId === singlePinnedTeam)?.playoffSeries`. Render it in the centre grid cell next to `TeamHistoryButton`: change that cell to `grid-col-2 justify-self-center flex flex-row flex-wrap items-center justify-center gap-3`, and render `{singlePinnedTeam && <PlayoffSeriesBadges series={pinnedSeries} />}` after the button.
- [X] T020 [US1] In `src/components/TeamHistory.tsx`, render `<PlayoffSeriesBadges series={team.playoffSeries} />` on each season card. Put it in the header row's right-hand group, before `DataSourceBadge`, and let that group wrap (`flex flex-row flex-wrap items-center justify-end gap-2`).
- [X] T021 [US1] Add App tests in `src/App.test.tsx`, under `describe('Playoff series badges')`:
  - (a) no `list` named "Playoff series" with nothing pinned
  - (b) after pinning Boston on the `long` season, the list has 4 items, and the first is named "First round: beat Detroit Pistons 4-0"
  - (c) after pinning Miami, 2 items, the last named "Second round: lost to Boston Celtics 2-4"
  - (d) pinning a team with no series (Detroit) shows no list
  - (e) in Boston's team history, the `long` season card shows the badges. Clicking a badge leaves the view on team history: the heading "Boston Celtics Team History" is still present.

**Checkpoint**: Both stories are done.

---

## Phase 5: Polish and validation

- [X] T022 [P] Run `npm run lint` and `npm test`, then fix any failures.
- [X] T023 Run `npm run build`. Start the `preview` launch config on port 4173 and open `/nba-weekly-power-rankings/`. Check the five runs in the quickstart §3 table, in both the chart view (pin the team) and team history. Check that tooltips show on hover and keyboard focus, and that a non-playoff team shows nothing. Then resize to 375 px wide and confirm four badges fit without horizontal scroll. Take a screenshot of one champion and one first-round exit.
- [X] T024 Update the root `README.md` "Refreshing data" section with one sentence: `npm run scrape:playoffs` also stores each series' score, and re-fetches any saved season that lacks scores.

---

## Dependencies and Execution Order

- **Phase 1** (T001, T002): no dependencies, and they can run in parallel.
- **Phase 2** (T003): blocks US2.
- **US2** (T004 to T012): T004 → T005 → T006 → T007 → T008 → T009 → T010 (network) → T011 → T012.
- **US1** (T013 to T021): T015 and T016 need US2's data shape but not the scraped data. T013 and T014 can start as soon as T015's types exist. T018 needs T001, T002, T015 and T017. T019, T020 and T021 need T018.
- **Polish**: after both stories.

### Parallel opportunities

- T001 and T002.
- T004 alongside Phase 1.
- T013 and T014, which are different files.
- T019 and T020, which are different files, after T018.
- T022 alongside the start of T023's build.

## Parallel Example: User Story 1

```text
Task: "T013 fixtures PLAYOFF_SERIES in src/test/fixtures.ts"
Task: "T014 PlayoffSeriesBadges tests in src/components/PlayoffSeriesBadges.test.tsx"
```

## Implementation Strategy

1. **Data first:** Setup, then foundational, then US2. The data must exist before the badges are worth building, so check the data at T012 before going on.
2. **MVP:** US1 with T013 to T019 shows the badges in the chart view. T020 adds team history.
3. **Polish:** the preview spot checks, then commit the data and code together.

## Notes

- Keep Basketball-Reference text out of fixtures; build them by hand.
- `build:summaries` stays off-limits.
