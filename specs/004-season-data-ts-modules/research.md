# Research: Season & Postseason Data as Plain JS/TS Modules

No `[NEEDS CLARIFICATION]` markers remain in the Technical Context — this is a refactor within the
project's existing stack (Vite + TypeScript + Node ESM scripts), and the two decisions below were
resolved by inspecting how the current pipeline reads/writes each file, rather than requiring new
research.

## Decision 1: How the browser gets season data without async loading

**Decision**: Replace the `import.meta.glob(..., { import: 'default' })` + `await loader()` pair
in `src/App.tsx` with a single generated barrel module, `src/data/seasons/index.ts`, that statically
`import`s every season module and exports a plain, already-populated `Record<string, SeasonData>`
(or equivalent array). `App.tsx` imports that barrel with an ordinary top-of-file `import`
statement — no `import.meta.glob`, no dynamic `import()`, no `useEffect`/`await`.

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

## Decision 2: How the Node build script consumes the postseason module without async loading

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
