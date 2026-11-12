---

description: "Task list for the two-column team history page"
---

# Tasks: Two-Column Team History Page

**Input**: Design documents from `specs/022-team-history-two-column/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Included. The plan and quickstart list the Vitest coverage this feature needs, and four existing tests in `src/App.test.tsx` must be updated.

**Organization**: Tasks are grouped by user story so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: Which user story the task belongs to (US1–US4)

## Rules that apply to every task (from AGENTS.md)

No `useMemo`; no `useEffect`; no `useRef` for state; Tailwind utility classes only, never built from variables (run-time values go in `style`); no color values in components; shadcn/ui components from `src/components/ui/`, never edited by hand; `cursor-pointer` on every clickable element; no `Map`/`Set`; comments at most one sentence. Never run `npm run build:summaries`.

---

## Phase 1: Setup

**Purpose**: Add the shadcn Accordion and test helpers.

- [ ] T001 Run `npx shadcn@latest add accordion` to generate `src/components/ui/accordion.tsx`; do not edit the generated file, and confirm `package.json` gains no new runtime dependency (it should use the existing `radix-ui` package)
- [ ] T002 [P] Add `mockMediaQueries(matching: string[])` to `src/test/fixtures.ts`, modelled on the existing `mockReducedMotion`: it replaces `window.matchMedia` so that `matches` is true only when `query` is in `matching`, and it returns a restore function

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: Derive top players, and move the team history code into its new folder with the shared overview and detail pieces.

**⚠️ No user story work can begin until this phase is complete.**

- [ ] T003 [P] Add `export type TopPlayer = { id: string; name: string; minutes: number }` and `export function getTopPlayersByMinutes(roster: RosterEntry[] | undefined, count = 6): TopPlayer[]` to `src/data/seasonData.ts`. Use "`minutes = Math.round(entry.g * entry.mpg)`", sort by `minutes` descending then `name.localeCompare` ascending, return the first `count` entries, and return `[]` for a missing or empty roster
- [ ] T004 [P] Add a `describe('getTopPlayersByMinutes')` block to `src/data/seasonData.test.ts` covering: order by `g × mpg` (not `mpg` alone: a 10-game 40-mpg player ranks below a 70-game 30-mpg player), alphabetical tie-break at equal minutes, a cap at 6 from an 8-player roster, a 3-player roster returning 3, and `undefined` returning `[]`
- [ ] T005 Move `src/components/TeamHistory.tsx` to `src/components/TeamHistory/TeamHistory.tsx` and `src/components/TeamHistory.test.tsx` to `src/components/TeamHistory/TeamHistory.test.tsx` with `git mv`. Fix relative imports in both, and update the import in `src/views/TeamHistoryView.tsx` to `@/components/TeamHistory/TeamHistory`
- [ ] T006 [P] Create `src/components/TeamHistory/SeasonOverview.tsx`: props `{ season: Season; team: TeamRankings; title: ReactNode }`. It renders, side by side, `title` in the name slot (parents pass the stretched `button` or `AccordionTrigger` holding the season name, styled like today's h2, so the name appears once), `TrendMinimap` (`team={team.teamId} season={season}`), and `PlayoffSeriesBadges series={team.playoffSeries}` inside a `relative z-10` wrapper so its tooltip buttons sit above a stretched parent button (research §7)
- [ ] T007 [P] Create `src/components/TeamHistory/TopPlayerBadges.tsx`: props `{ season: Season; team: TeamRankings }`. It calls `getTopPlayersByMinutes(team.roster)`, renders nothing when the result is empty, and otherwise renders a `ul` with `aria-label={`${season.name} top players by minutes`}` and flex-wrap gap classes. Each `li` holds `<Badge asChild variant="outline" className="cursor-pointer hover:bg-muted">` wrapping a router `<Link to={'/playerHistory/' + player.id}>` with the player's full name
- [ ] T008 Create `src/components/TeamHistory/SeasonDetail.tsx`: props `{ season: Season; team: TeamRankings; teamId: Team; headingLevel?: 'h2' | 'h3' }`. It renders a `section` with `aria-labelledby` set to a `useId()` heading id, containing:
  - the heading: the season name, shown only when `headingLevel` is given
  - a "Storylines" subheading and `StorylineList` (`label={`${season.name} ${getTeamName(teamId)} storylines`}`, `hideTeam={teamId}`) when `getTeamStorylines(season, teamId)` is non-empty; otherwise a `text-muted-foreground` paragraph reading "No storylines for this season" when `season.completed`, and "Storylines appear once the season is complete" when it isn't
  - a "Top players" subheading and `TopPlayerBadges`
  - a footer row with `DataSourceBadge source={season.source} season={season.name}`, and `<Button asChild variant="outline" size="sm" className="cursor-pointer">` wrapping `<Link to={'/' + season.name} aria-label={`View ${season.name} chart`} onClick={() => dispatch(setPinnedTeams([teamId]))}>View season chart</Link>`

  Do not render `team.aiSummary` or any "AI-generated summary" badge. Depends on T007.

**Checkpoint**: Foundation ready. `npm test -- seasonData` passes.

---

## Phase 3: User Story 1 - Browse a team's seasons in two linked columns (Priority: P1) 🎯 MVP

**Goal**: At ≥1024px the page shows a `Seasons` navigation column and a detail column, scrolling independently, with no AI summaries.

**Independent Test**: Open `#/teamHistory/bos` at 1280px. Both columns render and scroll on their own, seasons are in the same order on both sides, the right side shows storylines and up to 6 player links per season, and no AI summary text appears.

### Tests for User Story 1

- [ ] T009 [US1] Update `src/components/TeamHistory/TeamHistory.test.tsx` for the desktop layout (the default test `matchMedia` reports no match, so desktop renders). Keep the two existing storyline tests and add:
  - a `navigation` named `Seasons` with one `button` per season, in the same order as the right-column `heading`s
  - the first button has `aria-current="true"` and no other does
  - a season with roster data shows a `list` named `<season> top players by minutes` whose links have `href` ending `/playerHistory/<id>`; add `rosters: ROSTERS` to one mock season and import `ROSTERS` in the `vi.mock` factory
  - clicking a player link goes to `/playerHistory/<id>`
  - `screen.queryByText(/AI-generated summary/)` is null; add `summaries: { mia: 'Summary text' }` to a mock season and assert `queryByText('Summary text')` is null too
  - a `link` named `View storied chart` goes to `/storied` and pins Miami (check `router.state.location.pathname`)
  - a season without storylines shows "No storylines for this season"
- [ ] T010 [P] [US1] Update the team-history tests in `src/App.test.tsx`:
  - "names each season's source in the team history": expect `queryAllByText('AI-generated summary')` to have length 0
  - "goes from the chart to the history and back to a season with the team pinned" and "pins the team when a card is opened from a shared history link": replace the `getByRole('heading', { name: 'mid' | 'long' })` clicks with `getByRole('link', { name: 'View mid chart' | 'View long chart' })`
  - "shows on team history cards without leaving the history when clicked": make sure the clicked button is a playoff badge inside a `Playoff series` list and that the path stays on the team history

### Implementation for User Story 1

- [ ] T011 [US1] Create `src/components/TeamHistory/TeamHistoryColumns.tsx` with props `{ team: Team; seasons: Season[] }`. Build `entries` with `seasons.flatMap`, each pairing a season with its `TeamRankings` and skipping seasons where the team is missing. Render a `grid min-h-0 flex-1 grid-cols-[auto_1fr] gap-6` with:
  - Left: `<nav aria-label="Seasons" id={leftId} className="overflow-y-auto pr-2">`, a `ul` of entries. Each `li` has `data-season={season.name}` and a `relative rounded-lg p-3` wrapper holding `SeasonOverview` with `title` set to `<button type="button" aria-current={isActive ? 'true' : undefined} className="cursor-pointer text-left after:absolute after:inset-0 after:content-['']">` containing the season name. The active entry gets `bg-muted ring-1 ring-ring` and the others `hover:bg-muted/50`, chosen with `cn()` and a boolean
  - Right: `<div id={rightId} className="overflow-y-auto pr-2">` holding one `<div data-season={season.name}>` per entry, each with `<SeasonDetail headingLevel="h2" … />` and a `Separator` between seasons
  - `active` in `useState`, initially the first entry's season name; no scroll syncing yet (US2/US3)

  Use the `entries` shape for both columns so their order always matches.
- [ ] T012 [US1] Rewrite `src/components/TeamHistory/TeamHistory.tsx` to render `<TeamHistoryColumns team={props.team} seasons={props.seasons} />`. Remove the old card markup, `aiSummary` paragraph, "AI-generated summary" badge, and card-level `onClick` navigation (the narrow-layout branch is added in US4, T017)
- [ ] T013 [US1] Update `src/views/TeamHistoryView.tsx`: root becomes `flex flex-col lg:h-[calc(100dvh-4rem)]`, the h1 gets `shrink-0`, and the Suspense content stays a direct child so the columns grid can `flex-1` (research §2). On narrow screens the page keeps its natural height

**Checkpoint**: US1 complete. Desktop shows both columns with all content; `npm test` passes.

---

## Phase 4: User Story 2 - Jump to a season from the overview (Priority: P2)

**Goal**: Clicking a left entry scrolls the right column to that season and highlights it, with no highlight flicker.

**Independent Test**: At 1280px, click a mid-list season, the last season and the first season. Each time the right column brings that section to the top (or as far as it can) and only the clicked entry is highlighted.

### Tests for User Story 2

- [ ] T014 [US2] In `src/components/TeamHistory/TeamHistory.test.tsx`, add: clicking the second `Seasons` button moves `aria-current="true"` to it, and `Element.prototype.scrollTo` (stub it with `vi.fn()` on the right column) is called with `behavior: 'smooth'`; with `mockReducedMotion(true)` and the narrow query not matching (use `mockMediaQueries(['(prefers-reduced-motion: reduce)'])`), it's called with `behavior: 'auto'`; keyboard (`user.tab` then `{Enter}`) activates an entry the same way

### Implementation for User Story 2

- [ ] T015 [US2] In `src/components/TeamHistory/TeamHistoryColumns.tsx`, add:
  - `const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')`
  - `scrollTarget` state (`string | undefined`)
  - `selectSeason(name)`: set `active = name`; find the right column by `document.getElementById(rightId)` and the section by `querySelector(`[data-season="${name}"]`)`; compute `top = section.offsetTop - column.offsetTop`, capped at `column.scrollHeight - column.clientHeight`; if it differs from `column.scrollTop` by more than 1px, set `scrollTarget = name` and call `column.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })`
  - `onScrollEnd` on the right column: clear `scrollTarget`, leaving `active` as is (research §4)

  Wire the left `button` `onClick` to `selectSeason`. A second click while a scroll is running just replaces `scrollTarget` (latest click wins).

**Checkpoint**: US1 and US2 work. Manual check in the built-in browser per quickstart step 2.

---

## Phase 5: User Story 3 - Overview follows reading position (Priority: P3)

**Goal**: Scrolling the right column updates the highlight and keeps the highlighted entry visible on the left.

**Independent Test**: At 1280px, scroll the right column slowly top to bottom. The highlight follows season by season and the left column only scrolls when the highlighted entry would be off its visible area.

### Implementation for User Story 3

- [ ] T016 [US3] In `src/components/TeamHistory/TeamHistoryColumns.tsx`, add an `onScroll` handler on the right column (research §3, data-model "Desktop view state"):
  - Read `scrollTop`, `clientHeight` and `scrollHeight` from `event.currentTarget`. `atEnd = scrollTop + clientHeight >= scrollHeight - 1`. `computed` is the last `[data-season]` child whose `offsetTop - column.offsetTop <= scrollTop + 1`, or the last season when `atEnd`
  - If `scrollTarget` is set: clear it when `computed === scrollTarget` or `atEnd`, and otherwise return without changing `active`
  - Else if `computed !== active`: set `active = computed` and call `revealEntry(computed)`
  - `revealEntry(name)` finds the left nav by `leftId` and the `li[data-season]`; if `entryTop < nav.scrollTop` set `nav.scrollTop = entryTop`; else if `entryBottom > nav.scrollTop + nav.clientHeight` set `nav.scrollTop = entryBottom - nav.clientHeight`; otherwise do nothing (FR-010), using `entryTop = li.offsetTop - nav.offsetTop`. Respect reduced motion by using `nav.scrollTo({ top, behavior })`

  Don't use `useEffect` or `scrollIntoView`.

**Checkpoint**: Desktop behavior complete. Manual scroll-spy check per quickstart step 2 (jsdom has no layout, so this story is checked by hand).

---

## Phase 6: User Story 4 - Read team history on a phone (Priority: P3)

**Goal**: Below 1024px the page is a list of season overviews that expand on tap to show the season detail.

**Independent Test**: At 375px, only overviews show, all collapsed. Tapping one expands its detail below it, tapping again collapses it, two can be open at once, and there are no nested scroll areas.

### Tests for User Story 4

- [ ] T017 [US4] In `src/components/TeamHistory/TeamHistory.test.tsx`, add a `describe('narrow layout')` using `mockMediaQueries(['(max-width: 1023.98px)'])` (restore in `afterEach`). Check that:
  - there is no `Seasons` navigation
  - each season header `button` has `aria-expanded="false"` and no storyline list is visible
  - clicking `storied` sets `aria-expanded="true"` and shows the `storied Miami Heat storylines` list and its `View storied chart` link
  - clicking `plain` keeps `storied` expanded
  - clicking `storied` again collapses it
  - a playoff badge click doesn't toggle its season

### Implementation for User Story 4

- [ ] T018 [US4] Create `src/components/TeamHistory/TeamHistoryAccordion.tsx` with props `{ team: Team; seasons: Season[] }` and the same `entries` derivation as T011. Render `<Accordion type="multiple" className="flex flex-col gap-3">`. Each `<AccordionItem value={season.name}>` has a `relative` header area holding `SeasonOverview` with `title` set to `<AccordionTrigger className="cursor-pointer after:absolute after:inset-0 after:content-['']">` showing the season name (the shadcn trigger includes its own Header wrapper; the badges stay above it via `z-10` from T006), and `<AccordionContent><SeasonDetail season={…} team={…} teamId={props.team} /></AccordionContent>` with no `headingLevel`, since the trigger already names the season. If the generated trigger's chevron or flex layout fights the overview row, adjust it with classes passed from here, not by editing `src/components/ui/accordion.tsx`
- [ ] T019 [US4] In `src/components/TeamHistory/TeamHistory.tsx`, add `const narrow = useMediaQuery('(max-width: 1023.98px)')` and render `TeamHistoryAccordion` when `narrow`, otherwise `TeamHistoryColumns` (research §1)

**Checkpoint**: All four stories work. `npm test` passes.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T020 Remove anything in `src/components/TeamHistory/TeamHistory.tsx`, `SeasonDetail.tsx` and `src/views/TeamHistoryView.tsx` that no longer has a use (old `Card`/`Badge` imports, `useNavigate`, the `stopPropagation` comment in `src/components/Badges/DataSourceBadge.tsx` if it now only refers to the removed card click). Leave `src/components/TeamSeasonSummary.tsx` and `getAISummary` unchanged
- [ ] T021 Run `npm run lint`, `npm test` and `npm run build`, and fix any failures
- [ ] T022 Manual validation in the built-in browser following `specs/022-team-history-two-column/quickstart.md` steps 2–4: desktop at 1280px (independent scroll, click-to-scroll without flicker, last-season click, scroll spy, left-column nudge, reduced motion, badge tooltips don't select, player and chart links), narrow at 375px (collapsed overviews, toggle, multiple open, no horizontal scroll), and the no-storylines and in-progress season notes
- [ ] T023 Run `npm run preview` and open `#/teamHistory/bos` under the configured base path to confirm the route, player links and chart links resolve (constitution quality gate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: T003 and T004 need nothing; T005 needs nothing; T006 and T007 need T005 (folder exists); T008 needs T007
- **US1 (Phase 3)**: needs Phase 2
- **US2 (Phase 4)**: needs T011 (same file)
- **US3 (Phase 5)**: needs T015 (same file, uses `scrollTarget`)
- **US4 (Phase 6)**: needs Phase 2, T001 and T002; T019 needs T012. Independent of US2 and US3
- **Polish**: after all stories

### Story Completion Order

```text
Setup → Foundational → US1 (MVP) → US2 → US3
                           └──────→ US4 (can run alongside US2/US3)
```

### Within Each Story

Write or update the tests first and see them fail, then implement until they pass.

## Parallel Opportunities

- Phase 1: T001 ∥ T002
- Phase 2: T003 ∥ T004 ∥ T005, then T006 ∥ T007
- US1: T010 (App.test.tsx) ∥ T009 (TeamHistory.test.tsx), then T011 → T012 → T013
- US4 can run alongside US2/US3: T017 and T018 are separate files from `TeamHistoryColumns.tsx`. T017 and T014 share `TeamHistory.test.tsx`, so don't edit both at once

### Parallel Example: Foundational

```text
Task: "T003 Add getTopPlayersByMinutes to src/data/seasonData.ts"
Task: "T004 Unit tests for getTopPlayersByMinutes in src/data/seasonData.test.ts"
Task: "T005 Move TeamHistory into src/components/TeamHistory/"
```

### Parallel Example: After US1

```text
Developer A: T014 → T015 → T016 (desktop scroll sync, TeamHistoryColumns.tsx)
Developer B: T018 → T019 (narrow Accordion, TeamHistoryAccordion.tsx / TeamHistory.tsx)
```

## Implementation Strategy

### MVP (US1 only)

Phases 1–3 give the two-column desktop page with top players, chart links and no AI summaries. Narrow screens would show the same two-column grid squeezed, so don't release the MVP on its own if phones matter; add US4 before merging.

### Incremental Delivery

1. Setup + Foundational → top players and shared pieces ready
2. US1 → two columns (MVP; desktop demo)
3. US4 → phone layout (makes the page safe to ship)
4. US2 → click to jump
5. US3 → scroll spy and left-column nudge
6. Polish → lint, build, test, manual and preview checks, then PR
