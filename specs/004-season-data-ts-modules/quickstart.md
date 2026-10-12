# Quickstart: Validating Season & Postseason Data as Plain JS/TS Modules

Run these after implementation to confirm the migration (see `data-model.md` for the entities
involved and `research.md` for why each mechanism was chosen).

## Prerequisites

- Working tree includes `src/data/seasons/*.json` (unchanged format), the generated
  `src/data/seasons/index.ts` barrel, and `data/playoffs.json` (unchanged format).
- `npm install` has been run.

## 1. Data regeneration still works end-to-end

```bash
npm run build:rankings
```

**Expected**: the command regenerates every file in `src/data/seasons/` (still `.json`) plus
`src/data/seasons/index.ts`, with the same per-season week/team counts it used to log before this
feature. No manual edits anywhere are required afterward for the app to pick up the new data.

## 2. Type checking catches structurally malformed season data

```bash
npm run build
```

**Expected**: `tsc -b` passes. To confirm it would actually catch a problem, temporarily delete a
required field (e.g. `maxWeek`) from one season's `.json` file and re-run — the build MUST fail
with a type error, then revert the change. Note the amended trade-off (research.md Decision 2,
amended): this only catches structurally missing/wrong-shaped fields, not an invalid
`PlayoffStage` string value — that specific check was given up when the storage format reverted
to JSON.

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
