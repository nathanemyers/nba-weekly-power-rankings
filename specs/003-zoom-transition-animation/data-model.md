# Data Model: Animated Zoom Transition

This feature introduces no persisted data and no changes to `SeasonData`, `WeekRanking`, `Team`,
or the `View Mode`/`Window Width Configuration` entities already defined by
`002-view-full-season`. The entity below is the new transient animation state, local to
`Chart.tsx` via the `useZoomTransition` hook (research.md §2).

## Zoom Transition

In-flight interpolation state driving one animated change between windowed and full-season
rendering.

| Field | Description | Validation |
|-------|-------------|------------|
| `fromStart`, `fromSpan` | The `start`/`span` values the chart was actually showing when this tween began (research.md §5: read from the *current*, possibly mid-flight, values — not necessarily a settled end state) | Always a valid `start`/`span` pair the chart has rendered |
| `toStart`, `toSpan` | The target `start`/`span` for the mode `zoomedOut` just changed to | Derived from `002-view-full-season`'s existing windowed/full-season parameters |
| `progress` | `0..1`, how far through the tween | `0` = exactly `from*`; `1` = exactly `to*` |
| `reducedMotion` | Whether `prefers-reduced-motion: reduce` was set when this tween started | When `true`, `progress` jumps straight to `1` instead of animating over time |

**State transitions**:

```text
idle (showing fromStart/fromSpan) --zoomedOut prop changes--> animating (progress 0 -> 1)
animating --prefers-reduced-motion--> idle at target (progress forced to 1 immediately)
animating --zoomedOut changes again before progress reaches 1-->
    animating toward the new target, `from*` reset to the current (not original) interpolated values
animating --progress reaches 1--> idle (showing toStart/toSpan, identical to the corresponding
    non-animated `002-view-full-season` render)
```

## Relationships

`002-view-full-season`'s `zoomedOut` (in `App.tsx`) ──changes──► triggers a new Zoom Transition in
`Chart.tsx` ──interpolates──► the same `start`/`span` inputs `002-view-full-season`'s x-scale
already consumes ──renders──► identical visual output to the non-animated target state once
`progress` reaches `1`.
