# Quickstart: Compact Trends Lists

## Automated checks

```bash
npm run lint
npm test
npm run build
```

Expected: all pass. New tests cover:

- `src/data/analysis.test.ts`: both helpers return 5 entries for a full season, ordered by change, with stable tie-break; a team with a single ranking does not throw.
- `src/components/RankSwings.test.tsx`: two labeled lists of 5 rows; row order; clicking a row pins that team and marks only that row pressed; signed change text.
- `src/components/DetailTabs.test.tsx`: Trends tab still available and still pins a team.

## Manual checks

Start the dev server (`npm run dev`) and open a completed season.

1. Open the **Trends** tab on a desktop-width window. See "Most improved" and "Most declined" side by side, 5 rows each, largest change on top. (FR-001, FR-002, FR-007, SC-001, SC-002)
2. Compare a row's logo to the logos in the **Storylines** tab: same size. (FR-005, SC-004)
3. Each row is one line: logo, name, small trend line, signed number in green/red. (FR-004, FR-006)
4. Hover a row: pointer cursor. Click it: chart highlights that team only; row shows selected. Click another row: selection moves. (FR-010, FR-011)
5. Resize to 375px wide (or use mobile emulation): improving list appears in full, then declining list below it; no horizontal scroll. (FR-008, SC-003)
6. Switch seasons: lists update to the new season.
