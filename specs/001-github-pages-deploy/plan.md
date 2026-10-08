# Implementation Plan: GitHub Pages Deployment

**Branch**: `speckit` (feature id `001-github-pages-deploy`) | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-github-pages-deploy/spec.md`

## Summary

Publish the existing Vite + React rankings chart as a GitHub Pages project site at
`https://nathanemyers.github.io/nba-weekly-power-rankings/`. The approach: set Vite's `base` to
the repository sub-path so every emitted asset and code-split season chunk resolves under it,
replace the root-absolute favicon reference that has no backing file with an inline 🏀 emoji
data-URI favicon, and replace the repo's
default "upload whole repo" Pages workflow (`.github/workflows/static.yml`, which has no build or
lint gate) with one that lints, builds, and deploys `dist/` via the official Pages actions on
every push to `master` (plus manual dispatch). README gets the new live link and preview
instructions.

## Technical Context

**Language/Version**: TypeScript ~6.0, Node.js 22 (build and CI only)

**Primary Dependencies**: React 19, Vite 8, styled-components 6; CI uses GitHub's official
Pages actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`)

**Storage**: N/A at runtime; season data is committed JSON under `src/data/seasons/`, bundled as
code-split chunks via `import.meta.glob`

**Testing**: No unit test framework in the repo. Gates are `npm run lint`, `npm run build`
(includes `tsc -b`), and manual validation via `npm run preview` (see quickstart.md)

**Target Platform**: Modern desktop and mobile browsers; hosted on GitHub Pages (static only)

**Project Type**: Single-page static web application

**Performance Goals**: Merge-to-live under 10 minutes (SC-002); typical Pages workflow is ~1–2 min

**Constraints**: Static files only; served under `/nba-weekly-power-rankings/`; no secrets beyond
the workflow's built-in `GITHUB_TOKEN`/OIDC; no server rewrites

**Scale/Scope**: 1 page, 9 season data chunks, 1 workflow file, ~3 small config/doc edits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Static Hosting Only | Output is `dist/` static files served by GitHub Pages; no server code added | PASS |
| II. Data Prepared at Build Time | Season JSON already committed and bundled; CI does not scrape | PASS |
| III. Base-Path-Safe Navigation | `base` set to repo sub-path; root-absolute favicon removed; app has no routing, so no rewrites needed | PASS |
| IV. Respectful, Offline Collection | Scrape scripts untouched and not run in CI | PASS |
| V. Simplicity | No new runtime deps; only official GitHub actions in CI | PASS |
| Quality gates | Workflow runs `lint` and `build` before deploy; preview under sub-path documented | PASS |

**Post-design re-check (after Phase 1)**: All gates still PASS. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-github-pages-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── deployment.md    # Published URL layout + workflow interface
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── static.yml       # DELETE: default template uploads whole repo, no build/lint gate
    └── deploy.yml       # NEW: lint → build → upload artifact → deploy to Pages

index.html               # EDIT: swap broken root-absolute /favicon.svg link for inline 🏀 data URI
vite.config.ts           # EDIT: base: '/nba-weekly-power-rankings/'
README.md                # EDIT: live GitHub Pages link + local preview instructions

src/                     # unchanged
├── App.tsx              # loads seasons via import.meta.glob (base-aware chunks)
├── index.tsx
├── Chart/
└── data/seasons/*.json
```

**Structure Decision**: Keep the existing single-project Vite layout. The feature touches only
build configuration, `index.html`, README, and a new CI workflow; application source is unchanged.

## Complexity Tracking

No constitution violations; section intentionally empty.
