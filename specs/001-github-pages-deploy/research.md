# Research: GitHub Pages Deployment

No `NEEDS CLARIFICATION` items remained in Technical Context. The decisions below cover the
technology choices and integration patterns the plan depends on.

## 1. Publishing mechanism

- **Decision**: GitHub Actions workflow using the official `actions/configure-pages`,
  `actions/upload-pages-artifact`, and `actions/deploy-pages` actions; repository Pages source
  set to "GitHub Actions".
- **Rationale**: Builds in CI from a clean checkout (no committed build output), needs only the
  built-in `GITHUB_TOKEN` + OIDC (`pages: write`, `id-token: write`) satisfying FR-007, and a
  failed job never touches the live site (FR-006).
- **Alternatives considered**:
  - `gh-pages` branch via the `gh-pages` npm package: adds a dev dependency, pushes build output
    into git history, and publishes from the maintainer's machine unless also wired into CI.
  - Committing `dist/` or a `docs/` folder to `master`: pollutes history, easy to forget to
    rebuild, conflicts with `.gitignore` of `dist`.

## 2. Base path handling

- **Decision**: Set `base: '/nba-weekly-power-rankings/'` unconditionally in `vite.config.ts`.
- **Rationale**: Vite prefixes every emitted asset URL, including dynamic-import chunks from
  `import.meta.glob` (season data), with `base`. Using it in dev and preview too means local
  runs exercise the same sub-path as production (User Story 3, SC-004).
- **Alternatives considered**:
  - `base: './'` (relative): works for a single page with no routing, but makes the preview URL
    differ from production and is less robust if routes are ever added.
  - Env-driven base (only in CI): local preview would not match production; adds config surface.

## 3. Favicon reference

- **Decision**: Remove `<link rel="icon" href="/favicon.svg">` from `index.html`.
- **Rationale**: No `public/favicon.svg` exists, so it is already a 404; under a sub-path it would
  also point outside the site. Removing it satisfies SC-001 (zero failed requests from the page's
  own references). Adding a real favicon is out of scope.
- **Alternatives considered**: Add a `public/favicon.svg` (Vite rewrites public-dir URLs with
  `base`) — deferred as a design task, not deployment.

## 4. Workflow triggers and concurrency

- **Decision**: Trigger on `push` to `master` and `workflow_dispatch`. Use
  `concurrency: { group: pages, cancel-in-progress: false }`.
- **Rationale**: Matches FR-004/FR-005. GitHub's concurrency keeps at most one pending run per
  group (newer pending runs replace older pending ones), so the latest merge ends up live without
  aborting a deployment mid-flight (edge case: overlapping publishes).
- **Alternatives considered**: `cancel-in-progress: true` — could interrupt an in-progress
  deployment; GitHub's starter workflow recommends `false` for Pages.

## 5. CI build steps and quality gates

- **Decision**: Single `build` job: checkout → `actions/setup-node` (Node 22, npm cache) →
  `npm ci` → `npm run lint` → `npm run build` → `upload-pages-artifact` (`path: dist`). Separate
  `deploy` job `needs: build` with `environment: github-pages`.
- **Rationale**: Enforces the constitution's quality gates before deploy; `npm ci` uses the
  committed lockfile for reproducibility. The `github-pages` environment exposes the deployed
  URL in the Actions UI.
- **Alternatives considered**: Running `build:rankings` in CI — rejected; derived data is
  committed per Principle II, and regenerating could change output unexpectedly.

## 6. Action versions

- **Decision**: Pin to current major versions at implementation time
  (`actions/checkout@v5`, `actions/setup-node@v5`, `actions/configure-pages@v5`,
  `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`); verify each is the latest major
  when writing the workflow.
- **Rationale**: Major-version tags receive security fixes while avoiding breaking changes.

## 7. Missing-data guard

- **Decision**: Rely on the build: season files are imported via `import.meta.glob`, so the
  bundle contains a chunk per committed season; additionally, the workflow asserts
  `dist/index.html` exists before upload.
- **Rationale**: Covers the "build succeeds but output is empty" edge case cheaply without a
  test framework.
