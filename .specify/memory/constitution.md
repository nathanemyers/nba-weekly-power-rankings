<!--
Sync Impact Report
- Version change: 1.3.0 → 1.4.0
- Modified principles:
  - II. Data Is Prepared at Build Time: app data location changes from the example
    `src/data/` to a required `data/processed/`. Title and intent unchanged.
  - IV. Respectful, Offline Data Collection: raw scraped inputs move from `data/` to a required
    `data/raw/`. AI-generated summaries are classified as processed data under
    `data/processed/`. Adds a rule that app code imports only from `data/processed/`. Title
    unchanged.
- Modified sections:
  - Hosting & Technology Constraints: the Data pipeline bullet now names `data/raw/` as the
    scrape target and `data/processed/` as the target for both `build:summaries` and
    `build:rankings`.
- Added sections: none
- Removed sections: none
- Templates requiring updates: none (templates read the constitution at runtime)
- Follow-up TODOs: none. The data/ folder, scripts/, the `data/*` alias, and README were
  reorganized to match in the same change.
-->

# NBA Weekly Power Rankings Constitution

## Core Principles

### I. Static Hosting Only (NON-NEGOTIABLE)

This project is deployed to GitHub Pages. There is no backend, and none may be added.

- All shipped functionality MUST work as static files (HTML, JS, CSS, JSON, images) served by
  GitHub Pages with no server-side code, functions, databases, or proxies.
- Features MUST NOT depend on server-side rendering, API routes, custom response headers,
  server redirects/rewrites, or environment secrets at runtime.
- Any state that must persist for a visitor MUST live in the browser (URL, `localStorage`,
  etc.) and the app MUST behave correctly when that storage is empty or unavailable.
- A feature that cannot be delivered under these constraints is out of scope until the
  constitution is amended.

Rationale: GitHub Pages is the sole hosting target; anything requiring a server will not run.

### II. Data Is Prepared at Build Time

- All ranking, playoff, and team data rendered by the app MUST be bundled with or served
  alongside the static build as JSON under `data/processed/`, produced ahead of time by scripts
  in `scripts/`.
- The browser MUST NOT call third-party APIs or scrape external sites at runtime. Runtime
  network requests are limited to same-origin static assets.
- Derived data files MUST be committed to the repository so a clean checkout builds and deploys
  without network access to data sources.

Rationale: external sources impose CORS, rate limits, and availability risks that a static site
cannot mitigate; pre-built data keeps the site fast and reproducible.

### III. Base-Path-Safe, Server-Free Navigation

- The site MUST work when served from a sub-path (e.g., `/projects/nba-power-rankings/`), not
  only from a domain root. Asset and data URLs MUST be relative or derived from the configured
  build base.
- Any in-app navigation or shareable view state MUST use mechanisms that need no server
  rewrite rules (hash routing or query parameters). Deep links MUST load correctly on a fresh
  page request.

Rationale: GitHub Pages cannot rewrite unknown paths to `index.html`, and the site is embedded
under a project path on a personal domain.

### IV. Respectful, Offline Data Collection

- Scraping and data-refresh scripts run locally or in CI, never in the deployed site.
- Scrapers MUST honor source sites' crawl delays and robots rules, identify themselves with a
  descriptive user agent, and avoid re-fetching data that is already stored.
- Raw scraped inputs MUST live under `data/raw/`. Everything derived from them by build
  scripts, including AI-generated summaries, is processed data and MUST live under
  `data/processed/`.
- Application code MUST import data only from `data/processed/`, never from `data/raw/`.
  Build scripts read from `data/raw/` (and MAY read other processed outputs) and write only to
  `data/processed/`.

Rationale: keeps the project a good citizen of its data sources and separates collection from
presentation.

### V. Simplicity

- Prefer the existing stack (React, TypeScript, Vite, Tailwind CSS, shadcn/ui,
  Redux Toolkit, Zod) and the platform over
  new dependencies. Each new runtime dependency MUST be justified by a need the current stack
  cannot reasonably meet.
- Do not introduce infrastructure (servers, databases, hosted services) to solve problems that
  build-time scripts or client-side code can solve.
- Dev-only dependencies (test runners, test-only libraries, lint/build tooling) are judged
  separately from runtime dependencies: they still MUST be justified by a real need, but they do
  not carry the deployed-bundle risk that motivates scrutinizing runtime dependencies.

Rationale: a small, single-maintainer visualization project stays maintainable by staying small.

## Hosting & Technology Constraints

- Deployment target: GitHub Pages (static file hosting only).
- Build: `npm run build` (TypeScript check + Vite) MUST produce a self-contained `dist/` that is
  deployable as-is.
- Data pipeline: `npm run scrape:*` scripts collect raw data into `data/raw/`;
  `npm run build:summaries` writes AI-generated summaries and `npm run build:rankings` writes
  app-consumable season JSON, both under `data/processed/`.
- UI & Styling: Tailwind CSS is the project's styling approach and shadcn/ui is its source of
  UI components. New and modified UI MUST use them. styled-components is no longer part of the
  stack and MUST NOT be introduced or reintroduced; other CSS-in-JS or component libraries
  require the same justification as any new runtime dependency under Principle V. Styles and
  fonts MUST be bundled with the build, consistent with Principles I and II.
- State & Data Layer: Redux Toolkit (`@reduxjs/toolkit`) with React Redux bindings
  (`react-redux`) is the project's dedicated data layer. Shared application state and loaded
  ranking/playoff/team data MUST live in the Redux store, organized as slices created with
  `createSlice` and read through selectors; plain Redux (`createStore`, hand-written action
  types) and alternative state libraries (Zustand, MobX, Jotai, etc.) MUST NOT be introduced.
  Purely local UI state (e.g., an open popover) MAY remain in component state. The store is
  in-memory only: anything that must persist or be shareable still follows Principles I and III
  (URL or browser storage). If RTK Query is used, it MUST only fetch same-origin static assets,
  consistent with Principle II.
- Data Validation: Zod is the project's schema and runtime-validation library. Data crossing a
  trust boundary into the app (bundled or fetched JSON, URL parameters, browser storage) MUST be
  parsed with a Zod schema before entering the Redux store or components, and invalid input MUST
  fall back to a safe default rather than crash. TypeScript types for validated data SHOULD be
  derived from schemas (`z.infer`) instead of duplicated by hand. Build scripts in `scripts/`
  MAY use Zod to validate the JSON they emit. Other validation libraries (Yup, io-ts, Valibot,
  etc.) MUST NOT be introduced.
- Testing: Vitest is the project's test runner, invoked via `npm test`. Test-only dependencies
  (e.g., `@testing-library/*`, `jsdom`) MAY be added as devDependencies to support it; these are
  dev-only tooling, not runtime dependencies, and never reach the client bundle in `dist/`.
- No secrets, API keys, or credentials may be required by, or embedded in, the client bundle.

## Development Workflow & Quality Gates

- Before merging, `npm run lint`, `npm run build`, and `npm test` MUST pass.
- Changes affecting loading, routing, or asset paths MUST be verified with `npm run preview`
  (or an equivalent static server) under a non-root base path.
- Specs and plans produced via Spec Kit MUST include a constitution check confirming the
  feature requires no backend and no runtime third-party calls.

## Governance

- This constitution supersedes other project practices. Where a plan or task conflicts with it,
  the constitution wins or the constitution is amended first.
- Amendments are made via `/speckit-constitution`, recorded in this file, and committed with a
  message describing the change.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle, MINOR
  for adding a principle or materially expanding guidance, PATCH for clarifications.
- Every feature plan and code review MUST verify compliance with the Core Principles; any
  justified deviation MUST be documented in the plan's complexity tracking.

**Version**: 1.4.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-14
