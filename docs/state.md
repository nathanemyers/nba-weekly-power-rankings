# State & Data

Shared application state lives in a Redux Toolkit store under `src/store/`, split into slices: `seasons` (validated season data), `navigation` (selected season and future routing/UI state), `chartView` (zoom and week window), and `selection` (pinned teams).
Season data is validated with the Zod schemas in `src/schemas/` before it enters the store, and the `SeasonData`/`WeekRanking` types are inferred from those schemas.
Selectors must return a primitive or a reference already held in state, never a new object or array, so components re-render only when something changed.
Transient, single-component state such as chart hover or animation progress stays in the component.
