# Feature Specification: Animated Chart Transitions (Zoom and Pan)

**Feature Branch**: `003-zoom-transition-animation`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "the transition between zoomed in and zoomed out should animate to
give the user a sense of where they were"

**Depends on**: `002-view-full-season` (the windowed/full-season zoom toggle, and the
Earlier/Later paging and arrow-key panning this feature animates, must already exist). This spec
only concerns the motion of those existing transitions, not the toggle or paging controls
themselves.

**Amendment**: Scope extended to also animate panning (Earlier/Later and arrow-key navigation)
within the windowed view, including the team-name labels whose vertical position shifts as a
result — not just the zoom in/out toggle the feature originally covered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zooming out feels continuous, not a jump cut (Priority: P1)

A visitor looking at a specific stretch of weeks in the windowed view activates the zoom-out
control. Instead of the chart instantly replacing itself with the full season, the visible window
smoothly expands into the full season, so the visitor can see how the part they were just looking
at relates to the whole.

**Why this priority**: This is the entire value of the feature — the motion itself is the
deliverable. Without it, zooming out already works (per `002-view-full-season`) but feels
disorienting, which is the exact problem being fixed.

**Independent Test**: From the windowed view showing a specific range of weeks, activate the
zoom-out control and confirm the chart visibly animates from that range out to the full season,
rather than updating in a single frame.

**Acceptance Scenarios**:

1. **Given** the windowed view is showing some range of weeks, **When** the visitor activates
   zoom-out, **Then** the chart animates smoothly from that range to showing every recorded week,
   rather than redrawing instantly.
2. **Given** the zoom-out animation is playing, **When** the visitor watches any one team's line,
   **Then** that line moves continuously during the animation rather than disappearing and
   reappearing in a new position.
3. **Given** the zoom-out animation has finished, **When** the visitor examines the chart,
   **Then** it matches exactly what the full-season view looks like without any animation (the
   motion is a transition, not a different end state).

---

### User Story 2 - Zooming back in returns you the same way (Priority: P2)

Having zoomed out, a visitor activates the zoom-in control. The chart smoothly animates back down
to the windowed view, giving the same sense of continuity in reverse.

**Why this priority**: Completes the experience from User Story 1; without it, zooming out would
feel smooth but zooming in would still feel like a jump cut, which is an inconsistent and
incomplete fix.

**Independent Test**: From the full-season view, activate the zoom-in control and confirm the
chart visibly animates back down to the windowed view rather than updating in a single frame.

**Acceptance Scenarios**:

1. **Given** the full-season view is showing, **When** the visitor activates zoom-in, **Then**
   the chart animates smoothly from the full season down to the windowed view, rather than
   redrawing instantly.
2. **Given** the zoom-in animation has finished, **When** the visitor examines the chart,
   **Then** it matches exactly what the windowed view looks like without any animation.

---

### User Story 3 - Panning animates like zooming does (Priority: P3)

A visitor in the windowed (zoomed-in) view clicks Earlier or Later, or presses an arrow key, to
page to an adjacent range of weeks. Instead of the lines and team-name labels snapping instantly
to the new window, the chart slides smoothly to the new range, and any label whose vertical
position changes — because the rank used for its new first-visible-week differs from its old
one — animates to its new position in step with the slide, rather than jumping.

**Why this priority**: Builds on the same animation mechanism as the zoom transition (Stories 1
and 2) to remove the one remaining instant snap left in the chart. Lower priority than the zoom
animation because paging already works correctly today, just without motion — this is a
polish extension, not a new capability.

**Independent Test**: From the windowed view, click Later (or press the Right arrow key) and
confirm the chart visibly slides to the new week range rather than updating in a single frame,
with any repositioned team-name label moving smoothly rather than jumping.

**Acceptance Scenarios**:

1. **Given** the windowed view is showing some range of weeks, **When** the visitor clicks
   Earlier or Later, or presses the matching arrow key, **Then** the chart animates sliding from
   the old range to the new one, rather than redrawing instantly.
2. **Given** a pan animation is playing, **When** the visitor watches a team-name label whose
   rank at its new first-visible-week differs from its old one, **Then** that label animates
   smoothly to its new vertical position rather than jumping there instantly.
3. **Given** the pan animation has finished, **When** the visitor examines the chart, **Then**
   it matches exactly what the windowed view looks like at the new position without any
   animation.

---

### Edge Cases

- A visitor has motion-reduction turned on at the OS/browser level: the transition MUST be
  skipped or reduced to a near-instant change instead of forcing animation on someone who has
  asked to avoid it.
- A visitor triggers the opposite toggle again while a transition is still playing (e.g., clicks
  zoom-in while the zoom-out animation hasn't finished): the system MUST respond smoothly by
  reversing or continuing from wherever the animation currently is, rather than freezing,
  glitching, or ignoring the new input.
- A visitor switches the selected season: this is unrelated to the zoom animation (switching
  seasons already reloads the chart with new data per `002-view-full-season`) and MUST NOT
  trigger a zoom transition animation of its own.
- A visitor had a tooltip open when the transition starts: per `002-view-full-season`'s existing
  requirement, the tooltip still closes rather than tracking a data point that is now moving.
- A visitor pages again (clicks Earlier/Later or presses an arrow key) while a pan animation is
  still playing: the system MUST respond smoothly by retargeting from the current in-progress
  position, the same way the zoom toggle handles being triggered again mid-animation.
- A visitor pages at a boundary (already at week 1, or already at the last page): the
  Earlier/Later buttons are disabled and arrow keys are a no-op at that boundary per
  `002-view-full-season`, so no pan animation starts — there is nothing to animate toward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST animate the transition whenever a visitor toggles between the
  windowed view and the full-season view, in either direction, instead of updating instantly.
- **FR-002**: The animation MUST visually connect the previous view to the new one — team lines
  and week positions MUST move/scale continuously between the two, not cross-fade or swap between
  unrelated static images — so the visitor retains a sense of which part of the season they were
  looking at.
- **FR-003**: The animation MUST complete within a short, bounded duration so it never feels
  sluggish or meaningfully delays using the chart afterward.
- **FR-004**: The chart's rendered state once a transition finishes MUST be identical to the
  corresponding non-animated end state already defined by `002-view-full-season` — the animation
  changes how the visitor gets there, not where they end up.
- **FR-005**: The system MUST honor the visitor's OS/browser-level reduced-motion preference by
  skipping or substantially shortening the transition when that preference is set.
- **FR-006**: If the visitor triggers the zoom toggle again before the current transition
  finishes, the system MUST handle it smoothly (continuing or reversing from the current
  in-progress state) rather than stacking up animations, freezing, or dropping the new input.
- **FR-007**: The system MUST animate panning (via the Earlier/Later buttons or arrow-key
  panning) while in windowed view, sliding the visible week range from its previous position to
  its new one rather than updating instantly.
- **FR-008**: Any team-name label whose vertical position changes as a result of a pan (because
  the rank used for its first-visible-week changed) MUST animate smoothly to its new position in
  sync with the horizontal pan, rather than jumping there immediately.
- **FR-009**: The pan animation MUST honor the same reduced-motion preference (FR-005) and the
  same short, bounded duration (FR-003) as the zoom animation.
- **FR-010**: If the visitor pans again before the current pan animation finishes, the system
  MUST retarget smoothly from the current in-progress position, the same way FR-006 requires for
  the zoom toggle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a recording of either zoom direction, at least one team's line can be visually
  traced in continuous motion across the transition, with no single-frame jump from one layout to
  the other.
- **SC-002**: The zoom transition completes in under 1 second under typical conditions, so it
  reads as responsive rather than slow.
- **SC-003**: 100% of visitors with a reduced-motion preference enabled see an effectively
  instant mode change, with no forced animation.
- **SC-004**: The chart's end state after any transition is indistinguishable from the
  corresponding target view reached without animation (same week range, same rank positions, same
  visible teams).
- **SC-005**: In a recording of a pan, both the plotted lines and any team-name label that
  changes rank can be visually traced in continuous motion, with no single-frame jump.
- **SC-006**: A pan animation completes in under 1 second under typical conditions, the same
  responsiveness bar as the zoom transition (SC-002).

## Assumptions

- A target transition duration in the low hundreds of milliseconds (fast enough to feel
  responsive, slow enough to be perceptible) satisfies SC-002; the exact figure is left to
  implementation as long as it stays under the 1-second ceiling.
- Reduced-motion handling follows the standard OS/browser-level signal visitors already use for
  this across other sites and apps — this project has no in-app settings surface today, and
  introducing one is out of scope for this feature.
- No new data, persisted state, or playback controls (e.g., pause/replay) are introduced; this is
  purely a visual transition layered on top of the existing zoom toggle from
  `002-view-full-season`.
- Keyboard panning and paging controls remain disabled during full-season view, and enabled in
  windowed view, exactly as `002-view-full-season` already specifies; this feature does not
  change *when* those controls are active, only adds motion to the chart (and, per User Story 3,
  to paging itself) when they're used.
- Panning's animation reuses the same mechanism and constraints as the zoom animation (duration,
  reduced-motion handling, interruptibility) rather than introducing a second, differently-tuned
  motion system — the two should feel like the same chart, not two different ones.
