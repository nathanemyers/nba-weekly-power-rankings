# Research: Player History Page

## R1. Where player history comes from

- **Decision**: Build it in the browser from the season files the site already ships, using `loadAllSeasons()` and a pure function `getPlayerHistory(seasons, playerId)` in `src/data/playerHistory.ts`.
- **Rationale**: Every season file already carries `rosters[team][]` with a stable Basketball-Reference `id`. All 2,370 IDs in `data/processed/seasons` match `^[a-z]+\d{2}$`, and the same person keeps one ID across seasons (Curry is `curryst01` from 2009-10 on). The team history page already loads all seasons this way, and `loadSeason` caches each one for the visit.
- **Alternatives considered**: A build-time `players.json` index. It would make a not-found check instant, but it adds a build step and duplicates roster data. That breaks the one-place-for-data rule and isn't needed for 23 seasons.

## R2. Route and loader

- **Decision**: Add the child route `playerHistory/:player` with `id: 'playerHistory'`, next to `teamHistory/:team`. The loader parses `params.player` with `z.string().regex(/^[a-z]+\d{2}$/)` and throws `data(null, { status: 404, statusText: 'Player not found' })` on failure. Otherwise it returns `{ playerId, history: Promise<PlayerStint[]> }` without awaiting.
- **Rationale**: This matches `teamHistoryLoader`: Zod parsing of a URL parameter (constitution, Data Validation) and an unawaited promise read with `use()` under `Suspense` (AGENTS.md). The app already uses a hash router, so deep links work under a sub-path (Principle III).
- **Alternatives considered**: Awaiting `loadAllSeasons()` in the loader so an unknown ID could 404 there. Navigation would freeze on the old page with no loading state, so this was rejected.

## R3. Well-formed but unknown player ID

- **Decision**: When the resolved history is empty, the view renders the same card the 404 route error renders. To do that, extract the card's markup from `RouteError` into a small `NotFoundCard({ message })` component, and use it in both places.
- **Rationale**: The ID can only be confirmed after the seasons load, which happens inside `Suspense`, not in the loader. Throwing from render would reach the error boundary as a plain `Error`, not a route error response, and would be logged as a load failure. Sharing the card keeps the look identical (FR-012).
- **Alternatives considered**: Throwing `UNSAFE_ErrorResponseImpl` from render. It relies on an unstable API, so this was rejected.

## R4. Order of rows within a season

- **Decision**: Within a season, start at the stint with no `joinedFrom` and follow `leftFor` to the next team. Then reverse it, so the latest team comes first. Seasons go most recent first, the same as `seasonIndex` order.
- **Rationale**: `scripts/lib/rosters.mjs` sets `joinedFrom`/`leftFor` from the player's stint order. There are 99 three-team seasons in the data (for example `pargoja01` in 2003-04: lal → tor → chi), and the chain orders all of them correctly.
- **Alternatives considered**: Sorting by team name. That hides the order of the trade, so this was rejected.

## R5. Sharing the table with the roster pane

- **Decision**: Move `STAT_COLUMNS`, the rating class lookups, `RatingKey` and a new `StatCells({ player })` component out of `RosterPane.tsx` into `src/components/statColumns.tsx`. Both tables use them.
- **Rationale**: FR-005/FR-007 and SC-003 require identical columns, colors and gray. One source makes drift impossible.
- **Alternatives considered**: A single generic table component with column props. That is more abstraction than two call sites need.

## R6. Making the player name and history rows clickable

- **Decision**: In the roster pane, the player's name becomes a React Router `<Link to={'/playerHistory/' + id}>` with `cursor-pointer` and a hover underline, and the move badges stay separate buttons beside it. In the history table, each `TableRow` gets `onClick`, `tabIndex={0}`, an Enter `onKeyDown`, `cursor-pointer` and `hover:bg-muted`. The handler dispatches `setPinnedTeams([team])` and then navigates to `'/' + season`.
- **Rationale**: A link gives real link semantics: opening it in a new tab and a correct screen reader role. The badges are siblings, not children, so FR-003 holds without stopping event propagation. The row handler copies `TeamHistory.tsx`. Pinned teams stay in Redux, which the constitution keeps as the home for interaction state.
- **Alternatives considered**: Putting the pinned team in a URL query parameter. That would change how the chart reads selection everywhere and is out of scope.

## R7. Sticky columns on narrow screens

- **Decision**: Season and Team cells are `sticky` with `bg-background`. Team is offset by Season's fixed width (`left-0` and `left-20`), the same approach as the roster pane's sticky Player cell.
- **Rationale**: This meets the spec's narrow-screen edge case with utility classes only.
