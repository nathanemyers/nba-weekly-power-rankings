# Implementation Plan: Path-Based Addresses and Per-Page Link Previews

**Branch**: `023-path-routing-page-previews` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/023-path-routing-page-previews/spec.md`

## Summary

Switch the app from the hash router to the browser router, with a `basename` set to the GitHub Pages sub-path. Rewrite old `#/...` links to their plain form on load. At build time, a Vite plugin writes:

- a static HTML entry file for every season, team, and player address
- a `404.html` fallback
- 1200×630 JPEG screenshots of each season and team page, taken with the installed Google Chrome

Season and team entry files carry page-specific Open Graph tags. Player pages, the base address, and the fallback keep the site-wide preview. Each view sets its browser tab title with React 19's `<title>`.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.2, Node 22 (CI and build)

**Primary Dependencies**: React Router 8 (`createBrowserRouter`), Vite 8 (plugin hooks, `runnerImport`), Zod 4. New devDependency: `playwright-core` (drives the installed Google Chrome; no browser download).

**Storage**: Static files only. Inputs are `data/processed/seasons/*.json` and the built site itself. Outputs are generated into `dist/` and not committed.

**Testing**: Vitest (`npm test`). Unit tests cover page logic in `src/pagePreviews/`. Existing router tests stay on `createMemoryRouter`.

**Target Platform**: Static hosting on GitHub Pages at `/nba-weekly-power-rankings/`, in modern browsers.

**Project Type**: Single-page web app with a build-time static generation step

**Performance Goals**: Client navigation unchanged (SC-005). The preview step adds no more than ~10 s to `npm run build`.

**Constraints**:
- No server and no rewrites.
- Every linked address has a static file (constitution v1.6.0, Principle III).
- Preview URLs are absolute.
- Card rendering is deterministic on macOS and Ubuntu CI.

**Scale/Scope**: 23 season pages, 30 team pages, about 2,400 player pages, and 53 PNGs. Adds about 6 MB of HTML and about 3 MB of PNGs to `dist/` (8.8 MB today).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | How |
|---|---|---|
| I. Static Hosting Only | ✅ | Everything is static files produced at build time. No server code, headers, or redirects. |
| II. Data Prepared at Build Time | ✅ | Cards and tags are derived from committed `data/processed/` JSON at build time, with no network access. Generated files are build output, not data, so they aren't committed (research R7). |
| III. Base-Path-Safe, Server-Free Navigation (v1.6.0) | ✅ | Every linked address has an entry file (R2). `404.html` covers unknown addresses. Old `#/` links are rewritten on the client (R4). URLs come from Vite `base`. |
| IV. Respectful Data Collection | ✅ | Not affected. No scraping. |
| V. Simplicity | ✅ | No new runtime dependency. One dev dependency (`playwright-core`, which drives the installed Chrome) with a stated need (R6). React 19 `<title>` instead of an effect (R5). |
| Hosting: `npm run build` → self-contained `dist/` | ✅ | The plugin runs inside `vite build`. The deploy workflow is unchanged. |
| State & Data Layer | ✅ | Navigation state stays in the URL and the router. The plugin reads JSON directly and validates it with the existing Zod schemas. |
| Data Validation (Zod) | ✅ | Season JSON is parsed with `SeasonDataSchema` and the index with `SeasonIndexEntrySchema`. Invalid seasons are skipped. |
| Quality gate: check under a non-root base path | ✅ | quickstart.md §3 uses `npm run preview` at `/nba-weekly-power-rankings/`. |
| No backend, no runtime third-party calls | ✅ | Confirmed. |

**Post-design re-check**: ✅ No violations. Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/023-path-routing-page-previews/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── addresses.md
│   └── build-output.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                         # createBrowserRouter + basename; legacy #/ rewrite before router creation
├── pagePreviews/                   # NEW: pure page logic (app tsconfig, unit-tested)
│   ├── pages.ts                    # PageEntry list: seasons, teams, players → paths, files, heads
│   ├── cards.ts                    # PreviewCard derivation (champion, #1 team, team best result)
│   ├── head.ts                     # rewrite <title>/description/og:*/twitter:image in index.html
│   ├── legacyHash.ts               # "#/x" → "<base>/x"
│   └── *.test.ts
└── views/
    ├── ChartView.tsx               # + <title>
    ├── TeamHistoryView.tsx         # + <title>
    └── PlayerHistoryView.tsx       # + <title>

build/pagePreviews/
└── plugin.ts                       # NEW: Vite plugin (apply: 'build', closeBundle). runnerImport + fs + preview server + Chrome screenshots

vite.config.ts                      # register the plugin
tsconfig.node.json                  # include build/pagePreviews/plugin.ts
package.json                        # devDependency playwright-core
```

**Structure Decision**: Single project. The pure logic stays in `src/` so it shares the team list, enums, and schemas with the app and is covered by Vitest. Only file I/O and rasterizing live in the node-side plugin (research R7a).

## Implementation Notes

- **Order**: router switch + legacy rewrite + tab titles (Stories 1–2) can ship on their own. The build plugin (Story 3) builds on them. Spike `runnerImport` alias resolution first (R7a).
- **Screenshots**: Google Chrome must be installed wherever `npm run build` runs. GitHub's Ubuntu runners include it.
- **Spec follow-up**: the spec's Constitution Notes now point to the adopted v1.6.0 amendment.

## Complexity Tracking

Not needed. There are no constitution violations.
