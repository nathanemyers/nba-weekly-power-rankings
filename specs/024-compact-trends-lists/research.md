# Research: Compact Trends Lists

## Logo size

- **Decision**: `size-5 object-contain` with `shrink-0`.
- **Rationale**: Inline list-row logos elsewhere use `size-5` (`StorylineList`, `PlayerHistoryTable`, `PlayoffSeriesBadges`). Roster rows use `size-4` and headings use `size-6`; `size-5` is the most common list-row size and the one SC-004 points at (storylines).
- **Alternatives considered**: `size-4` (roster cells; too small next to a name), `size-6` (heading size).

## Row control

- **Decision**: Keep the shadcn `Toggle` per row with `pressed` bound to "this is the single pinned team", restyled to `h-auto w-full justify-start gap-2 px-2 py-1.5 cursor-pointer`.
- **Rationale**: Preserves the existing accessible pressed state and hover/selected styling (`data-[state=on]:bg-muted`) without editing generated UI files. The accessible name still includes the logo alt ("Detroit Pistons logo"), so the existing DetailTabs pin test keeps working.
- **Alternatives considered**: `Button` with manual `aria-pressed` (duplicates what Toggle provides); table rows (heavier markup, harder to make clickable).

## List markup

- **Decision**: Each list is a `<section>` with an `<h3>` heading ("Most improved", "Most declined") and an `<ol>` of 5 `<li>` rows.
- **Rationale**: An ordered list conveys rank order to assistive tech; headings label each list.

## Layout

- **Decision**: Wrapper `grid gap-4 sm:grid-cols-2`; improving list first in DOM order.
- **Rationale**: Below `sm` the grid is one column, so improving stacks above declining (FR-008). At `sm` and above the two lists sit side by side, improving on the left (FR-007). The detail tabs span the full content width, so each half is wide enough for a full team name.
- **Alternatives considered**: `flex-col sm:flex-row` (equivalent; grid gives equal column widths for free).

## Team label

- **Decision**: Full team name (`getTeamName`) in a `min-w-0 flex-1 truncate` span.
- **Rationale**: With full-width columns the full name fits at all target widths, including 375px stacked. `truncate` guarantees the one-line, no-overflow rule if a column is ever narrow. Satisfies the spec's "shortens instead of wrapping or overflowing" edge case without maintaining two labels.
- **Alternatives considered**: Abbreviation below a breakpoint (extra markup for a case that does not occur at current layouts).

## Minimap size

- **Decision**: Render `TrendMinimap` at `width={64} height={20}` with `className="h-5 w-16"`.
- **Rationale**: Matches the row's logo height (20px) so the row stays one compact line; the minimap already supports custom width/height and uses non-scaling strokes.
- **Alternatives considered**: Keeping 96×40 default (doubles row height, defeats FR-006).

## Rank change display

- **Decision**: A right-aligned `tabular-nums` number formatted as `+N` / `−N` / `0`, colored `text-rank-up` (positive), `text-rank-down` (negative), or `text-rank-mid` (zero), with an `aria-label` such as "up 12 places".
- **Rationale**: Uses existing theme tokens; static class strings chosen by a ternary (no class names built from variables).

## Ranking helpers (exactly 5, deterministic ties)

- **Decision**: Change `getMostImprovedTeams` / `getMostDeclinedTeams` default `returnAmount` to 5 and break ties by team id so ordering is stable. Make the start rank fall back to `rankings[0]` when a team has only one ranking so the helper never throws.
- **Rationale**: FR-001/FR-009 require exactly 5 rows; with 30 teams sorted by delta, the top 5 and bottom 5 never overlap. The current comparator returns only 1/-1 and is not deterministic for ties. Teams with a single ranking get a delta of 0 instead of crashing.
- **Alternatives considered**: Filtering by direction (contradicts the "lock at 5" decision).

## Trends tab availability

- **Decision**: `trends: season.teams.length > 0`.
- **Rationale**: Lists are always 5 long when data exists; FR-012 / updated spec says the tab is available whenever the season has rankings data. Equivalent to the old check in practice but states the intent directly.
