# Quickstart: Validating Season & Postseason Data as Plain JS/TS Modules

Run these after implementation to confirm the migration (see `data-model.md` for the entities
involved and `research.md` for why each mechanism was chosen).

## Prerequisites

- Working tree includes the migrated `src/data/seasons/*.ts` files, the generated
  `src/data/seasons/index.ts` barrel, and `data/playoffs.js`.
- `npm install` has been run.

## 1. Data regeneration still works end-to-end

```bash
npm run build:rankings
```

**Expected**: the command regenerates every file in `src/data/seasons/` (now `.ts`) plus
`src/data/seasons/index.ts`, with the same per-season week/team counts it used to log for the
JSON output. No manual edits anywhere are required afterward for the app to pick up the new data.

## 2. Type checking catches malformed season data

```bash
npm run build
```

**Expected**: `tsc -b` passes. To confirm it would actually catch a problem (spec edge case),
temporarily introduce an invalid value in one season file (e.g. an out-of-range `PlayoffStage`
string) and re-run — the build MUST fail with a type error, then revert the change.

## 3. No async/loading state remains in the UI

```bash
npm run dev
```

- Open the app, confirm the most recent season's chart is present on first paint (no flash of a
  "Loading…" message).
- Switch seasons several times in the dropdown; confirm every switch renders immediately with no
  loading placeholder at any point (FR-004, SC-001).

## 4. Output parity with the pre-migration JSON

```bash
npm test
```

**Expected**: existing/added tests confirm every season's rankings and postseason markers render
identically to before the migration (SC-002). If no automated check already covers this, diff a
pre-migration JSON export against the migrated module's data for at least one season with
postseason data and one without.

## 5. Production build is self-contained

```bash
npm run build && npm run preview
```

**Expected**: the previewed `dist/` serves and behaves identically to `npm run dev`, with all
season data bundled (no network requests for season/postseason data), consistent with
Constitution Principle I/II.
