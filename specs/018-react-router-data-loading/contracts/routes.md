# Contract: Public URLs

Every address is `https://<host>/nba-weekly-power-rankings/#<route>`. The part after `#` is never
sent to the server.

| Route (after `#`) | View | Example | Behavior |
|-------------------|------|---------|----------|
| *(empty)* or `/` | — | `…/nba-weekly-power-rankings/` | Replaces the address with `#/<latest season>` (no extra history entry) |
| `/<season>` | Season chart | `#/2018-19` | Shows that season. An unknown season replaces the address with the latest season. |
| `/<season>/` | Season chart | `#/2018-19/` | Same as without the trailing slash |
| `/teamHistory/<team>` | Team history | `#/teamHistory/bos` | `<team>` is a team code, matched case-insensitively (`BOS` works). Unknown → "Team not found" with a link to the chart. |
| anything else | — | `#/foo/bar` | "Page not found" with a link to the chart (router 404 → `RouteError`) |

## Stability

- These addresses are the shareable contract. Changing them later needs a redirect route that
  keeps old links working.
- Links made before this feature (the bare base address) keep working through the empty route.
- Chart interaction state (pinned teams, zoom window) is **not** part of the URL in this feature.

## Navigation events

| Trigger | Resulting address | History |
|---------|-------------------|---------|
| Season picker | `#/<season>` | push |
| Team History button | `#/teamHistory/<pinned team>` | push |
| Team history season card | `#/<season>` | push |
| Default or unknown-season redirect | `#/<latest>` | replace |
