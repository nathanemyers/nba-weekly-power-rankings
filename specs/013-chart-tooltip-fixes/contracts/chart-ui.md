# Contract: Chart Layering and Tooltip Placement

These are the observable DOM properties that the tests assert. Decisions R1–R3 are explained in [research.md](../research.md).

## Layering (FR-001 – FR-004)

| Condition | Observable |
| --- | --- |
| A team is pinned | Its `<g>` (line, hit path, dots) is the **last** team group inside the clipped plot group (`g[clip-path="url(#plot-clip)"]`). |
| Nothing is pinned | Team groups appear in `Teams` order, as today. |
| The pin changes | The order updates on the next render. Unpinned teams keep their relative order. |

## Tooltip placement (FR-005 – FR-007)

| Condition | Observable |
| --- | --- |
| Node x ≤ 50% of the chart width | Inline `left` is set and `right` is not. `transform` is `translate(14px, -50%)`. |
| Node x > 50% of the chart width | Inline `right` is set to `(1 − x/width) × 100%` and `left` is not. `transform` is `translate(-14px, -50%)`. |
| Any tooltip | Has the classes `w-max` and `max-w-[min(20rem,calc(50%-14px))]`, replacing `max-w-80`. |
| Any tooltip | The content is unchanged: `#rank Team (record)`, the summary, and `Week N`. |

## Preserved

Every existing role, attribute and test hook in [Chart.test.tsx](../../../src/components/Chart/Chart.test.tsx) stays the same. That includes line `stroke`, `stroke-width` and `opacity`, transparent hit paths, dot `fill`, label `font-weight` and `data-state`, and click reporting.
