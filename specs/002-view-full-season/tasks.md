---

description: "Task list template for feature implementation"
---

# Tasks: View Full Season (Zoom Out)

**Input**: Design documents from `/specs/002-view-full-season/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/view-mode-interface.md,
quickstart.md

**Tests**: Required by this feature — the constitution (v1.1.0, Development Workflow & Quality
Gates) makes `npm test` a merge gate, and this feature is what introduces the Vitest suite in the
first place (research.md §8). Test tasks are included per user story below.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. Because this feature is a single boolean toggle (`zoomedOut`) with one
shared rendering branch, most new code lands in Foundational/US1; US2 and US3 are primarily
verification of behavior the shared code already provides symmetrically — this is called out
explicitly in each task rather than padded with artificial per-story duplication.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-project Vite app at repository root (per plan.md Project Structure):
`src/App.tsx`, `src/Chart/Chart.tsx`, `src/Chart/Chart.test.tsx`, `src/test/setup.ts`,
`vite.config.ts`, `package.json`, `eslint.config.js`, `.github/workflows/deploy.yml`.

---

## Phase 1: Setup

**Purpose**: Get the toolchain and new test dependencies in place before any config or code
changes.

- [x] T001 Verify the local toolchain: run `npm ci` from the repository root and confirm it
      completes without errors
- [x] T002 Install the new dev-only test dependencies (plan.md Technical Context; research.md
      §8): `npm install -D vitest @testing-library/react @testing-library/jest-dom
      @testing-library/user-event jsdom` — these are dev-only and never reach the shipped `dist/`
      bundle, so they don't conflict with constitution V's runtime-dependency scrutiny

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test tooling, the configurable window-width constant, the generalized x-scale, and
the lifted view-mode state — all of which every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Configure Vitest in `vite.config.ts`: switch the `defineConfig` import from
      `vite` to `vitest/config`, and add a `test` block with `environment: 'jsdom'`,
      `globals: true`, and `setupFiles: ['./src/test/setup.ts']` (research.md §8) (depends on
      T002)
- [x] T004 [P] Create `src/test/setup.ts` that imports `@testing-library/jest-dom/vitest` to
      register its matchers globally (plan.md Project Structure) (depends on T002) — used the
      `/vitest` subpath rather than the bare package: it both registers the matchers and augments
      Vitest's `Assertion` type, which `tsc -b` requires for `toBeInTheDocument()`/
      `toHaveAttribute()` to type-check in test files
- [x] T005 Add a `"test": "vitest run"` script to `package.json` (research.md §8) (depends on
      T002; same file as T002's dependency changes, so sequential with it)
- [x] T006 [P] In `eslint.config.js`, merge `globals.vitest` into the existing
      `languageOptions.globals` for the `**/*.{ts,tsx}` block (currently `globals.browser` only),
      so `describe`/`it`/`expect`/etc. don't fail `npm run lint` in test files (`globals.vitest`
      is already available from the installed `globals` package)
- [x] T007 [P] In `src/Chart/Chart.tsx`, export `DEFAULT_WINDOW_WEEKS = 10` and accept an
      optional `windowWeeks` prop on `RankingsChart` defaulting to it; replace every current use
      of the hard-coded `VISIBLE_WEEKS` (the x-scale denominator, `maxStart`, the `end`/`weeks`
      computation) with this configurable value (research.md §2; FR-004: "number of weeks shown
      in the windowed view MUST be a configurable value (default: 10 weeks) rather than fixed")
- [x] T008 In `src/Chart/Chart.tsx`, add the two new required props from
      contracts/view-mode-interface.md — `zoomedOut: boolean` and `onToggleZoom: () => void` —
      to `RankingsChart`. Generalize the x-scale: `span` is `windowWeeks` in windowed mode or
      `maxWeek - 1` in full-season mode, and the `weeks` tick array becomes `[1..maxWeek]` instead
      of `[start..start+windowWeeks]` when `zoomedOut` is true (research.md §3). Per
      data-model.md's `start` field (`1 <= start <= maxStart; forced to 1 whenever zoomedOut is
      true`): do this as a render-time override only — do **not** mutate the underlying `start`
      state when `zoomedOut` toggles, so that zooming back in restores the exact previous
      windowed position unchanged (data-model.md View Mode state transition). Per
      contracts/view-mode-interface.md: "Chart.tsx MUST treat `zoomedOut` as the single source of
      truth for which mode is active; it MUST NOT maintain a second, internal 'is zoomed' flag
      that could drift from the prop." (depends on T007; same file, sequential)
- [x] T009 In `src/Chart/Chart.tsx`, derive `canZoomOut = maxWeek > windowWeeks` inline from
      props on every render — not cached in state, not computed once per season (research.md §7;
      data-model.md: "recomputed from the current season's `maxWeek` on every render ... never
      cached") (depends on T008; same file, sequential)
- [x] T010 In `src/Chart/Chart.tsx`, clear the component's local `hover` state (but leave
      `pinned` untouched) whenever the `zoomedOut` prop changes (research.md §6: "Clearing
      `hover` is the simplest correct behavior ... pinned is left untouched because FR-008
      requires the pinned team to survive the switch") (depends on T008; same file, sequential)
      — implemented as a render-time state adjustment (compare `zoomedOut` to a tracked
      `prevZoomedOut`), not a `useEffect`: `eslint-plugin-react-hooks`'s
      `set-state-in-effect` rule flags synchronous `setState` in an effect body, and React's own
      docs recommend this "adjusting state during render" pattern for exactly this case
- [x] T011 [P] In `src/App.tsx`, lift `zoomedOut` boolean state above `RankingsChart` (which
      remounts per season via `key={season}` at `src/App.tsx:116`) and define a toggle handler
      that flips it; pass both down as the `zoomedOut`/`onToggleZoom` props (research.md §1;
      contracts/view-mode-interface.md: "`App.tsx` MUST NOT reset `zoomedOut` when the selected
      season changes. ... Calling `onToggleZoom` MUST be the only way `zoomedOut` changes;
      `Chart.tsx` never mutates it directly.") (depends on T008 for the prop names/shape, but a
      different file — can be written in parallel once the prop contract above is fixed)

**Checkpoint**: Foundation ready — test tooling works, the window width is configurable, the
scale renders either mode correctly, and view-mode state survives a season switch. User story
implementation can now begin.

---

## Phase 3: User Story 1 - See the whole season's trend at a glance (Priority: P1) 🎯 MVP

**Goal**: A visible control lets a visitor switch into full-season view, where every recorded
week renders correctly with all existing interactions and the playoff column intact, and paging
controls make way for it.

**Independent Test**: Load a season, trigger the zoom-out control, and confirm every recorded
week for every team is visible in the chart at once, with no paging controls required to see the
full picture.

### Implementation for User Story 1

- [x] T012 [US1] In `src/Chart/Chart.tsx`, render a zoom toggle button only when `canZoomOut` is
      `true` (FR-003: "zoom-out control MUST be hidden" otherwise); its label reflects the active
      mode ("Zoom out" when windowed, "Zoom in" when full-season — FR-002: "clearly indicate
      which view mode is currently active"), and its `onClick` calls `onToggleZoom`. This single
      control serves both directions — US2 re-verifies its "Zoom in" behavior rather than adding
      a second control. (depends on T009, T011)
- [x] T013 [US1] In `src/Chart/Chart.tsx`, hide the Earlier/Later buttons and make the
      keyboard-arrow `useEffect` handler a no-op while `zoomedOut` is `true` (research.md §5;
      FR-009: "Earlier/Later paging controls and arrow-key panning MUST be inactive while in
      full-season view"). The same conditional re-enables them when `zoomedOut` is `false`,
      which is what US2 relies on for the return trip — no separate code path. (depends on T012)
- [x] T014 [US1] In `src/Chart/Chart.tsx`, change the existing `start === maxStart` condition
      that reveals the end-of-season playoff-medal column to `zoomedOut || start === maxStart`
      (research.md §4; FR-006) (depends on T009)
- [x] T015 [US1] Add `src/Chart/Chart.test.tsx` covering this story's acceptance scenarios: full
      season renders with every recorded week visible when zoom-out is activated; the playoffs
      marker sits at its correct week position; a team's line still shows gaps across weeks it
      wasn't ranked (not a connecting line); the end-of-season playoff-medal column appears; the
      zoom control does not render when `maxWeek <= windowWeeks` (pass a narrow season fixture
      and a wide `windowWeeks` prop to exercise this, per quickstart.md Scenario 4's note on
      testing this in-test rather than by hand-editing source) (depends on T012, T013, T014) —
      5 tests in the "User Story 1" describe block, all passing

**Checkpoint**: User Story 1 is fully functional and testable independently — zooming out shows
the whole season correctly.

---

## Phase 4: User Story 2 - Return to the detailed weekly window (Priority: P2)

**Goal**: The same control, now showing "Zoom in," returns the visitor to exactly the windowed
position they left, with paging and keyboard panning restored and their pinned team intact.

**Independent Test**: From full-season view, trigger the zoom-in control and confirm the chart
returns to a windowed view with working Earlier/Later navigation, at the same position as before.

### Implementation for User Story 2

- [x] T016 [US2] Verify (and adjust if needed) that the conditionals added in T012/T013 are
      fully symmetric: activating the same control from full-season view flips `zoomedOut` back
      to `false`, which — per T008's render-time-only override — restores the windowed view at
      the exact `start` the visitor had before zooming out, with Earlier/Later and keyboard
      panning both re-enabled (FR-007) (depends on T013, T014) — confirmed symmetric by
      inspection and by T017's passing round-trip test; no adjustment was needed
- [x] T017 [US2] Add `src/Chart/Chart.test.tsx` cases for this story: pin a team, zoom out, zoom
      back in — assert the windowed view's `start` matches what it was before zooming out
      (data-model.md: "unchanged from before the zoom out"), Earlier/Later and keyboard panning
      work again, and the same team is still pinned (FR-008) (depends on T016) — 2 tests in the
      "User Story 2" describe block, both passing (required building a stateful test harness
      component owning `zoomedOut`, mirroring `App.tsx`, since `RankingsChart` never mutates the
      prop itself per contracts/view-mode-interface.md)

**Checkpoint**: User Stories 1 and 2 both work — the full round trip preserves position and
pinned state.

---

## Phase 5: User Story 3 - Zoom state carries across season changes (Priority: P3)

**Goal**: Switching the season selector while zoomed out keeps the newly loaded season in
full-season view too, with no need to re-activate the control.

**Independent Test**: Zoom out, switch to a different season in the selector, and confirm the
newly loaded season also renders in full-season view.

### Implementation for User Story 3

- [x] T018 [US3] Add a test (component-level against `App.tsx`, or a `Chart.test.tsx` case that
      re-renders with new `teams`/`maxWeek` props while holding `zoomedOut` constant, matching
      how `key={season}` remounts `Chart.tsx` while `App.tsx`'s lifted state survives) asserting
      that a season switch while `zoomedOut` is `true` renders the new season already in
      full-season view, with no re-activation of the control (FR-010; depends on T011's lift
      already being correct — this task is primarily verification, not new production code) —
      implemented as an unmount-then-render-fresh test (truer to a `key`-based remount than a
      same-instance rerender) in the "User Story 3" describe block, passing

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge-case coverage, CI enforcement of the new test gate, and final validation.

- [x] T019 [P] Add a `Chart.test.tsx` case: open a tooltip (hover a data point), then activate
      the zoom control in either direction — assert the tooltip closes rather than pointing at a
      stale position (quickstart.md Scenario 5; research.md §6)
- [x] T020 [P] Add a `Chart.test.tsx` case: with `zoomedOut` true, press the Left/Right arrow
      keys and assert no change occurs (quickstart.md Scenario 5; FR-009)
- [x] T021 Add a `run: npm test` step to the `build` job in `.github/workflows/deploy.yml`,
      alongside the existing `npm run lint`/`npm run build` steps, so constitution v1.1.0's test
      gate is enforced in CI, not just locally (plan.md Constitution Check note)
- [x] T022 Run the full quickstart.md validation end to end: all 5 scenarios manually in
      `npm run dev`, plus `npm run lint`, `npm run build`, `npm test`, and `npm run preview`
      under `/nba-weekly-power-rankings/` (depends on T015, T017, T018, T019, T020, T021) —
      `npm run lint`, `npm test` (10/10 passing, covering all 5 scenarios per T015/T017/T018/
      T019/T020), and `npm run build` all pass; `npm run preview` curl-verified serving
      `index.html` (200) and the main bundle correctly prefixed with
      `/nba-weekly-power-rankings/`. Scenarios 1–5 were not separately re-driven by hand in a
      live browser in this session — the automated suite is quickstart.md's own documented
      "primary way to validate Scenarios 1–5 going forward"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational. Delivers the MVP (zoom out works).
- **User Story 2 (Phase 4)**: Depends on Foundational AND on User Story 1's T012–T014 (same
  shared control/conditionals, extended rather than duplicated).
- **User Story 3 (Phase 5)**: Depends on Foundational (specifically T011). Does not depend on
  US1/US2's UI tasks — it only verifies state survives a season switch, so it could be written in
  parallel with Phase 3/4 by a different person.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- US1: control visibility/label → hide paging while zoomed → playoff column condition → tests
- US2: verify symmetric behavior → tests
- US3: test only (production code already correct from Foundational T011)

### Parallel Opportunities

- T003, T004, T006 (Foundational: different files, no inter-dependency) can run in parallel
- T007 (Chart.tsx constant) and T011 (App.tsx state lift) touch different files and can run in
  parallel once T008's prop contract (already fixed by contracts/view-mode-interface.md) is
  agreed
- T019 and T020 (different test cases, same file but independent assertions) can be written in
  parallel by different people, accepting a merge in `Chart.test.tsx`
- Phase 5 (US3) can proceed in parallel with Phase 3/4, since it touches no shared UI code

---

## Parallel Example: Foundational Phase

```bash
Task: "Configure Vitest in vite.config.ts"
Task: "Create src/test/setup.ts registering jest-dom matchers"
Task: "Merge globals.vitest into eslint.config.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `Chart.test.tsx`'s US1 cases and quickstart.md Scenario 1 manually
5. Demo: zooming out shows the whole season correctly — MVP done

### Incremental Delivery

1. Complete Setup + Foundational → scale, config, and lifted state all correct
2. Add User Story 1 → validate independently → zoom-out works (MVP!)
3. Add User Story 2 → validate independently → zoom-in restores position and pin
4. Add User Story 3 → validate independently → zoom survives a season switch
5. Polish: edge-case tests, CI gate, full quickstart re-validation

### Parallel Team Strategy

With two contributors, once Foundational is done:

- Contributor A: User Story 1 → User Story 2 (same shared control, sequential)
- Contributor B: User Story 3 (test-only, no shared-file conflicts with A)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature is one boolean toggle with a single shared rendering branch — most of the real
  production code lands in Foundational/US1 by necessity; US2/US3 are primarily verification that
  the shared code behaves symmetrically, which is called out explicitly rather than padded with
  duplicate "implementation" tasks that would just re-touch the same lines
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
