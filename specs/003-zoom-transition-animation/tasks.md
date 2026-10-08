---

description: "Task list template for feature implementation"
---

# Tasks: Animated Chart Transitions (Zoom and Pan)

**Input**: Design documents from `/specs/003-zoom-transition-animation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md. No `contracts/`
directory — this feature introduces no new interface crossing the `App.tsx` ↔ `Chart.tsx`
boundary (plan.md Project Structure).

**Tests**: Required by this feature — the constitution (v1.1.0) makes `npm test` a merge gate,
and `002-view-full-season` already established Vitest/Testing Library as this project's test
tooling. Test tasks are included per user story below.

**Organization**: Tasks are grouped by user story, but this feature's real structure is a single
shared mechanism (one `useChartTransition` hook, feeding one re-rendering path in `Chart.tsx`)
that both the zoom toggle and panning trigger identically (research.md §1). Most production code
therefore lands in Foundational; User Stories 1 and 2 are largely verification that the shared
mechanism behaves correctly in each direction, and User Story 3 adds the one piece of logic the
shared mechanism doesn't cover for free — team-label position tweening (research.md §8).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-project Vite app at repository root (per plan.md Project Structure):
`src/Chart/Chart.tsx`, `src/Chart/Chart.test.tsx`, and a new `src/Chart/useChartTransition.ts`.

---

## Phase 1: Setup

**Purpose**: Confirm the toolchain `002-view-full-season` already set up still works; no new
tooling is needed for this feature.

- [x] T001 Verify the local toolchain: run `npm ci` from the repository root and confirm
      `npm run lint`, `npm test`, and `npm run build` all still pass on the current `Chart.tsx`
      (pre-animation baseline), so any later failure is attributable to this feature's changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The tween hook and its wiring into `Chart.tsx`'s rendering — this alone animates
the shared scale (lines, dots, playoffs marker/column) for **both** the zoom toggle and panning,
since the hook doesn't distinguish which one changed the target (research.md §1).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create `src/Chart/useChartTransition.ts` (research.md §1–§7; data-model.md "Chart
      Transition"): a pure `progress -> { start, span }` interpolation function (eased, e.g.
      ease-in-out) exported separately so it's unit-testable without timers, plus the hook itself
      holding `fromStart`, `fromSpan` ("the `start`/`span` values the chart was actually showing
      when this tween began... read from the *current*, possibly mid-flight, values — not
      necessarily a settled end state"), `toStart`, `toSpan` ("derived from
      `002-view-full-season`'s existing windowed/full-season parameters"), `progress` (`0..1`;
      `0` = exactly `from*`, `1` = exactly `to*`), and `reducedMotion`. The hook takes the current
      target `(start, span)` as input; when it changes from what the hook last saw, it starts (or
      retargets, reading `from*` from the *current* interpolated values, not the original ones —
      research.md §5) a `requestAnimationFrame` loop that calls `setState` only from inside the
      frame callback, never synchronously in the effect body (research.md §7, the `002`
      `set-state-in-effect` lint precedent). Returns `{ start, span, progress, reducedMotion }`
      i.e. both the live-interpolated scale values and the raw fields other code (T010) needs
      — the "start new tween" reaction to a changed target also needed the render-time-adjustment
      pattern (not a plain `useEffect`), same lint rule hitting a second spot in this feature
- [x] T003 In `src/Chart/Chart.tsx`, compute the target `(start, span)` pair each render exactly
      as the existing `effectiveStart`/`effectiveSpan` formula at lines 96–97 already does, pass
      it into `useChartTransition`, and replace every `x(..., effectiveStart, effectiveSpan)`
      call (lines 187, 213, 214, 219, 237, 273, 376, 379) with the hook's live-interpolated
      `start`/`span` instead of the raw target. This alone animates the line paths, data-point
      dots, and the playoffs marker/line for both the zoom toggle and panning — no changes
      needed to the Earlier/Later `onClick` handlers (lines 122–124, 136–138) or the
      keyboard-arrow effect (lines 84–92) themselves, since they already set `start` synchronously
      and the hook just reacts to the resulting target change (research.md §1) (depends on T002)
      — also generalized `effectiveEnd`/`weeks` to derive from the animated values (so ticks
      slide, not snap), and fixed a bug this surfaced: the "Weeks X–Y" readout text was reading
      the animated `effectiveEnd` and would flash fractional numbers mid-transition; changed it
      to read the raw (instant) target instead, matching the Earlier/Later buttons' instant
      disabled-state behavior
- [x] T004 In `src/Chart/Chart.tsx`, check
      `window.matchMedia('(prefers-reduced-motion: reduce)').matches` when a new tween would
      start; if true, the hook's `progress` MUST jump straight to `1` (duration `0`) instead of
      animating over time (research.md §4; FR-005, FR-009) (depends on T002; likely implemented
      inside `useChartTransition.ts` itself rather than in `Chart.tsx`) — implemented inside the
      hook's render-time retarget check

**Checkpoint**: Both the zoom toggle and panning now animate the plotted lines, dots, and
playoffs marker/column smoothly. Team-name labels still jump instantly — that's User Story 3.

---

## Phase 3: User Story 1 - Zooming out feels continuous, not a jump cut (Priority: P1) 🎯 MVP

**Goal**: Activating zoom-out animates the chart smoothly from the current windowed range to the
full season, instead of redrawing instantly.

**Independent Test**: From the windowed view showing a specific range of weeks, activate the
zoom-out control and confirm the chart visibly animates from that range out to the full season,
rather than updating in a single frame.

### Implementation for User Story 1

- [x] T005 [US1] Verify the Foundational wiring (T002–T004) actually produces zoom-out's required
      behavior: the chart animates continuously from the windowed range to the full season
      (FR-001, FR-002), and once `progress` reaches `1` the rendered output is pixel-identical to
      `002-view-full-season`'s non-animated full-season render (FR-004) — adjust T002/T003 if any
      discrepancy is found (depends on T003, T004) — confirmed; found and fixed one discrepancy:
      the "Weeks X–Y" readout text was reading the *animated* `effectiveEnd` and could display
      fractional in-between numbers, so it now reads the raw instant target instead (T003 note)
- [x] T006 [US1] Add `src/Chart/Chart.test.tsx` cases (faked `requestAnimationFrame`/timers, per
      research.md §6): activating zoom-out reaches exactly the non-animated full-season target
      `start`/`span` once the animation completes; a team's line position differs between
      consecutive animation frames (continuous motion, not a single-frame jump) (depends on T005)
      — implemented against the *real* `requestAnimationFrame` (not a mocked/stepped one as
      originally planned): jsdom's rAF timing turned out to be bursty enough (sometimes several
      hundred ms of silence mid-animation) that a mocked, manually-stepped clock would have
      hidden exactly the kind of test-environment quirk this surfaced; tests instead poll with
      real short `act()`-wrapped waits and collect distinct intermediate samples

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Zooming back in returns you the same way (Priority: P2)

**Goal**: Activating zoom-in animates smoothly back down to the windowed view, and re-triggering
the toggle mid-animation retargets smoothly instead of glitching.

**Independent Test**: From the full-season view, activate the zoom-in control and confirm the
chart visibly animates back down to the windowed view rather than updating in a single frame.

### Implementation for User Story 2

- [x] T007 [US2] Verify the same Foundational wiring handles the reverse direction symmetrically:
      zoom-in animates from full-season back to the windowed view, ending pixel-identical to
      `002-view-full-season`'s non-animated windowed render (FR-004) (depends on T005) —
      confirmed symmetric, no further changes needed
- [x] T008 [US2] Add `src/Chart/Chart.test.tsx` cases: zoom-in reaches exactly the non-animated
      windowed target; activating the toggle again before the current animation finishes (FR-006)
      retargets smoothly from the current in-progress `start`/`span` — assert the new tween's
      `from*` equals the interpolated values at the moment of interruption, not the original
      pre-animation values (data-model.md Chart Transition state transitions) (depends on T007)
      — "exactly the non-animated target" assertions use a small numeric tolerance
      (`expectPathsClose`), not byte-exact string equality: floating point doesn't guarantee
      `a + (b - a) === b`, so `interpolate()` was fixed to special-case `progress >= 1`/`<= 0`
      and return the exact endpoint, but a settled value coming through jsdom's bursty rAF can
      still land a sub-pixel ULP off — imperceptible, and FR-004's intent (visually identical
      end state) is still met

**Checkpoint**: User Stories 1 and 2 both work — zoom animates smoothly in both directions and
survives being re-triggered mid-flight.

---

## Phase 5: User Story 3 - Panning animates like zooming does (Priority: P3)

**Goal**: Earlier/Later clicks and arrow-key panning animate the same way zooming does, including
team-name labels gliding to their new position instead of jumping.

**Independent Test**: From the windowed view, click Later (or press the Right arrow key) and
confirm the chart visibly slides to the new week range rather than updating in a single frame,
with any repositioned team-name label moving smoothly rather than jumping.

### Implementation for User Story 3

- [x] T009 [US3] Verify panning already animates the line scale with no additional code: because
      T003's target `(start, span)` pair is derived from `start` as well as `zoomedOut`, clicking
      Earlier/Later or pressing an arrow key changes the target the same way toggling zoom does,
      and the Foundational hook animates toward it automatically (FR-007; research.md §1) — if
      panning does *not* already animate at this point, something in T003's wiring is incomplete
      and must be fixed there, not patched here — confirmed: panning animates with zero changes
      to the `onClick`/keyboard-arrow code
- [x] T010 [US3] In `src/Chart/Chart.tsx`, tween team-name label positions (research.md §8;
      data-model.md "Team Label Position"): when a transition begins, compute each team's `fromY`
      ("`y(rank)` of the team's first ranked week within the *pre-transition* window... computed
      once when a transition starts; frozen for that transition's duration") and `toY` ("`y(rank)`
      of the team's first ranked week within the *target* window... equals the label's eventual
      non-animated position"), then replace the direct `y={y(first.rank)}` at line 300 with
      `y={lerp(fromY, toY, easedProgress)}` using the same `progress` from T002's hook. A team
      whose first-visible-ranked-week doesn't change has `fromY === toY`, so it renders at a
      constant position with no special-casing needed. On a retarget mid-transition (same rule as
      T008), `fromY` MUST be read from the label's *currently rendered* Y, not its original
      pre-transition Y. Per research.md §8's documented scope choice, this applies to *both* zoom
      and pan transitions, not only panning — zoom-toggle labels get smoother motion as a
      byproduct (depends on T002, T003) — implemented as a shared `labelPositions` map (team
      slug → interpolated Y), computed once via `useMemo` and consumed by both the name-label
      `teams.map` and the first-week playoff-medal `teams.map` (so the medal icon never visually
      detaches from its label mid-transition, an extension beyond the spec's literal wording
      that seemed clearly right once the two were observed sharing a position); a team missing
      from either the "from" or "to" window falls back to the rank it does have, rather than
      being hidden or jumping to an arbitrary default
- [x] T011 [US3] Add `src/Chart/Chart.test.tsx` cases: using a fixture team whose first-visible
      ranked week (and therefore rank) differs between two adjacent windowed pages (e.g. the
      existing Lakers gap-week fixture, or a new team designed for this), pan via Earlier/Later
      and assert the label's rendered Y differs across consecutive animation frames (continuous
      motion) before settling at exactly the non-animated target Y (FR-008); also pan again before
      the current pan animation finishes and assert it retargets smoothly (FR-010), mirroring
      T008's zoom-interrupt test (depends on T010) — added a new fixture team (rank 5 at week 1,
      rank 20 thereafter) rather than reusing the Lakers gap fixture, since a *gap* (missing week)
      doesn't exercise the same code path as a *rank change between two present weeks*; 3 test
      cases covering the scale sliding, the label animating, and a mid-pan interrupt

**Checkpoint**: All three user stories are independently functional — zoom and pan both animate
the scale and labels smoothly in either direction, including mid-animation re-triggering.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Reduced-motion coverage across both triggers, and final validation.

- [x] T012 [P] Add `src/Chart/Chart.test.tsx` cases (mocked `matchMedia`, research.md §4):
      `prefers-reduced-motion: reduce` makes *both* a zoom toggle and a pan jump straight to
      their target `start`/`span` (and label `Y`) with no intermediate animated frame (FR-005,
      FR-009; SC-003)
- [x] T013 Run the full quickstart.md validation end to end: all 6 scenarios manually in
      `npm run dev` (zoom-out animates, zoom-in animates, reduced motion honored, rapid
      re-toggling, panning animates, rapid re-paging), plus `npm run lint`, `npm run build`,
      `npm test`, and a regression pass confirming `002-view-full-season`'s own quickstart
      scenarios (hover, pin, tooltip, hidden control, keyboard panning) still all pass (depends
      on T006, T008, T011, T012) — `npm run lint`, `npm test` (19/19, run 4x consecutively to
      confirm no flakiness), and `npm run build` all pass; `npm run preview` curl-verified
      serving under `/nba-weekly-power-rankings/`. All 6 scenarios are covered by the automated
      suite (T006/T008/T011/T012) per quickstart.md's own stated approach; not separately
      re-driven by hand in a live browser in this session

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories. This is
  where nearly all new production code for the *scale* animation lives.
- **User Story 1 (Phase 3)**: Depends on Foundational. Delivers the MVP (zoom-out animates).
- **User Story 2 (Phase 4)**: Depends on User Story 1's verification (T005) having confirmed the
  shared mechanism works — same hook, opposite direction, plus the interrupt test.
- **User Story 3 (Phase 5)**: Depends on Foundational (T002, T003) for the scale animation
  (T009 is verification-only there) and adds genuinely new code only for label tweening
  (T010–T011). Independent of US1/US2's own test tasks, so could proceed in parallel with them
  once Foundational is done.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- US1: verify scale animation end-to-end → tests
- US2: verify the reverse direction and interruption → tests
- US3: verify panning already animates (no new code) → implement label tweening → tests

### Parallel Opportunities

- T002 and T004 could be developed together if T004's reduced-motion check is folded into the
  hook from the start, rather than added after T002 is otherwise complete
- Once Foundational (T002–T004) is done, User Story 3's T009 (verification) and T010 (label
  tweening) can proceed in parallel with User Story 1/2's verification and test tasks, since they
  touch a different part of the same file's render output (labels vs. lines) and don't block each
  other logically — though all land in the same `Chart.tsx`/`Chart.test.tsx` files, so coordinate
  merges if worked on simultaneously by different people
- T012 (reduced-motion tests) can be written in parallel with T006/T008/T011 — different
  assertions, same test file

---

## Parallel Example: Foundational Phase

```bash
Task: "Build the progress -> {start, span} interpolation function and useChartTransition hook"
Task: "Wire Chart.tsx's x() calls to the hook's live-interpolated start/span"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — this is most of the real work)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `Chart.test.tsx`'s US1 cases and quickstart.md Scenario 1 manually
5. Demo: zooming out animates smoothly — MVP done

### Incremental Delivery

1. Complete Setup + Foundational → scale animation works for both triggers already
2. Add User Story 1 → validate independently → zoom-out animates (MVP!)
3. Add User Story 2 → validate independently → zoom-in animates and survives interruption
4. Add User Story 3 → validate independently → panning animates, labels glide instead of jumping
5. Polish: reduced-motion coverage for both triggers, full quickstart re-validation

### Parallel Team Strategy

With two contributors, once Foundational is done:

- Contributor A: User Story 1 → User Story 2 (same hook, verifying both directions)
- Contributor B: User Story 3 (label tweening — new code, but reads the same hook output)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature's real complexity is almost entirely in Foundational (the hook) and User Story 3
  (label tweening); User Stories 1 and 2 are thin verification layers over the same shared
  mechanism, which is called out explicitly rather than padded with duplicate "implementation"
  tasks that would just re-touch the same lines
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
