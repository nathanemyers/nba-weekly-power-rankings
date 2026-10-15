---

description: "Task list for the chart weekly-summary tooltip fixes"
---

# Tasks: Chart Weekly-Summary Tooltip Fixes

**Input**: Design documents from `/specs/013-chart-tooltip-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/chart-ui.md, quickstart.md

**Tests**: Included. The plan and [contracts/chart-ui.md](contracts/chart-ui.md) define what the tests check on the page. Each story writes its tests before its code.

**Organization**: Tasks are grouped by user story. Both stories edit the same two files, so their tasks run one after another, not in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Rules that apply to every task (AGENTS.md)

- Do not add `useMemo`, `useRef` or `useEffect`.
- Never build Tailwind class names from variables; run-time values go in `style`.
- Comments are at most one sentence.
- Use Prettier style: single quotes, no semicolons.

## Shared test setup

In `src/components/Chart/Chart.test.tsx`:

- The default `chart()` renders a 960 × 600 chart. Its weeks run 1–11 over plot x 190–840.
- Week 1 sits at about 19.8% of the width, so it is on the left side.
- Week 11 sits at about 87.5%, so it is on the right side.
- `buildTeams()` returns, in order, Boston (`#2EAD61`), Lakers (`#B388FF`), Miami (`#E0115F`) and Detroit.

---

## Phase 1: Setup

- [ ] T001 Run `npm test` and record the baseline. All tests in `src/components/Chart/Chart.test.tsx` and the rest of the suite must pass before any change is made.

---

## Phase 2: Foundational

No foundational work is needed. Both stories change only `src/components/Chart/Chart.tsx` and `src/components/Chart/Chart.test.tsx`.

---

## Phase 3: User Story 1 - A pinned team's weekly nodes always respond (Priority: P1) 🎯 MVP

**Goal**: Draw the pinned team's line and dots above every other team's, so its tooltips open in crowded areas.

**Independent Test**: The new layering tests pass. In the dev server, every dot of a pinned team in a crowded area opens its tooltip (quickstart §2).

### Tests for User Story 1

- [ ] T002 [US1] In `src/components/Chart/Chart.test.tsx`, add the test `draws the pinned team above the other teams`. Render `chart({ pinnedTeams: [Team.Boston] })` and select the team groups with `container.querySelectorAll('g[clip-path="url(#plot-clip)"] > g')`. Assert:
  - the **last** group contains `path[stroke="#2EAD61"]` (Boston);
  - the first three groups contain the Lakers, Miami and Detroit lines, in that order.
- [ ] T003 [US1] In `src/components/Chart/Chart.test.tsx`, add the test `keeps the default team order when nothing is pinned`. Render `chart()` and assert that the first team group contains Boston's line and the last contains Detroit's line.
- [ ] T004 [US1] In `src/components/Chart/Chart.test.tsx`, add the test `shows the pinned team's tooltip from a node drawn on top`.
  1. Render `chart({ pinnedTeams: [Team.Boston] })`.
  2. Get the first Boston dot with `container.querySelectorAll('circle[fill="#2EAD61"]')[0]` and fire `mouseEnter` on it.
  3. Assert that the text `#1 Boston Celtics (0-0)` and `Week 1 summary` appear.

  Run the three new tests and confirm that T002 fails.

### Implementation for User Story 1

- [ ] T005 [US1] In `src/components/Chart/Chart.tsx`:
  - Add `sortBy` to the lodash import.
  - Inside the `<g clipPath="url(#plot-clip)">` block, replace `props.teams.map((team) => {` with `sortBy(props.teams, (team) => props.pinnedTeams.includes(team.teamId)).map((team) => {`.
  - Above it, add the one-line comment `// Pinned teams draw last so their line and dots sit above every other line`.
  - Leave the hover handlers, the dot rendering and `key={team.teamId}` unchanged.
- [ ] T006 [US1] Run `npx vitest run src/components/Chart`. T002–T004 and all existing chart tests must pass. Existing tests that call `hitPath(container, i)` with a pinned team must still pass; per research R4 the only such test indexes Boston at 0 while Miami is pinned, so it is unaffected. If any index shifts, update that test's index rather than its assertion.

**Checkpoint**: User Story 1 works on its own.

---

## Phase 4: User Story 2 - Tooltips near the right edge stay readable (Priority: P2)

**Goal**: Tooltips keep the same width wherever their dot sits, and they always stay inside the chart.

**Independent Test**: The new placement tests pass. In the dev server, tooltips for the last week and for mid-season match in width at desktop and phone sizes (quickstart §3).

### Tests for User Story 2

- [ ] T007 [US2] In `src/components/Chart/Chart.test.tsx`, add a helper `tooltip()` that returns `screen.getByText('Week …').closest('div')`, matching the tooltip's week label. Then add the test `opens a right-side tooltip leftward, anchored on its right edge`.
  1. Render `chart({ pinnedTeams: [Team.Boston] })` and fire `mouseEnter` on the last Boston dot (week 11, x = 840).
  2. Assert that the tooltip's `style.right` is `12.5%` (that is `(1 − 840/960) × 100`), that `style.left` is `''`, and that `style.transform` is `translate(-14px, -50%)`.
- [ ] T008 [US2] In `src/components/Chart/Chart.test.tsx`, add the test `opens a left-side tooltip rightward, anchored on its left edge`. Use the same setup with the first Boston dot (week 1, x = 190). Assert that `style.left` is `19.791666666666664%` (or compare with `toBeCloseTo(19.79, 1)` after `parseFloat`), that `style.right` is `''`, and that `style.transform` is `translate(14px, -50%)`.
- [ ] T009 [US2] In `src/components/Chart/Chart.test.tsx`, add the test `sizes every tooltip to its content with a shared cap`. For both the week-1 and week-11 tooltips, assert that the tooltip has the classes `w-max` and `max-w-[min(20rem,calc(50%-14px))]` and does not have `max-w-80`. Run the tests and confirm that T007–T009 fail.

### Implementation for User Story 2

- [ ] T010 [US2] In `src/components/Chart/Chart.tsx`, rewrite the `hoveredTooltip` block:
  - Compute `const tipX = x(hoveredTooltip.week) / props.width` (a fraction of the width) and `const opensLeft = tipX > 0.5`, which replaces the old `> props.width * 0.6` check.
  - **Style:** `top` is unchanged. If `opensLeft`, use `right: `${(1 - tipX) * 100}%`` and `transform: 'translate(-14px, -50%)'`. Otherwise use `left: `${tipX * 100}%`` and `transform: 'translate(14px, -50%)'`. Never set both `left` and `right`.
  - **Classes:** in the `className`, replace `max-w-80` with `w-max max-w-[min(20rem,calc(50%-14px))]`, keeping it a literal string.
  - Add the one-line comment `// Anchoring on the far edge keeps the full width available near the right side`.
  - Leave the tooltip content unchanged (FR-007).
  - Because the code reads `hoveredTooltip` before rendering, a single expression is fine; no hooks are needed.
- [ ] T011 [US2] Run `npx vitest run src/components/Chart`. T007–T009 and all earlier tests must pass, including `shows rank, full team name, record, summary and week in the tooltip`.

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T012 Run `npx prettier --write src/components/Chart/Chart.tsx src/components/Chart/Chart.test.tsx`, then `npm run lint`, `npx tsc -b`, `npm test` and `npm run build`, and fix any failures.
- [ ] T013 Work through [quickstart.md](quickstart.md) §2 and §3 in the dev server.
  - **§2:** pin a team in the crowded middle ranks and confirm that every dot opens its tooltip.
  - **§3:** at desktop and at 375 px wide, confirm that the last-week and mid-season tooltips have equal widths and stay inside the chart. Confirm that the flip happens at the chart's midpoint.
  - Check that the console shows no errors.

---

## Dependencies & Execution Order

- T001 → US1 (T002–T006) → US2 (T007–T011) → Polish (T012–T013).
- Within each story: write the tests first and see them fail, then implement and see them pass.
- US2 does not depend on US1's behaviour. It comes after US1 only because both edit the same two files.

## Parallel Opportunities

None that are safe. Every task edits `Chart.tsx` or `Chart.test.tsx`. The only independent work is the quickstart walkthrough (T013), which an observer could run while T012's checks run.

## Implementation Strategy

1. **MVP**: T001–T006. Pinned teams draw on top, which fixes the tooltips that go missing in crowded areas.
2. **Increment 2**: T007–T011, the right-edge tooltip width.
3. **Polish**: T012–T013, then commit.
