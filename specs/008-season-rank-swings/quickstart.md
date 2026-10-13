# Quickstart: Validate Season Rank Swings Pane

Prerequisites: `npm ci`. No data scripts need to run.

## 1. Gates

```bash
npm run lint && npm run build && npm test
```

Expected: all pass, including the swing selection unit tests, the minimap tests and the pane tests in `App.test.tsx`.

## 2. In the app

```bash
npm run dev
```

Every stored season is complete, so the incomplete-season case (FR-002) is covered by tests only.

- **2017-18** (US1): the pane under the chart lists risers Indiana 26 → 9, Philadelphia 20 → 5, Utah 12 → 4 and fallers Memphis 16 → 29, Washington 7 → 17, San Antonio 3 → 12. Each card's minimap matches the shape of that team's line in the chart after "Zoom out", and is green in ranks 1–10, yellow in 11–20 and red in 21–30. Memphis's starts yellow, climbs into green by week 2 (it reaches rank 1 in week 3), then drops through yellow into red from week 7 and stays there. Indiana's starts red and ends green.
- **2023-24** (FR-009): four fallers, because Memphis, Cleveland and the Lakers tie at 10 places behind Golden State's 11, and four risers, because Minnesota and Orlando tie at 10.
- **2019-20** (FR-008): Golden State shows 9 → 29 even though its last recorded week is 21, not 24; its minimap line stops short of the right edge.
- **Click** (US2): click Indiana in 2017-18. Its line is highlighted in the chart, the card looks pressed, and its AI summary appears below the pane. Click Memphis: the highlight and summary move to Memphis. Click Memphis again: the highlight clears.
- **Season switch** (US3): pin a team from the pane, then choose another season. No team is highlighted and the pane lists the new season's teams.

See [contracts/rank-swings-ui.md](./contracts/rank-swings-ui.md) for names and labels, and [data-model.md](./data-model.md) for the selection rules.
