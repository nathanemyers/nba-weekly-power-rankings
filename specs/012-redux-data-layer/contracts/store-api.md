# Contract: Store API Exposed to Components and Tests

Components and tests use only the exports below. They do not reach into slice internals. The state shape and transitions are described in [data-model.md](../data-model.md).

## Modules

| Module | Exports |
| --- | --- |
| `src/schemas/season.ts` | `SeasonDataSchema`, `WeekRankingSchema`, `type SeasonData`, `type WeekRanking` |
| `src/store/loadSeasons.ts` | `loadSeasons(order: string[], raw: Record<string, unknown>) → SeasonsState` |
| `src/store/index.ts` | `makeStore()`, `type RootState`, `type AppStore`, `type AppDispatch` |
| `src/store/hooks.ts` | `useAppSelector`, `useAppDispatch` |
| `src/store/navigation.ts` | `seasonSelected`, `selectSeason`, `selectSeasonOrder` |
| `src/store/seasons.ts` | `selectSeasonView`, `selectInvalidSeasons` |
| `src/store/chartView.ts` | `zoomToggled`, `pageWindow`, `selectZoomedOut`, `selectStartWeek`, `selectEndWeek`, `selectCanPageEarlier`, `selectCanPageLater`, `selectCanZoom` |
| `src/store/selection.ts` | `pinToggled`, `selectPinnedTeams`, `selectPinnedTeam` |
| `src/test/renderWithStore.tsx` | `renderWithStore(ui) → RenderResult & { store }` |

## Rules for consumers

- Selectors MUST return a primitive or a reference already held in state, never a new object or array. See research R4.
- `chartView/windowSet` is internal. Components page the chart through `pageWindow(delta)` only.
- Both `makeStore()` and `renderWithStore` build a fresh store on each call.

## Preserved UI contract

Every role, accessible name, and keyboard behavior listed in `specs/011-tailwind-shadcn-migration/contracts/ui-states.md` stays the same. The one addition: when no season passes validation, the page shows the text "No season data available".
