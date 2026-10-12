# Research: Season & Postseason Data as Plain JS/TS Modules

No `[NEEDS CLARIFICATION]` markers remain in the Technical Context — this is a refactor within the
project's existing stack (Vite + TypeScript + Node ESM scripts), and the two decisions below were
resolved by inspecting how the current pipeline reads/writes each file, rather than requiring new
research.

**Amendment (2026-10-12)**: Decision 2 below was reversed after implementation and review — per
user feedback, the data-generation scripts no longer output `.js`/`.ts` source modules. They
output plain `.json` again; only Decision 1 (the generated static-import barrel) still stands,
now importing `.json` files instead of `.ts` modules. The amended Decision 2 replaces the
original below it; the original is kept for the record of what was tried and why it changed.

## Decision 1: How the browser gets season data without async loading

**Decision**: Replace the `import.meta.glob(..., { import: 'default' })` + `await loader()` pair
in `src/App.tsx` with a single generated barrel module, `src/data/seasons/index.ts`, that statically
`import`s every season's `.json` file and exports a plain, already-populated
`Record<string, SeasonData>` (each entry cast `as SeasonData` — see Decision 2, amended, for why).
`App.tsx` imports that barrel with an ordinary top-of-file `import` statement — no
`import.meta.glob`, no dynamic `import()`, no `useEffect`/`await`.

**Rationale**:
- ES module static imports are resolved and evaluated by the bundler before any application code
  runs, so the data is simply present on first render — this is what removes the loading state
  (FR-003, FR-004, SC-001) without hand-rolling a cache or state machine.
- A generated barrel keeps the "run the build step after scraping" workflow unchanged (FR-005,
  SC-003): the maintainer never edits an import list by hand when a season is added — the script
  that already deletes and rewrites `src/data/seasons/` regenerates the barrel alongside the
  per-season files in the same run.
- This keeps the dependency graph fully static and analyzable by `tsc -b`, satisfying the
  Simplicity principle (no new runtime dependency, no custom loader).

**Alternatives considered**:
- *Keep `import.meta.glob`, but with `{ eager: true }`.* Vite does support an eager form that
  inlines all matches at build time with no `await`. Rejected in favor of an explicit generated
  barrel: eager glob still depends on a bundler-specific API and a wildcard path convention, while
  a plain generated `index.ts` is just ordinary TypeScript any tool can follow, and reads the same
  whether you're in Vite, a test, or a future tool.
- *Hand-maintain the import list in `App.tsx`.* Rejected: it would add a manual step to the
  "scrape → regenerate data" workflow that doesn't exist today (FR-005 requires the workflow stay
  the same).

## Decision 2 (amended): Keep JSON storage; get static loading from `resolveJsonModule` instead

**Decision**: Both `src/data/seasons/<season>.json` and `data/playoffs.json` stay plain JSON,
written by `JSON.stringify` exactly as before this feature. `scripts/build-rankings.mjs` keeps
reading `data/playoffs.json` via `JSON.parse(readFileSync(...))` (already synchronous — it never
needed to change). The generated `src/data/seasons/index.ts` barrel (Decision 1) statically
`import`s each season's `.json` file directly; `tsconfig.app.json` gained
`"resolveJsonModule": true` so `tsc` accepts and types those imports, and Vite has supported
static JSON imports natively all along.

**Rationale**:
- Static `import` of a `.json` file is resolved at build time exactly like a `.ts`/`.js` module
  import — both satisfy FR-003 (no dynamic import, no runtime `fetch`) equally well. The
  loading-mechanism goal never required changing the storage format; that was an independent
  choice in the original implementation (see superseded Decision 2 below), and per direct user
  feedback it added a complexity nobody wanted: two generator scripts hand-assembling JS/TS
  source text (`` `export default ${JSON.stringify(...)} satisfies SeasonData;` ``) instead of
  just writing data.
- This is a net simplification relative to the original Decision 2: `scrape-playoffs.mjs` and
  `build-rankings.mjs` go back to the one job a data-generation script should do — serialize data
  — instead of also emitting source code.

**Trade-off accepted (regression from the original Decision 2)**: TypeScript widens JSON string
fields to plain `string` on import, so a season's imported object cannot be assigned directly to
`SeasonData` (whose `playoffs?: Record<string, PlayoffStage>` field is a string-literal union) —
every valid season would fail that assignment, not just malformed ones. The barrel therefore casts
each import with `as SeasonData` instead. Verified behavior of that cast:
- **Still caught**: a season entry missing a required field (e.g. no `maxWeek`) — TS reports
  "insufficient overlap" (TS2352) because the inferred JSON shape and `SeasonData` diverge enough.
- **No longer caught**: an invalid `PlayoffStage` string (e.g. `"relegated"`) — `as` allows the
  narrowing from `string` to the union silently, so this specific value-level error ships
  undetected. This is a partial regression of spec.md SC-004 / the US3 edge case ("malformed data
  caught before it ships"), accepted as the cost of not hand-generating source modules. If this
  gap matters later, a small runtime validator (e.g. checking each `playoffs` value against the
  `STAGE_ORDER` list already defined in `build-rankings.mjs`) would close it without reintroducing
  JS/TS-module output.

**Alternatives considered**:
- *Keep emitting `.ts`/`.js` from the generator scripts (the original Decision 2).* Rejected per
  direct user feedback after reviewing the implemented PR — disliked having scripts write
  stringified source code as their output format.
- *Loosen `PlayoffStage` to `string` project-wide so JSON imports type-check without a cast.*
  Rejected: that would remove literal-union safety from every other consumer of `PlayoffStage`
  (e.g. `Chart.tsx`'s stage-to-badge logic), not just the data-loading boundary — a much larger
  blast radius than the one field this trade-off actually concerns.

---

### Decision 2 (superseded — original, kept for the record)

**Decision**: Store postseason bracket results as `data/playoffs.js`, a plain ESM module
(`export default { ... }`), written by `scripts/scrape-playoffs.mjs`. `scripts/build-rankings.mjs`
consumes it via a static top-of-file `import PLAYOFFS from '../data/playoffs.js'` in place of the
current `JSON.parse(readFileSync(...))` call.

**Rationale**:
- Both scripts already run as plain Node ESM (`"type": "module"` in `package.json`, `.mjs`
  extension) — a static `import` of a sibling `.js` module needs no transpilation, type-stripping,
  or loader, and (like Decision 1) is resolved before the script body executes, so there is no
  `await`/async step added to either script.
- `.js`, not `.ts`, is used for `data/playoffs.js` specifically because `scripts/*.mjs` are run
  directly by `node` with no `tsc`/Vite build step in front of them; a `.ts` file would require a
  type-stripping-capable Node version or an extra loader, which is exactly the kind of added
  machinery this migration is trying to avoid. The per-season files under `src/data/seasons/`
  don't have this constraint because they are only ever consumed through the app's existing
  Vite/`tsc -b` build, so they can be `.ts` and get real type checking (spec edge case: malformed
  data caught at compile time).
- Keeps `data/playoffs.js` where the constitution expects raw/upstream inputs to live
  (`data/`, per Principle IV), unchanged from today's `data/playoffs.json` location — only the
  extension and export syntax change.

**Alternatives considered**:
- *Make `data/playoffs` a `.ts` file and have `build-rankings.mjs` dynamically `import()` it.*
  Rejected: this reintroduces an async step purely to read a file that today is read
  synchronously, which is the opposite of what the feature asks for, and it would require a
  TypeScript-aware loader just for one file.
- *Leave `data/playoffs.json` as JSON since the browser never loads it.* Rejected: the feature
  description explicitly names "postseason results" as in scope for the JSON → JS/TS migration,
  independent of whether the browser touches the file.
