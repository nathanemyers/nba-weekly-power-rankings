# Contract: App.tsx ↔ Chart.tsx View-Mode Interface

This project has no network API; its only "external" interface is the prop boundary between
`App.tsx` (owns cross-season state) and `RankingsChart` in `src/Chart/Chart.tsx` (renders one
season). This feature changes that boundary as follows.

## `RankingsChart` props (addition)

| Prop | Type | Required | Contract |
|------|------|----------|----------|
| `teams` | `TeamRankings[]` | yes (existing) | Unchanged |
| `maxWeek` | `number` | yes (existing) | Unchanged; also used to derive `canZoomOut` |
| `zoomedOut` | `boolean` | yes (new) | Owned by `App.tsx`; `Chart.tsx` does not keep its own copy of this flag |
| `onToggleZoom` | `() => void` | yes (new) | Called when the visitor activates the zoom control; `App.tsx` flips `zoomedOut` in response |
| `windowWeeks` | `number` | no (new) | Defaults to `DEFAULT_WINDOW_WEEKS` (10) if omitted |

## Guarantees

- `Chart.tsx` MUST treat `zoomedOut` as the single source of truth for which mode is active; it
  MUST NOT maintain a second, internal "is zoomed" flag that could drift from the prop.
- `Chart.tsx` MUST derive `canZoomOut` (`maxWeek > windowWeeks`) itself from its own props on
  every render, and MUST NOT render the zoom control when `canZoomOut` is `false` — regardless of
  the incoming `zoomedOut` value (an already-`true` `zoomedOut` from a previous, longer season is
  harmless and left as-is; see data-model.md).
- `App.tsx` MUST NOT reset `zoomedOut` when the selected season changes (US3/FR-010). It MAY
  reset other per-season UI state (e.g. `loaded`) as it does today.
- Calling `onToggleZoom` MUST be the only way `zoomedOut` changes; `Chart.tsx` never mutates it
  directly.

## Non-goals

- No URL/hash/query-param encoding of `zoomedOut` — out of scope per spec Assumptions
  (session-only state, no persistence).
- No multi-level zoom (e.g., 2x, 4x) — the contract is a two-state boolean, not a numeric zoom
  level, per spec Assumptions.
