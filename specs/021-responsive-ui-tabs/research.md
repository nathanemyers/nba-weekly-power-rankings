# Research: Responsive UI and Tabbed Detail Panel

No items in the Technical Context were left as NEEDS CLARIFICATION. The decisions below settle the design questions raised by the spec.

## 1. Breakpoints

- **Decision**: Use Tailwind's default breakpoints. Phone is below `sm` (640px), tablet is `sm` to below `lg` (640–1023px), and desktop is `lg` (1024px) and up.
- **Rationale**: They match the tiers in FR-002 exactly, and the codebase already uses `sm:` and `md:` prefixes. No theme changes needed.
- **Alternatives considered**: Custom breakpoints in `src/index.css`. Rejected because nothing in the spec needs non-standard values.

## 2. Making the rankings chart fit phones

- **Decision**: Give the chart two layouts. Desktop and tablet keep the current 960×600 viewBox and margins. Phones (below 640px) get a compact viewBox (about 400×560) with a narrow left margin. Team labels there are logo images instead of names, and the left-side medal glyphs are dropped (the right-hand Playoffs column still shows medals). A small `useMediaQuery` hook built on `useSyncExternalStore` and `window.matchMedia` picks the layout. When `matchMedia` is missing (jsdom, old browsers), the hook returns `false`, meaning the desktop layout.
- **Rationale**: The SVG already scales to its container with `w-full` and a viewBox. But at 375px the 960-unit viewBox shrinks everything to about 39%, so 13px labels render near 5px. A compact viewBox keeps text at roughly 1:1. The chart's geometry (margins, label x, text vs `<image>`) is computed in JavaScript, so CSS breakpoints alone cannot switch it. `useSyncExternalStore` subscribes without `useEffect`, as `AGENTS.md` asks.
- **Alternatives considered**:
  - Let the chart scroll sideways inside its own container. Rejected because only part of the season would be visible, which conflicts with SC-001's intent and the "whole chart visible" scenario.
  - Measure the container with `ResizeObserver`. Rejected because it needs `useEffect`/`useRef`, and a two-layout switch is simpler.
  - Use abbreviations (e.g., "BOS") as labels. Rejected because the user asked for logos on mobile, and logos are already bundled.

## 3. Touch interaction on the chart

- **Decision**: Keep tap-to-pin on lines and labels. Mobile browsers emit synthetic `mouseenter` on tap, so tapping a dot of a pinned team already shows its tooltip. Add `stopPropagation` to dot clicks so the tap does not bubble to the wrapper's "unpin" handler. The tooltip's maximum width is capped further on phones.
- **Rationale**: This is the smallest change that makes the existing hover interactions work by touch (FR-014).
- **Alternatives considered**: A separate tap-for-tooltip mode. Rejected as unnecessary.

## 4. Tabbed panel component

- **Decision**: Add shadcn/ui Tabs (`npx shadcn@latest add tabs`) and build a `DetailTabs` component that renders Summary, Trends, Roster, and Awards. The selected tab is held in component `useState` as the user's last choice. The tab actually shown is derived on each render: the user's choice if it is still available, otherwise the default (see contract).
- **Rationale**: `AGENTS.md` requires shadcn components over hand-rolled ones. Radix Tabs provide keyboard support and ARIA roles (FR-015). The constitution allows purely local UI state in components. Deriving the shown tab avoids a `useEffect` that resets state when pins change, and it naturally satisfies "keep the same tab if still available" (US2 scenario 5).
- **Alternatives considered**:
  - Store the tab in Redux. Rejected because no other component reads it.
  - Store it in the URL. Rejected per the spec assumption.

## 4a. Arrow keys: tabs vs chart panning

- **Decision**: In `useChartControls`, ignore key events with `e.defaultPrevented` set. Radix's roving-focus tab list calls `preventDefault` on the arrow keys it handles.
- **Rationale**: Without this, pressing ArrowRight in the tab list would both switch tabs and pan the chart. This keeps arrow-key panning everywhere else (FR-014).
- **Alternatives considered**: Checking `e.target.closest('[role=tablist]')`. It works, but it couples the hook to the panel's markup.

## 5. Tab availability without rendering the content

- **Decision**: Pull the "is there content" checks into pure functions next to their data:
  - `getAISummary(season, team)` already exists.
  - Risers/fallers come from `getMostImprovedTeams` / `getMostDeclinedTeams`.
  - Roster comes from `getTeamRankings(season, team)?.roster`.
  - Awards: move the group-building logic in `SeasonAwardsPane` into an exported function so `DetailTabs` can check for an empty result.
- **Rationale**: Hidden tabs must be decided before rendering (FR-007). The content components then render without checking whether they should exist.

## 6. Compact roster table

- **Decision**: Use CSS only, with no JavaScript breakpoint:
  - Add `compact?: true` to the PTS, REB, and AST entries in `STAT_COLUMNS`. Every other column's head and cell get `hidden sm:table-cell`.
  - The player cell renders the short name visible only on phones (`sm:hidden`, `aria-hidden`) and the full name as `sr-only sm:not-sr-only`, so assistive technology always hears the full name (FR-016). The link's `title` holds the full name as a tooltip.
  - The roster heading shows the team logo. The written team name is `sr-only sm:not-sr-only`.
- **Rationale**: Tailwind responsive classes keep this declarative and free of re-renders. `AGENTS.md` forbids building class names from variables, so the class strings are literal and only switched by a boolean.
- **Alternatives considered**: Switching on `useMediaQuery` in the roster. Rejected because CSS can do it.

## 7. Short player names

- **Decision**: Add a pure `shortPlayerName(name)` helper. It splits on the first space and returns `"<first initial>. <rest>"`, or the name unchanged if it has no space. Examples: "LeBron James" → "L. James", "Gary Trent Jr." → "G. Trent Jr.", "Karl-Anthony Towns" → "K. Towns". Covered by a unit test.
- **Rationale**: Matches the spec's edge-case rule and is easy to test.

## 8. Other pages and the shell

- **Decision**:
  - Reduce the shell's vertical padding on phones (`py-4 sm:py-8`) and keep the 16px side gutter.
  - Scale `h1` sizes (`text-2xl sm:text-4xl`) on the team and player history views.
  - Make `TeamHistory`'s season header wrap.
  - Rely on the shadcn `Table` container's existing `overflow-x-auto` for wide history tables.
  - Let `ChartControls`, the top control row, and badges wrap.
- **Rationale**: The scope is "all pages", and these are the overflow points found when reading the views.

## 9. Team History action

- **Decision**: Move `TeamHistoryButton` into the top control row, next to the filter and clear button, shown when a single team is pinned.
- **Rationale**: The `ButtonGroup` below the chart that held it goes away along with the hover-card buttons (FR-013).
