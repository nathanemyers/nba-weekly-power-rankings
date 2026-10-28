# Quickstart: Player History Page

## Automated

```bash
npm run lint && npm run build && npm test
```

Expected tests (Vitest, `renderWithRouter`):

- `getPlayerHistory`: Curry starts in 2009-10 with GSW, and 2015-16 PTS is 30.1. `pargoja01` 2003-04 orders lal → tor → chi. An unknown ID returns `[]`.
- Roster pane: clicking "Stephen Curry" in 2015-16 GSW opens `/playerHistory/curryst01`. Clicking a move badge still pins the other team and stays on the chart.
- History page: the stat cells' `data-rating` matches the roster pane for the same season and team. Clicking the 2017-18 row navigates to `/2017-18` with `[gsw]` pinned. Enter on a focused row does the same.
- `/playerHistory/zzzzzz99` and `/playerHistory/Curry` both show "Player not found".

## Manual (constitution: routing change, non-root base path)

```bash
npm run build
```

```bash
npm run preview
```

1. Open the preview under its base path, select 2015-16, and pin Golden State.
2. Click Stephen Curry. The address ends `#/playerHistory/curryst01`, and the rows start at 2009-10 and are all Golden State.
3. Reload the page. The same history shows (deep link).
4. Click the 2017-18 row. The chart opens on 2017-18 with only Golden State selected and its roster below.
5. Press browser back. You're on Curry's history again.
6. Narrow the window to phone width. The table scrolls sideways, and Season and Team stay visible.
