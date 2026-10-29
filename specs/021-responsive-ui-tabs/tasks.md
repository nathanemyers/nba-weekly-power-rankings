---
description: "Task list for Responsive UI and Tabbed Detail Panel"
---

# Tasks: Responsive UI and Tabbed Detail Panel

**Input**: Design documents from `/specs/021-responsive-ui-tabs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/detail-tabs.md, quickstart.md

**Tests**: Included. plan.md and quickstart.md call for `DetailTabs.test.tsx` and `shortPlayerName.test.ts`, and the existing tests that drive the old hover cards must be updated.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story the task belongs to (US1–US4)

## Project rules that apply to every task (from `AGENTS.md`)

- No `useMemo`. Keep `useEffect` to a minimum (this feature adds none). No `useRef` for state.
- Style with Tailwind utility classes. Never build class names from variables; pick between literal strings instead.
- Colors live only in `src/index.css`. This feature adds no colors.
- Use shadcn/ui components from `src/components/ui/`, and do not edit generated files.
- Comments are one sentence at most. No `Map`/`Set`. Clickable elements get `cursor-pointer`.
- Never run `npm run build:summaries` or `scripts/build-summaries.mjs`.

---

## Phase 1: Setup

- [X] T001 Add the shadcn Tabs component by running `npx shadcn@latest add tabs`, which creates `src/components/ui/tabs.tsx`. Do not edit the generated file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared pieces used by more than one story.

- [X] T002 [P] Create `src/hooks/useMediaQuery.ts`, exporting `useMediaQuery(query: string): boolean`.
  - Implement it with `useSyncExternalStore`: subscribe via `window.matchMedia(query).addEventListener('change', …)`, and read the snapshot from `.matches`.
  - When `window.matchMedia` is undefined (jsdom), return `false` and subscribe as a no-op. The server snapshot is also `false`.
  - No `useEffect`.
- [X] T003 [P] Create `src/components/PlayerStats/shortPlayerName.ts`, exporting `shortPlayerName(name: string): string`.
  - Split on the first space and return `` `${first[0]}. ${rest}` ``.
  - Return the name unchanged when it has no space.
- [X] T004 [P] Create `src/components/PlayerStats/shortPlayerName.test.ts` covering:
  - "LeBron James" → "L. James"
  - "Gary Trent Jr." → "G. Trent Jr."
  - "Karl-Anthony Towns" → "K. Towns"
  - "Shai Gilgeous-Alexander" → "S. Gilgeous-Alexander"
  - "Nenê" → "Nenê"
- [X] T005 [P] In `src/components/Chart/useChartControls.ts`, return early from `onKey` when `e.defaultPrevented` is true. Radix tabs prevent default on the arrow keys they handle, so arrows in the tab list won't also pan the chart.

**Checkpoint**: The hook and helper exist, and `npm test` passes.

---

## Phase 3: User Story 1 - Browse the season on a phone (Priority: P1) 🎯 MVP

**Goal**: At 375px the season page has no horizontal page scroll, the chart is fully visible with legible logo labels, and pin, filter, and week controls work by touch.

**Independent Test**: Open `#/2024-25` at 375×812. `document.documentElement.scrollWidth <= innerWidth`. Tapping a line or logo pins the team. Tapping a pinned team's dot shows its tooltip without unpinning. The week arrows and zoom work.

- [X] T006 [P] [US1] In `src/constants.ts`, add `COMPACT_CHART_WIDTH = 400`, `COMPACT_CHART_HEIGHT = 560`, and `COMPACT_CHART_MARGIN = { top: 30, right: 70, bottom: 50, left: 44 }`. Tune these in T012.
- [X] T007 [US1] In `src/components/Chart/TeamLabels.tsx`, add a `compact: boolean` prop.
  - **Compact**: render each label as an SVG `<image>` using the team logo URL, about 22×22, right-aligned to `margin.left - 6` and centered on `y`. Keep the same `onMouseEnter`/`onClick` (with `stopPropagation`) and `cursor-pointer`. Set `opacity` to `0.35` when the label is dimmed. Add a `<title>` with the team name for accessibility.
  - **Compact**: skip the `playoffMedals` group.
  - **Non-compact**: unchanged.
  - Export the logo map from `src/components/TeamLogo.tsx` (e.g. `export function getTeamLogoUrl(team: Team)`) and use it here rather than duplicating imports.
- [X] T008 [US1] In `src/components/Chart/Chart.tsx`:
  - Add a `compact: boolean` prop and pass it to `TeamLabels`.
  - On each dot `<circle>`, add `onClick={(e) => { e.stopPropagation(); setHover({ teamId: team.teamId, week: r.week }) }}` so a tap shows the tooltip instead of unpinning.
  - Change the tooltip's max-width class to `max-w-[min(20rem,calc(100%-28px))]` when `compact`, else keep the current class. Choose between the two literal strings.
  - In compact mode, hide the "Playoffs Begin" text label but keep its dashed line.
- [X] T009 [US1] In `src/views/ChartView.tsx`:
  - Call `useMediaQuery('(min-width: 640px)')` in `ChartBody`. When it is false, pass the `COMPACT_*` width/height/margin and `compact` to `RankingsChart`; otherwise pass the current `CHART_*` constants and `compact={false}`.
  - Make the header stack on phones. The hint text becomes "Tap a team to pin it" below `sm` and keeps the current text at `sm` and up, using two spans with `sm:hidden` / `hidden sm:inline`.
- [X] T010 [US1] In `src/views/ChartView.tsx`, make the control row wrap. Change the top grid to `grid gap-3 sm:grid-cols-3` with `flex-wrap` on each cell. Move `<TeamHistoryButton team={singlePinnedTeam} />` into the third cell next to `ChartFilterClearButton` and `ChartFilter`, rendered only when `singlePinnedTeam` is set. Center the cells below `sm`.
- [X] T011 [P] [US1] In `src/Root.tsx`, change the shell padding to `px-4 py-4 sm:py-8`. In `src/components/ChartControls.tsx`, keep the button widths but make sure the `ButtonGroup` sits in a centered flex row that cannot overflow at 360px.
- [X] T012 [US1] Use the built-in browser at 375×812 and 360×740 to tune the `COMPACT_*` constants and logo size. Labels for 30 teams must not overlap illegibly, and axis numbers must read at about 12px or more.

**Checkpoint**: The season page works on a phone. Desktop is visually unchanged, and the `App.test.tsx` chart tests still pass because jsdom gets the wide layout.

---

## Phase 4: User Story 2 - Tabbed detail panel below the chart (Priority: P1)

**Goal**: One tabbed panel below the chart holds Summary, Trends, Roster, and Awards, with no hover needed. Availability and defaults follow `contracts/detail-tabs.md`.

**Independent Test**: Pin Boston in a completed season. The panel opens on the Roster tab, and the Summary, Trends, and Awards tabs show inline content. Unpin and the panel shows Awards, with Summary and Roster hidden.

### Tests for User Story 2

- [X] T013 [P] [US2] Create `src/components/DetailTabs.test.tsx` using `renderWithRouter` from `src/test/renderWithRouter` and the fixtures in `src/test/mockSeasons.ts`. Assert:
  - With no pin, the Awards tab is selected, and there are no "Summary" or "Roster" tabs.
  - With one pin that has a roster, the Roster tab is selected.
  - With one pin that has no roster but has a summary, Summary is selected.
  - After choosing Trends and changing the pin to another team, Trends stays selected.
  - After choosing Roster and unpinning, Awards is shown.
  - With no tabs available, the tablist is absent.
  - Clicking a team toggle in Trends pins that team (check `store.getState()`).

### Implementation for User Story 2

- [X] T014 [P] [US2] In `src/components/TeamSeasonSummary.tsx`, remove the `HoverCard` and `Button` and render the content inline: a team-name heading, the "AI-generated summary" `Badge`, and the summary paragraph. Return `null` when there is no single pinned team or no summary.
- [X] T015 [P] [US2] In `src/components/RankSwings.tsx`:
  - Remove the `HoverCard` and `Button`, and render the "Biggest Up" and "Biggest Down" sections inline.
  - Change both `<h1>`s to `<h3 className="text-sm text-muted-foreground">`.
  - Make each row `flex flex-wrap gap-3`.
  - Use `useAppDispatch` from `@/store/hooks` instead of `useDispatch`.
  - Add `cursor-pointer` to the `Toggle`.
- [X] T016 [P] [US2] In `src/components/SeasonAwardsPane.tsx`, drop the outer `<section>` heading ("{season} awards") so the tab label serves as the title. Keep `aria-label={`${season.name} awards`}` on the wrapper as a `region`.
- [X] T017 [US2] Create `src/components/DetailTabs.tsx`.
  - **Availability** (per `contracts/detail-tabs.md`):
    - `summary`: `!!singlePinnedTeam && !!getAISummary(season, singlePinnedTeam)`
    - `trends`: `getMostImprovedTeams(season).length + getMostDeclinedTeams(season).length > 0`
    - `roster`: `!!getTeamRankings(season, singlePinnedTeam)?.roster?.length`
    - `awards`: `getSeasonAwardGroups(season).length > 0`
  - **Default**: when one team is pinned, `roster` → `summary` → `trends` → `awards`. Otherwise `awards` → `trends`. Return `null` when nothing is available.
  - **Selection**: hold `const [chosenTab, setChosenTab] = useState<DetailTabId>()`. Derive `shownTab = available.includes(chosenTab) ? chosenTab : defaultTab`, with no effect.
  - **Rendering**: render shadcn `Tabs` with `value={shownTab}` and `onValueChange={setChosenTab}`. Show only available `TabsTrigger`s, in the order Summary, Trends, Roster, Awards, each with `cursor-pointer`. Each `TabsContent` renders `TeamSeasonSummary`, `RankSwings`, `RosterPane`, or `SeasonAwardsPane`.
  - Make the `TabsList` scroll sideways inside itself if it is ever too wide (`max-w-full overflow-x-auto`).
- [X] T018 [US2] In `src/views/ChartView.tsx`, replace the `ButtonGroup` block (`TeamSeasonSummary`, `RankSwings`, `TeamHistoryButton`), the standalone `<RosterPane />`, and `{pinnedTeams.length === 0 && <SeasonAwardsPane />}` with `<DetailTabs />` in a `mt-6` wrapper. Remove the now-unused imports (`ButtonGroup`, etc.).
- [X] T019 [US2] Update `src/App.test.tsx`:
  - **"Team AI summary"**: rewrite to pin Boston, click the "Summary" tab, and assert the summary text, the "AI-generated summary" badge, and the "Boston Celtics" heading. After unpinning, assert there is no "Summary" tab. After switching seasons, assert there is no "Summary" tab.
  - **"Rank swings hover card"**: rename it and open Trends by clicking the "Trends" tab instead of hovering. The headings are now `h3`.
  - **"is absent for a season that has not completed"**: change it to match the contract, where Trends is shown whenever risers or fallers exist, and Summary is absent without a summary.
  - **Team History**: keep the button test working with the button's new location.
- [X] T020 [US2] Update `src/components/SeasonAwardsPane.test.tsx` for the removed heading. Query the `region` by name `long awards`. Replace the "hidden when pinned" assertions with checks through `DetailTabs`, or delete them if `DetailTabs.test.tsx` covers that.

**Checkpoint**: The panel works at all widths, and `npm test` passes.

---

## Phase 5: User Story 3 - Compact roster on mobile (Priority: P2)

**Goal**: Below 640px, the roster shows a logo-only heading and the Player/PTS/REB/AST columns with names like "L. James". At 640px and up it is unchanged.

**Independent Test**: At 375px, pin a team and open Roster. The heading shows a logo, the columns are Player, PTS, REB, and AST, the names are short, and there is no table scroll. At 768px the full columns, full names, and team name are back.

### Tests for User Story 3

- [X] T021 [P] [US3] Update `src/components/RosterPane.test.tsx`:
  - Expect the heading's accessible name to still include "Boston Celtics", since the name is `sr-only` below `sm`.
  - Each player link's accessible name and `title` are the full name.
  - The short-name span exists with `aria-hidden`.
  - The non-compact column heads (e.g. MIN, PER) carry the `hidden sm:table-cell` classes, and PTS/REB/AST do not.
  - The move-mark buttons still render.

### Implementation for User Story 3

- [X] T022 [US3] In `src/components/PlayerStats/statColumns.tsx`:
  - Add `compact?: true` to the `StatColumn` type, set on the PTS, REB, and AST entries.
  - Add an optional `compact?: boolean` prop to both `StatHeads` and `StatCells`. When the prop is true and `column.compact` is unset, add the literal class `'hidden sm:table-cell'` via `cn`.
  - `PlayerHistoryTable` does not pass the prop, so player history is unaffected.
- [X] T023 [US3] In `src/components/RosterPane.tsx`:
  - **Heading**: render `<TeamLogo team={teamId} alt="" className="size-6 object-contain" />` followed by `<span className="sr-only sm:not-sr-only">{getTeamName(teamId)} roster, {season.name}</span>` inside a flex `h2`.
  - **Player link**: `title={player.name}`. Contents: `<span className="sm:hidden" aria-hidden>{shortPlayerName(player.name)}</span><span className="sr-only sm:not-sr-only">{player.name}</span>`.
  - **Table**: pass `compact` to `StatHeads` and `StatCells`.
  - **Player cell**: add `min-w-0`, and let long names wrap (`whitespace-normal`) below `sm`.
- [X] T024 [US3] In `src/components/RosterPane.tsx`, make the coach line and `RatingKey` row stack on phones (`flex-col sm:flex-row`). Check that `src/components/PlayerStats/RatingKey.tsx` wraps at 360px, and add `flex-wrap` there if not.

**Checkpoint**: The compact roster verified at 375px. The full roster is unchanged at 768px and 1280px.

---

## Phase 6: User Story 4 - Responsive team and player history pages (Priority: P2)

**Goal**: The team history and player history pages have no page-level horizontal scroll at 360–1920px.

**Independent Test**: Open `#/teamHistory/bos` and `#/playerHistory/jamesle01` at 375, 768, and 1280 widths. No page scroll. Wide tables scroll inside their own container.

- [X] T025 [P] [US4] In `src/views/TeamHistoryView.tsx`, change the `h1` to `flex items-center gap-3 sm:gap-5 mb-6 sm:mb-10 text-2xl sm:text-4xl`, with the logo at `size-10 sm:size-auto object-contain`.
- [X] T026 [P] [US4] In `src/components/TeamHistory.tsx`, make each season header stack on phones. Replace `grid grid-cols-2` with `flex flex-col sm:grid sm:grid-cols-2 gap-2`, change the `h2` to `text-xl sm:text-2xl` and drop `mr-10` below `sm` (`sm:mr-10`), and make the `md:w-100` minimap container `w-full md:w-100`.
- [X] T027 [P] [US4] In `src/views/PlayerHistoryView.tsx`, change the `h1` to `text-2xl sm:text-4xl`. Make the search row (`flex justify-end`) `w-full sm:w-auto` so `PlayerSearch` fills the width on phones. In `src/components/PlayerStats/CareerHighlights.tsx`, add `flex-wrap` to the outer row.
- [X] T028 [US4] In `src/components/PlayerStats/PlayerHistoryTable.tsx`, confirm the shadcn `Table` container scrolls sideways inside itself at 375px and the sticky Season/Team columns stay pinned. No compact columns here.

**Checkpoint**: All routes pass the no-horizontal-scroll check.

---

## Phase 7: Polish & Cross-Cutting

- [X] T029 Run `npm run lint`, `npm test`, and `npm run build`, and fix any failures.
- [X] T030 Run the manual viewport pass in `specs/021-responsive-ui-tabs/quickstart.md` at 375×812, 768×1024, and 1280×800 in the built-in browser. Include the rotation check and the desktop keyboard check: arrow keys pan the chart outside the tab list but not inside it.
- [X] T031 Run `npm run build && npm run preview` and confirm the compact-chart logo `<image>`s load under the configured base path (constitution, Development Workflow).
- [X] T032 [P] Delete anything left unused after T014/T015/T018 (e.g. the `hover-card` imports in `TeamSeasonSummary`/`RankSwings`, and `ButtonGroup` in `ChartView`). Do not delete `src/components/ui/hover-card.tsx` if anything else still imports it.

---

## Dependencies & Execution Order

- **Setup (T001)** blocks T017, which needs `ui/tabs`.
- **Foundational (T002–T005)**:
  - T002 blocks T009.
  - T003 blocks T023.
  - T005 should land before T017 so arrow keys don't conflict.
- **US1 (T006–T012)**: T006 → T007 → T008 → T009/T010 → T012. T011 is independent.
- **US2 (T013–T020)**: T014, T015, and T016 in parallel → T017 → T018 → T019/T020. Independent of US1 apart from the shared edits to `ChartView.tsx`; do T010 before T018 because both touch the same file.
- **US3 (T021–T024)**: works without US2, since `RosterPane` renders standalone, but is checked through the Roster tab once US2 lands. T022 → T023 → T024.
- **US4 (T025–T028)**: fully independent of US1–US3.
- **Polish (T029–T032)**: after all stories.

## Parallel Opportunities

- T002, T003, T004, and T005 (different files).
- T006 and T011 alongside T007.
- T013, T014, T015, and T016 together.
- T021 alongside T022.
- T025, T026, and T027 together, at any point after Setup.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 + US2. Both P1 stories are needed for the page to be usable on phones, since the old hover cards don't work on touch.
2. **Next**: US3, the compact roster.
3. **Then**: US4, the history pages.
4. **Finally**: Polish, including the full quickstart pass.
