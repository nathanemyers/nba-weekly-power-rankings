# Research: Two-Column Team History Page

No `NEEDS CLARIFICATION` items remained in the Technical Context. Each section below records a design decision the plan depends on.

## 1. Desktop breakpoint and layout switch

- **Decision**: Desktop is `lg` (1024px) and up, matching feature 021. Below `lg` (phones and tablets) the page uses the expandable list. Pick the layout in JavaScript with the existing `useMediaQuery` hook, querying `(max-width: 1023.98px)` so that "true" means the narrow layout.
- **Rationale**: The two layouts have different DOM structure: desktop splits overview and detail into two separate lists, while the narrow layout nests each detail under its overview. Rendering both and hiding one with CSS would duplicate every storyline and badge in the accessibility tree and in tests. Phrasing the query as "narrow" means environments without `matchMedia` (jsdom, old browsers) get the desktop layout, the same fallback 021 chose for the chart, so existing tests keep their desktop expectations.
- **Alternatives considered**: CSS-only with both layouts in the DOM (rejected: duplicate content). A new breakpoint (rejected: the spec says to reuse the existing one). Treating tablets as desktop (rejected: at 640–1023px two columns leave the storyline column too narrow).

## 2. Two independently scrolling columns

- **Decision**: On desktop the view becomes viewport-height: `lg:h-[calc(100dvh-4rem)]` (the 4rem matches the `sm:py-8` padding of the root shell), laid out as a flex column. The header is `shrink-0`; below it a `grid` with `grid-cols-[auto_1fr]` and `min-h-0 flex-1`, where each column is `overflow-y-auto`.
- **Rationale**: Gives each column its own scroll, keeps the header fixed (spec assumption), and needs no change to `Root.tsx`. `dvh` avoids the mobile browser URL bar problem, though the layout only applies at `lg`.
- **Alternatives considered**: A sticky left column with page scroll for the right (rejected: the spec asks for two independently scrollable columns). Changing the root shell to a fixed height for all routes (rejected: affects the chart and player pages).

## 3. Scroll spy (right column drives the highlight)

- **Decision**: Use React `onScroll` on the right column. The handler reads the column's `scrollTop`, `clientHeight` and `scrollHeight` and every section's `offsetTop` (found by `data-season` attribute under `event.currentTarget`). The active season is the last section whose top is at or above `scrollTop + 1`, or the last season when the column is scrolled to its end (`scrollTop + clientHeight >= scrollHeight - 1`).
- **Rationale**: Runs only in an event handler, so there's no `useEffect` and no `useRef` (AGENTS.md). Fewer than 50 sections, so a linear scan per scroll event is negligible. It returns the exact season "at the top", which is what FR-009 asks for, without tuning IntersectionObserver thresholds.
- **Alternatives considered**: `IntersectionObserver` (rejected: needs `useEffect` to set up and observe, and its threshold-based callbacks don't directly answer "which section is at the top"). Throttling with `requestAnimationFrame` (rejected for now: premature).

## 4. Click-to-scroll without stepping through seasons (FR-008, FR-011)

- **Decision**: Clicking a left entry sets `active` to that season immediately and sets a `scrollTarget` state to it, then calls `column.scrollTo({ top: section.offsetTop - column.offsetTop, behavior })`. While `scrollTarget` is set, `onScroll` doesn't change `active`. React 19's `onScrollEnd` clears `scrollTarget` and leaves `active` as the clicked season. If the column is already at the target position (no scroll will happen), `scrollTarget` isn't set.
- **Rationale**: Prevents the highlight flickering through seasons in between during a smooth scroll. Keeping the clicked season when the scroll ends also covers seasons near the bottom that can't reach the top of the column (scenario 2.3): the user's choice wins until they scroll again. A second click while scrolling just replaces `scrollTarget` (edge case "latest click wins").
- **Alternatives considered**: A timeout to clear the suppression (rejected: guesses the scroll duration). Adding bottom padding so every section can reach the top (rejected: a large empty area at the end of the column; can be revisited).
- **Note**: `scrollend` is supported in current Chrome, Firefox and Safari 18+. If it doesn't fire, the next user scroll still works: `onScroll` first checks whether the target has been reached (active computes to `scrollTarget`) or the column is at its end, and clears `scrollTarget` if so.

## 5. Keeping the highlighted entry visible on the left (FR-010)

- **Decision**: Whenever `active` changes from the scroll spy, the same handler finds the left entry (by `data-season` under the left column's element, looked up by a `useId`-generated id) and adjusts the left column's `scrollTop` by the smallest amount that brings the entry fully into view. If it's already fully visible, nothing scrolls.
- **Rationale**: `element.scrollIntoView({ block: 'nearest' })` would also scroll ancestors, and the `container` option isn't widely supported yet. Computing the offset by hand touches only the left column. It runs in the event handler, so no effect is needed.
- **Alternatives considered**: `scrollIntoView` (rejected: ancestor scrolling). A `useEffect` on `active` (rejected: AGENTS.md asks to keep effects to a minimum, and the handler already knows when `active` changes).

## 6. Reduced motion (FR-012)

- **Decision**: `useMediaQuery('(prefers-reduced-motion: reduce)')` picks `behavior: 'auto'` instead of `'smooth'` for programmatic scrolls on both columns.
- **Rationale**: Reuses the existing hook. The test setup already returns `matches: false` and individual tests can override it.

## 7. Clickable entries that contain playoff badges

- **Decision**: Use the "stretched button" pattern. Each left entry (desktop) and each accordion header (narrow) is a `relative` container. The season name is the real `<button>` (or accordion trigger), with an `after:absolute after:inset-0` pseudo-element covering the whole entry so a click anywhere selects it. `PlayoffSeriesBadges` sits in a `relative z-10` wrapper so its own tooltip buttons stay on top and clickable.
- **Rationale**: `PlayoffSeriesBadges` renders `<button>` elements, and a button can't contain buttons. This keeps valid HTML, a single focus stop per entry, and the badges' tooltips.
- **Alternatives considered**: A `div` with `role="button"` (rejected: still nests interactive content). Making the badges non-interactive (rejected: you'd lose the series-result tooltips).

## 8. Expandable list on narrow screens

- **Decision**: Add the shadcn/ui Accordion (`npx shadcn@latest add accordion`) and use `type="multiple"`, all collapsed by default. The trigger is the season name, stretched over the header per §7. The content is the shared season detail component.
- **Rationale**: AGENTS.md asks for shadcn/ui components rather than hand-rolled ones. The Radix Accordion already handles `aria-expanded`, `aria-controls`, and Enter/Space (scenario 4.6). `radix-ui` is already a dependency, so no new runtime package.
- **Alternatives considered**: Collapsible per season (rejected: Accordion is the shadcn component for a list of these). A hand-rolled `details`/`summary` (rejected by AGENTS.md).

## 9. Top six players by minutes (FR-004)

- **Decision**: A pure function `getTopPlayersByMinutes(roster, count = 6)` in `src/data/seasonData.ts` returns `{ id, name, minutes }` with `minutes = Math.round(g * mpg)`, sorted by minutes descending and then by name with `localeCompare`, sliced to `count`. Missing roster → `[]`.
- **Rationale**: The roster schema stores `g` and `mpg` per player per team (traded players have one entry per team), so totals are derived from data already loaded, with no build-script or data change. Rounding avoids float noise in ties.
- **Alternatives considered**: Ranking by `mpg` (rejected in the spec's Assumptions). Adding total minutes to the processed JSON (rejected: means a data rebuild for a value that's trivial to derive).

## 10. Removing AI summaries

- **Decision**: Remove the `aiSummary` paragraph and the "AI-generated summary" badge from the team history page only. `TeamSeasonSummary.tsx`, `getAISummary`, the schema field and the data stay.
- **Rationale**: Matches the spec's scope. It also avoids touching `npm run build:summaries`, which AGENTS.md forbids running.

## 11. Link to the season chart (FR-015)

- **Decision**: Each season detail has a small "View season chart" `Button` (`variant="outline"`, `asChild` over a router `Link` to `/<season>`) whose `onClick` dispatches `setPinnedTeams([team])`, the same thing the old card click did.
- **Rationale**: Keeps the existing navigation available now that clicking a season scrolls instead. Placing it in the detail means it appears on both layouts without extra work.

## 12. Seasons without storylines

- **Decision**: When `getTeamStorylines` returns nothing, show a muted line. For a completed season it reads "No storylines for this season". For an in-progress season it reads "Storylines appear once the season is complete", because `getTeamStorylines` hides storylines until the season is complete.
- **Rationale**: Covers FR-017 and keeps the left and right columns one-to-one, without implying a current season has no storylines when they're just hidden until it ends.
