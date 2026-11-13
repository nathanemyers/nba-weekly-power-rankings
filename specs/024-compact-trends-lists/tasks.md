# Tasks: Compact Trends Lists

**Input**: Design documents from `/specs/024-compact-trends-lists/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/trends-lists-ui.md, quickstart.md

**Tests**: Included, because plan.md and quickstart.md name the test files this feature adds or updates.

**Organization**: Tasks are grouped by user story. US1 and US2 are both P1; US3 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story the task belongs to (US1, US2, US3)

## Code rules that apply to every task (from AGENTS.md)

- No `useMemo`, no extra `useEffect`, no `useRef` for state, no `Map`/`Set`.
- Tailwind utility classes only; never build class names from variables (choose between full static strings with a ternary).
- Colors come only from `src/index.css` tokens (`text-rank-up`, `text-rank-down`, `text-rank-mid`, `bg-muted`, etc.).
- Use shadcn components from `src/components/ui/`; do not edit them.
- Clickable elements get `cursor-pointer`. Comments: one sentence max.

---

## Phase 1: Setup

No setup needed; the project, dependencies, and test tooling already exist.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: Make the ranking helpers return exactly 5 deterministic entries without crashing.

- [X] T001 [P] Write tests in new file `src/data/analysis.test.ts` (build seasons with `parseSeason` and `weeklyRankings` from `test/fixtures`, as in `src/components/TrendMinimap/TrendMinimap.test.tsx`): (a) with at least 10 teams, `getMostImprovedTeams(season)` and `getMostDeclinedTeams(season)` each return exactly 5 entries; (b) improved is sorted by `value` descending and declined by `value` ascending; (c) teams tied on `value` are ordered by team id ascending, so the same teams are always picked; (d) a team with a single ranking gets `value` 0 and does not throw; (e) `value` is "first in-season rank minus final rank", where the first in-season rank is `rankings[1]` (index 0 is preseason).
- [X] T002 Update `src/data/analysis.ts`: change the default `returnAmount` of `getMostImprovedTeams` and `getMostDeclinedTeams` from 3 to 5; replace the comparators with ones that sort by `value` (descending for improved, ascending for declined) and break ties with `a.team.localeCompare(b.team)`; in `getSeasonDelta`, use `teamRankings.rankings[1] ?? teamRankings.rankings[0]` as the start so a single-ranking team yields 0. Make T001 pass.

**Checkpoint**: `npm test -- src/data/analysis.test.ts` passes.

---

## Phase 3: User Story 1 - Compact top-5 risers and fallers lists (Priority: P1) 🎯 MVP

**Goal**: The Trends tab shows "Most improved" and "Most declined" as two side-by-side vertical lists of exactly 5 compact one-line rows.

**Independent Test**: Open the Trends tab on a desktop-width window; see two labeled lists of 5 rows each, ordered by change, with `size-5` logos matching the storylines list.

### Tests for User Story 1

- [X] T003 [P] [US1] Write tests in new file `src/components/RankSwings.test.tsx`, rendering `<RankSwings />` with `renderInSeason` from `test/renderWithRouter` and a `vi.mock('data/seasons', ...)` season (pattern from `src/components/DetailTabs.test.tsx`) containing at least 10 teams with distinct start/end ranks: (a) there are headings "Most improved" and "Most declined"; (b) each heading's section contains an ordered list (`role="list"`) with exactly 5 `listitem`s; (c) the first improved row is the team with the largest rise and the first declined row is the team with the largest fall; (d) each row shows the full team name and a signed change (`+N` for rises, `−N` (U+2212) for falls, `0` for none); (e) each row's logo `img` has class `size-5`.

### Implementation for User Story 1

- [X] T004 [US1] Rewrite `src/components/RankSwings.tsx` per `contracts/trends-lists-ui.md`:
  - Replace `TeamMinimapCard` with a `TrendRow` component taking `team`, `value`, `season`, `isPressed`, `onClick`. Render a shadcn `Toggle` (from `@/components/ui/toggle`) with `pressed={isPressed}`, `onClick`, and className `h-auto w-full cursor-pointer justify-start gap-2 px-2 py-1.5`.
  - Inside the Toggle, left to right: `<TeamLogo team={team} className="size-5 shrink-0 object-contain" />`; `<span className="min-w-0 flex-1 truncate text-left">{getTeamName(team)}</span>` (`getTeamName` from `types`); `<TrendMinimap team={team} season={season} width={64} height={20} className="h-5 w-16" />`; and a change span with `className` chosen by ternary between full static strings `"w-8 text-right tabular-nums text-rank-up"`, `"w-8 text-right tabular-nums text-rank-down"`, `"w-8 text-right tabular-nums text-rank-mid"`, text `+N` / `−N` (U+2212) / `0`, and `aria-label` `"up N places"` / `"down N places"` / `"no change"`.
  - Add a `TrendList` component taking `title`, `entries` (the `{ team, value }[]` from analysis), `season`, `pinnedTeams`, and `onSelect`. Render `<section>` with `<h3 className="text-sm text-muted-foreground">{title}</h3>` and `<ol className="mt-1 flex flex-col gap-0.5">` containing one `<li>` per entry wrapping a `TrendRow`. `isPressed` is `pinnedTeams.length === 1 && pinnedTeams[0] === team`; `onSelect` dispatches `setPinnedTeams([team])`.
  - `RankSwings` returns `<div className="grid gap-4 sm:grid-cols-2">` with the "Most improved" list (from `getMostImprovedTeams(season)`) first and the "Most declined" list (from `getMostDeclinedTeams(season)`) second.
  - Make T003 pass.
- [X] T005 [US1] Update the Trends availability in `src/components/DetailTabs.tsx`: replace the `getMostImprovedTeams(season).length + getMostDeclinedTeams(season).length > 0` expression with `season.teams.length > 0` and remove the now-unused `getMostDeclinedTeams` / `getMostImprovedTeams` import.

**Checkpoint**: `npm test -- src/components/RankSwings.test.tsx src/components/DetailTabs.test.tsx` passes; Trends tab shows two side-by-side 5-row lists on desktop.

---

## Phase 4: User Story 2 - Stacked lists on mobile (Priority: P1)

**Goal**: Below the `sm` breakpoint, the improving list appears in full, then the declining list below it, with no horizontal overflow at 375px.

**Independent Test**: At 375px width, the Trends tab shows "Most improved" fully above "Most declined" with no horizontal scrolling.

- [X] T006 [US2] In `src/components/RankSwings.test.tsx`, add a test that the "Most improved" section precedes the "Most declined" section in document order (`compareDocumentPosition`) and that the wrapper has classes `grid` and `sm:grid-cols-2` but no unprefixed `grid-cols-*` class.
- [X] T007 [US2] Verify in the browser preview (dev server via `preview_start`, `resize_window` preset `mobile`, then a desktop width) on a real completed season: lists stack at mobile width with improving first; `document.documentElement.scrollWidth <= window.innerWidth` at 375px; long names (e.g., "Portland Trail Blazers", "Minnesota Timberwolves") stay on one line. If any row overflows, fix it in `src/components/RankSwings.tsx` (e.g., `min-w-0` on the Toggle) rather than in `src/components/ui/`.

**Checkpoint**: Mobile layout matches FR-008 and SC-003.

---

## Phase 5: User Story 3 - Clicking a row highlights the team (Priority: P2)

**Goal**: Clicking any row pins that team alone in the chart and marks only that row as selected.

**Independent Test**: Click a row; chart highlights that team and the row is pressed; click another row; selection moves.

- [X] T008 [US3] In `src/components/RankSwings.test.tsx`, add tests: clicking a row sets `getPinnedTeams(store.getState())` to `[thatTeam]`; afterwards exactly one button in the Trends lists has `aria-pressed="true"` and it is that row; clicking a different row moves both the pinned team and the pressed state; every row button has class `cursor-pointer`.
- [X] T009 [US3] Run the existing "pins a team chosen from Trends" test in `src/components/DetailTabs.test.tsx`; if the button lookup by `/Detroit Pistons/` no longer matches (the accessible name now includes the team name text, logo alt, and change label), update the query, not the behavior.

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross-Cutting

- [X] T010 Update the `rank-up` / `rank-mid` / `rank-down` row in the Site-specific names table of `docs/styling.md` to say they are used in trend lists (rank-change numbers) and trend minimaps, replacing "swing cards".
- [X] T011 Run `npm run lint`, `npm test`, and `npm run build`; fix any failures.
- [X] T012 Walk through the manual checks in `specs/024-compact-trends-lists/quickstart.md` in the browser preview (desktop and mobile), including comparing the Trends logo size to the Storylines tab, and take a screenshot of each layout as proof.

---

## Dependencies & Execution Order

- **Phase 2 (T001–T002)** blocks all stories: the lists depend on the 5-entry, tie-stable helpers.
- **US1 (T003–T005)** depends on Phase 2. It is the MVP.
- **US2 (T006–T007)** depends on T004 (the layout lives in the same component).
- **US3 (T008–T009)** depends on T004 (rows must exist); independent of US2.
- **Polish (T010–T012)** after all stories.

Within a story: write the test, then implement until it passes.

## Parallel Opportunities

- T001 (analysis tests) and T003 (RankSwings tests) are in different files and can be written in parallel.
- T005 (DetailTabs) can be done in parallel with T004 once T002 is done; they touch different files.
- T010 (docs) can be done any time after T004.
- After T004, US2 and US3 can proceed in parallel, but T006 and T008 both edit `src/components/RankSwings.test.tsx`, so serialize those two edits.

```text
# After T002:
T003 [US1] tests in RankSwings.test.tsx   ||   T005 [US1] DetailTabs.tsx availability
# After T004:
T007 [US2] browser check   ||   T009 [US3] DetailTabs pin test   ||   T010 docs
```

## Implementation Strategy

1. **MVP**: Phase 2 + US1 (T001–T005). The Trends tab already shows the new compact lists on desktop and is shippable.
2. **US2**: Confirm and lock in the stacked mobile layout (mostly verification, since the grid stacks by default).
3. **US3**: Lock in click-to-highlight behavior with tests.
4. **Polish**: docs, lint/test/build, manual walkthrough.
