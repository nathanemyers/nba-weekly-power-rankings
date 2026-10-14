# Quickstart: Validating the Centralized Data Layer

## Prerequisites

```bash
npm install
```

Running this after implementation installs `@reduxjs/toolkit`, `react-redux` and `zod` ([research R1](research.md)).

## 1. Automated checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

Expected results:

- All three commands pass.
- `src/App.test.tsx` passes with only its render helper changed (SC-001).
- The new `src/store/*.test.ts` files cover these, without rendering any component (FR-012):
  - every transition in [data-model.md](data-model.md#actions-and-transitions);
  - every selector, including the case where a shorter season clamps the window.
- `src/store/loadSeasons.test.ts` rejects each of the following and still loads the valid seasons (SC-003):
  - a missing `maxWeek`
  - a string `rank`
  - an unknown team key
  - an unknown playoff stage

## 2. Real data passes validation

```bash
npm run dev
```

Open the app. The season picker lists all 9 seasons, 2025-26 through 2017-18 (SC-002). The browser console shows no validation errors.

## 3. Behavior walkthrough (User Story 1)

1. On load, the newest season is selected and the full season is shown. No team is pinned.
2. Click **Zoom in**, then press → several times. The window advances one week at a time and **Later** becomes disabled at the last week.
3. Click a team line. The team is pinned and, if it has one, its summary panel appears. Click the same team again to unpin it.
4. Pin a team, then switch seasons. The pin is cleared.
5. Zoom in to the end of a long season, then switch to a shorter one. The window stays inside the shorter season.

## 4. Static hosting check

```bash
npm run preview
```

The app loads under `/nba-weekly-power-rankings/`. The Network tab shows no runtime requests beyond same-origin assets (SC-006).
