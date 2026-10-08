<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles: all placeholders replaced (initial adoption)
  - [PRINCIPLE_1_NAME] → I. Static Hosting Only (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Data Is Prepared at Build Time
  - [PRINCIPLE_3_NAME] → III. Base-Path-Safe, Server-Free Navigation
  - [PRINCIPLE_4_NAME] → IV. Respectful, Offline Data Collection
  - [PRINCIPLE_5_NAME] → V. Simplicity
- Added sections: Hosting & Technology Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: none (templates read the constitution at runtime)
- Follow-up TODOs: none
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
  alongside the static build (e.g., JSON under `src/data/`), produced ahead of time by scripts
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
- Raw scraped inputs live under `data/`; the app consumes only the reduced outputs produced by
  build scripts.

Rationale: keeps the project a good citizen of its data sources and separates collection from
presentation.

### V. Simplicity

- Prefer the existing stack (React, TypeScript, Vite, styled-components) and the platform over
  new dependencies. Each new runtime dependency MUST be justified by a need the current stack
  cannot reasonably meet.
- Do not introduce infrastructure (servers, databases, hosted services) to solve problems that
  build-time scripts or client-side code can solve.

Rationale: a small, single-maintainer visualization project stays maintainable by staying small.

## Hosting & Technology Constraints

- Deployment target: GitHub Pages (static file hosting only).
- Build: `npm run build` (TypeScript check + Vite) MUST produce a self-contained `dist/` that is
  deployable as-is.
- Data pipeline: `npm run scrape:*` scripts collect raw data into `data/`;
  `npm run build:rankings` reduces it into app-consumable JSON under `src/data/`.
- No secrets, API keys, or credentials may be required by, or embedded in, the client bundle.

## Development Workflow & Quality Gates

- Before merging, `npm run lint` and `npm run build` MUST pass.
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

**Version**: 1.0.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
