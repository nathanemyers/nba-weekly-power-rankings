# Contract: Player history route

Hash router, so every address below follows `#`.

| Address | Result |
|---|---|
| `#/playerHistory/curryst01` | Player history page for that ID |
| `#/playerHistory/zzzzzz99` (well-formed, not in data) | "Player not found" card with a "Back to the rankings chart" link |
| `#/playerHistory/Curry` or other malformed ID | Route error card: "Player not found" (404 `statusText`) |

## Route object (in `src/routes.tsx`, child of `/`, before `:season`)

- `id: 'playerHistory'`
- `path: 'playerHistory/:player'`
- `Component: PlayerHistoryView`, `ErrorBoundary: RouteError`
- `loader`: `{ playerId: string, history: Promise<PlayerStint[]> }` with `history` not awaited

## Navigation in

- Roster pane: player name `<Link to={'/playerHistory/' + player.id}>`.

## Navigation out

- History row click or Enter: `dispatch(setPinnedTeams([stint.team]))`, then `navigate('/' + stint.season)`.
- Browser back: router history, so no handling is needed.

## RouteError

- Maps `statusText === 'Player not found'` to the message "Player not found", alongside the existing "Team not found".
