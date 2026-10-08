# Implementation Plan: View Full Season (Zoom Out)

**Branch**: `002-view-full-season` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-view-full-season/spec.md`

## Summary

Add a zoom-out toggle to the existing weekly rankings chart that swaps the current sliding
N-week window for a full-season view showing every recorded week at once. The window width
becomes a single configurable value (default 10) shared by both the sliding-window logic and the
new control's visibility check, so the zoom-out control is hidden whenever a season's recorded
weeks don't exceed it — the normal case early in a future in-progress season. View-mode state is
lifted out of `Chart.tsx` into `App.tsx` so it survives the chart's per-season remount
(`key={season}`), satisfying the requirement that zoom state carries across season switches.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19 (unchanged from the existing app)

**Primary Dependencies**: React 19, styled-components 6 — no new runtime (shipped-bundle)
dependencies. New *dev*-only dependencies: `vitest`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` (test DOM environment)

**Storage**: N/A at runtime; reuses the existing committed season JSON's `maxWeek` field, no
data shape changes

**Testing**: Vitest — now the constitution's required test runner (v1.1.0, Development Workflow
& Quality Gates), introduced by this feature since no test framework existed before it. Paired
with `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` for
component-interaction tests; run via `npm test`, alongside `npm run lint` and `npm run build`.
Manual validation via `npm run dev`/`npm run preview` per quickstart.md supplements, not
replaces, the automated suite

**Target Platform**: Modern desktop and mobile browsers, served statically via GitHub Pages
(unchanged)

**Project Type**: Single-page static web application (unchanged)

**Performance Goals**: Render all ~30 teams across up to 26 weeks in the same SVG viewBox with
no perceptible lag — well within React/SVG capability at this data scale; no new perf targets

**Constraints**: Must stay static-only and base-path-safe (constitution I & III); no new
*shipped-bundle* dependencies (constitution V — the new test libraries are dev-only and never
reach `dist/`); no new data pipeline work (constitution II, IV not implicated)

**Scale/Scope**: 2 application files touched (`src/Chart/Chart.tsx`, `src/App.tsx`), plus test
tooling setup (`vite.config.ts`, `package.json`, a new `src/test/setup.ts`, a new
`Chart.test.tsx`), plus a one-line CI edit (`.github/workflows/deploy.yml`); no new data
entities, routes, or pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Static Hosting Only | Pure client-side rendering/state change; no server code, no new runtime calls | PASS |
| II. Data Prepared at Build Time | No new data; reuses existing committed `maxWeek` per season | PASS |
| III. Base-Path-Safe Navigation | View mode is in-memory component state, not a route; no server rewrites needed | PASS |
| IV. Respectful, Offline Collection | Not implicated — no scraping involved | PASS |
| V. Simplicity | No new shipped-bundle dependencies; reuses existing `useState`/`useEffect` patterns. New dev-only test dependencies (Vitest + Testing Library) are explicitly sanctioned by constitution v1.1.0 (Hosting & Technology Constraints: "Testing" bullet; Principle V's dev-vs-runtime-dependency clause) and are the minimal standard pairing for testing interactive React behavior (research.md §8) | PASS |
| Quality gates | Constitution v1.1.0 requires `npm run lint`, `npm run build`, **and `npm test`** before merging. This feature is what introduces the test suite that makes the last of those three satisfiable | PASS |

**Note**: `.github/workflows/deploy.yml` (from feature `001-github-pages-deploy`) still only runs
`npm run lint` and `npm run build` — it does not yet run `npm test`, so the constitution's gate
is not yet enforced in CI. Updating that workflow is a small, separate edit to a deployment file
outside this plan's file list; call it out as a task in `tasks.md` (or do it as a quick follow-up
once the suite exists) rather than silently leaving the gate unenforced.

**Post-design re-check (after Phase 1)**: All gates still PASS. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-view-full-season/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── view-mode-interface.md  # App.tsx <-> Chart.tsx prop contract for view-mode state
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
vite.config.ts           # EDIT: switch to `defineConfig` from `vitest/config`; add a `test`
                          #       block (environment: jsdom, setupFiles, globals: true)
package.json              # EDIT: add `test` script (`vitest run`) and new devDependencies
.github/workflows/deploy.yml  # EDIT: run `npm test` in the `build` job so the constitution's
                          #       gate (v1.1.0) is actually enforced in CI, not just locally

src/
├── App.tsx              # EDIT: lift `zoomedOut` state above Chart's per-season remount;
│                         #       pass it + a toggle handler down to RankingsChart
├── Chart/
│   ├── Chart.tsx         # EDIT: configurable window-width constant; full-season rendering
│   │                     #       branch; hide paging/keyboard panning while zoomed out; hide
│   │                     #       the zoom control when a season's weeks fit the window
│   ├── Chart.test.tsx    # NEW: component-interaction tests for this feature's FRs
│   ├── teams.ts          # unchanged
│   └── types.ts          # unchanged — no new data entities
└── test/
    └── setup.ts          # NEW: jest-dom matchers registration for Vitest
```

**Structure Decision**: Keep the existing single-project Vite/React layout. Tests live next to
the code they cover (`Chart.test.tsx` beside `Chart.tsx`), matching common Vitest/Vite project
convention; a single `src/test/setup.ts` wires up `@testing-library/jest-dom` globally. No
separate `tests/` top-level directory is introduced, since this is a single small component
suite, not a multi-layer test pyramid. The CI workflow edit is a one-line addition to the
existing `build` job, not a restructuring of the deploy pipeline from `001-github-pages-deploy`.

## Complexity Tracking

No constitution violations; section intentionally empty.
