# Contract: Public Addresses

Base: `/nba-weekly-power-rankings` (Vite `base`, without the trailing slash). All addresses below are relative to the base.

| Address | Page | HTTP status | Entry file | Preview |
|---------|------|-------------|------------|---------|
| `/` | Redirects (client) to the latest season | 200 | `index.html` | Site-wide |
| `/<season>` e.g. `/2018-19` | Season chart | 200 | `<season>.html` | Season card |
| `/teamHistory/<team>` e.g. `/teamHistory/bos` | Team history | 200 | `teamHistory/<team>.html` | Team card |
| `/playerHistory/<id>` e.g. `/playerHistory/jamesle01` | Player history | 200 | `playerHistory/<id>.html` | Site-wide |
| Anything else under the base | App not-found handling or redirect to the latest season (as today) | 404 | `404.html` | Site-wide |

## Legacy addresses

| Old | New |
|-----|-----|
| `/#/<season>` | `/<season>` |
| `/#/teamHistory/<team>` | `/teamHistory/<team>` |
| `/#/playerHistory/<id>` | `/playerHistory/<id>` |
| `/#/<anything>` | `/<anything>` (then handled like any address) |

The rewrite replaces the current history entry and does not add a new one.

## Notes

- Team IDs are lower case. Upper-case variants (e.g. `/teamHistory/BOS`) have no entry file, so they go through `404.html`, and the app still renders the team (it lower-cases the ID, as today).
- Trailing-slash variants (e.g. `/2018-19/`) also go through `404.html` and render the same page. All in-app links use the no-slash form.
