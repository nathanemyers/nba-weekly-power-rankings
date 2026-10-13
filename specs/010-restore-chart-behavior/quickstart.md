# Quickstart: Validate the restored chart

```bash
npm run lint && npm run build && npm test
npm run dev
```

In the browser:

1. Default view reads "Weeks 1–11" with ticks 1 through 11; labels match week-1 ranks.
2. Right arrow / "Later" slides the chart one week; "Earlier" is disabled at week 1.
3. "Zoom out" animates to the full season, shows the right-hand Playoffs medal column, disables paging; arrow keys do nothing. "Zoom in" returns to the same window.
4. Hover a line: it thickens, dots appear, others dim. Hover a dot: tooltip with rank, full team name, record, summary, week.
5. Click a team: it stays highlighted. Click it again, or the background: unpinned.
6. Page to the end of 2017-18 (26 weeks), switch to 2020-21 (21 weeks): readout shows "Weeks 11–21".
7. Every completed season shows 16 medals beside team names.
