# Data Model: Animated Chart Transitions (Zoom and Pan)

This feature introduces no persisted data and no changes to `SeasonData`, `WeekRanking`, `Team`,
or the `View Mode`/`Window Width Configuration` entities already defined by
`002-view-full-season`. The entities below are the new transient animation state, local to
`Chart.tsx` via the `useChartTransition` hook (research.md §2).

## Chart Transition

In-flight interpolation state driving one animated change to the visible week window — triggered
by either the zoom toggle or a pan (Earlier/Later, arrow keys). Renamed from "Zoom Transition" in
this feature's original, narrower draft; the shape is unchanged, only the set of triggers that
create one has grown (research.md §1).

| Field | Description | Validation |
|-------|-------------|------------|
| `fromStart`, `fromSpan` | The `start`/`span` values the chart was actually showing when this tween began (research.md §5: read from the *current*, possibly mid-flight, values — not necessarily a settled end state) | Always a valid `start`/`span` pair the chart has rendered |
| `toStart`, `toSpan` | The target `start`/`span` computed from the current `zoomedOut`/`start`/`windowWeeks`/`maxWeek` props (research.md §1) | Derived from `002-view-full-season`'s existing windowed/full-season parameters |
| `progress` | `0..1`, how far through the tween | `0` = exactly `from*`; `1` = exactly `to*` |
| `reducedMotion` | Whether `prefers-reduced-motion: reduce` was set when this tween started | When `true`, `progress` jumps straight to `1` instead of animating over time |

**State transitions**:

```text
idle (showing fromStart/fromSpan) --target (start,span) pair changes--> animating (progress 0 -> 1)
    [the target changes from either zoomedOut flipping or start being paged — same transition]
animating --prefers-reduced-motion--> idle at target (progress forced to 1 immediately)
animating --target changes again before progress reaches 1-->
    animating toward the new target, `from*` reset to the current (not original) interpolated values
animating --progress reaches 1--> idle (showing toStart/toSpan, identical to the corresponding
    non-animated `002-view-full-season` render)
```

## Team Label Position (per team, per transition)

Derived, not stored as its own hook state — `Chart.tsx` computes this each render from the Chart
Transition's fields above plus the current `teams` data (research.md §8).

| Field | Description | Validation |
|-------|-------------|------------|
| `fromY` | `y(rank)` of the team's first ranked week within the *pre-transition* window (`fromStart`/`fromSpan`) | Computed once when a transition starts; frozen for that transition's duration |
| `toY` | `y(rank)` of the team's first ranked week within the *target* window (`toStart`/`toSpan`) | Computed once when a transition starts; equals the label's eventual non-animated position |
| rendered Y | `lerp(fromY, toY, easedProgress)` | Equals `toY` once `progress` reaches `1`, matching the non-animated end state (same guarantee as the scale, FR-004) |

A team whose first-visible-ranked-week doesn't change across the transition has `fromY === toY`,
so it renders at a constant position throughout — no special-casing needed for that case.

## Relationships

`002-view-full-season`'s `zoomedOut` and `start` (both read in `Chart.tsx`) ──combine into──► a
target `(start, span)` pair ──changes of which trigger──► a new Chart Transition
──interpolates──► the same `x()`/`y()` inputs `002-view-full-season`'s scale already consumes,
**and** (via its `fromStart`/`fromSpan`/`toStart`/`toSpan`/`progress` fields) each visible team's
label `fromY`/`toY` ──renders──► identical visual output to the non-animated target state once
`progress` reaches `1`, for both the plotted lines and the labels.
