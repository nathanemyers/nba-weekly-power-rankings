# Contract: Generated `data/processed/seasons/index.ts`

Written only by `scripts/build-rankings.mjs` and imported by the app as `data/seasons`. It replaces
today's `seasonData` and `seasons` exports.

```ts
// Newest first; typed unknown because the app validates it with SeasonIndexSchema
export const seasonIndex: unknown = [
  { "name": "2025-26", "source": "nba" },
  { "name": "2024-25", "source": "nba", "champion": "okc" },
  // …
];

// One lazily imported chunk per season; the module's default export is the raw season JSON
export const seasonLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  "2025-26": () => import("./2025-26.json"),
  // …
};
```

## Rules

- `seasonIndex` and `seasonLoaders` list the same season names, in the same order.
- `champion` is the bracket champion's team slug, written only when a bracket exists for the
  season. `source` matches the value written into that season's JSON.
- The index carries no other per-season data. Anything needed before a season loads must be added
  here on purpose, because it ships in the main bundle.
- Test mocks of `data/seasons` (`vi.mock('data/seasons', …)`) MUST export both names with these
  shapes.
