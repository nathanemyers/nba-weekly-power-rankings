---

description: "Task list template for feature implementation"
---

# Tasks: GitHub Pages Deployment

**Input**: Design documents from `/specs/001-github-pages-deploy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/deployment.md, quickstart.md

**Tests**: No unit test framework exists in this repo (plan.md Technical Context). Validation is
manual, driven by quickstart.md; no automated test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single-project Vite app at repository root (per plan.md Project Structure): `index.html`,
`vite.config.ts`, `README.md`, `.github/workflows/`.

---

## Phase 1: Setup

**Purpose**: Confirm the local toolchain can run the gates every later task depends on.

- [x] T001 Verify the local toolchain: `node --version` reports Node 22.x and `npm ci` completes
      without errors from the repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base-path and asset-reference fixes that every user story (live site, auto-publish,
local preview) depends on to render correctly.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Set `base: '/nba-weekly-power-rankings/'` in `vite.config.ts` so every emitted asset
      URL and `import.meta.glob` season chunk resolves under the repository sub-path
      (research.md §2)
- [x] T003 [P] Replace the broken root-absolute `<link rel="icon" href="/favicon.svg">` in
      `index.html` with an inline `data:image/svg+xml` favicon containing a 🏀 emoji (no backing
      file exists for the old link, so it is a guaranteed 404 and would resolve outside the site
      under a sub-path; the inline data URI needs no file and is base-path-safe by construction)
      (research.md §3) — done

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visitors can view the live power-rankings chart (Priority: P1) 🎯 MVP

**Goal**: The site is reachable at `https://nathanemyers.github.io/nba-weekly-power-rankings/`
and renders the full chart with no broken assets, under the repository sub-path.

**Independent Test**: Publish the current version once, open the public address in a fresh
browser session, and confirm the chart renders and responds to interaction with no missing
assets.

### Implementation for User Story 1

- [x] T004 [US1] Delete `.github/workflows/static.yml` — the default "upload entire repo" Pages
      template has no lint/build gate and would race the new workflow on the same `pages`
      concurrency group
- [x] T005 [US1] Create `.github/workflows/deploy.yml` with a `build` job: `actions/checkout@v5`
      → `actions/setup-node@v5` (Node 22, npm cache) → `npm ci` → `npm run lint` →
      `npm run build` → assert `dist/index.html` exists → upload `dist/` via
      `actions/upload-pages-artifact@v4`; trigger on `workflow_dispatch` (depends on T004)
- [x] T006 [US1] Add a `deploy` job to `.github/workflows/deploy.yml`: `needs: build`,
      `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`,
      `permissions: { contents: read, pages: write, id-token: write }`, steps
      `actions/configure-pages@v5` then `actions/deploy-pages@v4` (id: `deployment`) (depends on
      T005; same file)
- [ ] T007 [US1] One-time repository setting: Settings → Pages → Build and deployment → Source:
      **GitHub Actions**; then run the workflow once via **Run workflow** (`workflow_dispatch`)
      (depends on T006)
- [ ] T008 [US1] Validate in a fresh browser: open
      `https://nathanemyers.github.io/nba-weekly-power-rankings/`, confirm the chart renders
      with the most recent season, switching seasons works, and the Network tab shows zero
      failed asset/data requests (SC-001) (depends on T007)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable
independently — the site is live and correct.

---

## Phase 4: User Story 2 - Maintainer publishes updates automatically (Priority: P2)

**Goal**: Merging into `master` publishes automatically with no manual step, and a failing build
never reaches the live site.

**Independent Test**: Merge a small visible change into the main branch and confirm it appears on
the public site without any further action by the maintainer.

### Implementation for User Story 2

- [x] T009 [US2] Add a `push` trigger (`branches: ["master"]`) to the `on:` block in
      `.github/workflows/deploy.yml`, alongside the existing `workflow_dispatch` (depends on
      T006; same file)
- [x] T010 [US2] Add `concurrency: { group: pages, cancel-in-progress: false }` to
      `.github/workflows/deploy.yml` so a newer queued run supersedes an older *pending* one
      without cancelling an in-flight deployment (edge case: overlapping publishes) (depends on
      T009; same file)
- [ ] T011 [US2] Validate: merge a small visible change (e.g., page title text) into `master`;
      confirm it is live at the public URL within 10 minutes with no manual steps (SC-002)
      (depends on T010)
- [ ] T012 [US2] Validate the failure path: push a commit with a deliberate lint error to a test
      branch/fork with Pages enabled (or confirm by inspection that the `deploy` job declares
      `needs: build`), and confirm the run fails at the lint step, no `deploy` job runs, and the
      previously published version stays live (FR-006, SC-003) (depends on T010)

**Checkpoint**: User Stories 1 AND 2 both work — manual and automatic publish are reliable, and
failures never go live.

---

## Phase 5: User Story 3 - Maintainer can verify a production-like build locally (Priority: P3)

**Goal**: The maintainer can build and preview the site locally exactly as GitHub Pages will
serve it, including the sub-path, before merging.

**Independent Test**: Run the documented local preview and confirm the site loads correctly
under the same sub-path used in production.

### Implementation for User Story 3

- [x] T013 [P] [US3] Add a "Local production preview" section to `README.md` documenting
      `npm run lint && npm run build && npm run preview`, noting the preview serves under
      `/nba-weekly-power-rankings/` (FR-008) (depends on T002, T003)
- [x] T014 [US3] Validate quickstart.md Scenario 1: run `npm run lint`, `npm run build`,
      `npm run preview`; confirm the printed URL ends in `/nba-weekly-power-rankings/`, every
      season loads with zero failed network requests, and
      `grep -o 'src="[^"]*"\|href="[^"]*"' dist/index.html` lists only URLs beginning with
      `/nba-weekly-power-rankings/` or `data:` (SC-004) (depends on T002, T003)

**Checkpoint**: All user stories are now independently functional. US3 did not require the CI
workflow and could have been done in parallel with Phase 3/4.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation cleanup that spans the whole feature.

- [x] T015 [P] Update `README.md` to link to the live site,
      `https://nathanemyers.github.io/nba-weekly-power-rankings/`, replacing or supplementing the
      existing `nathanemyers.com/projects/nba-power-rankings` link (FR-009) (depends on T008)
- [ ] T016 Run the full quickstart.md validation end to end (all 4 scenarios) to confirm the
      feature is complete (depends on T008, T011, T012, T014)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational. Delivers the MVP (live, correct site).
- **User Story 2 (Phase 4)**: Depends on Foundational, and on User Story 1's `deploy.yml`
  (T005/T006) already existing — it extends the same workflow file rather than creating a
  parallel one.
- **User Story 3 (Phase 5)**: Depends only on Foundational (T002, T003). Independent of the CI
  workflow — can be done in parallel with Phase 3/4 by a different person.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- US1: delete old workflow → build job → deploy job → enable Pages source → validate live
- US2: add push trigger → add concurrency → validate auto-publish → validate failure path
- US3: README doc and local validation have no dependency on each other, only on Foundational

### Parallel Opportunities

- T002 and T003 (Foundational) touch different files and can run in parallel
- T013 (US3 README doc) has no dependency on T014 (US3 local validation) and can run in parallel
- Phase 5 (US3) as a whole can run in parallel with Phase 3/4 (US1/US2), since it never touches
  `.github/workflows/deploy.yml`

---

## Parallel Example: Foundational Phase

```bash
Task: "Set base: '/nba-weekly-power-rankings/' in vite.config.ts"
Task: "Remove broken root-absolute favicon link in index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open the public URL in a fresh browser (T008) and confirm SC-001
5. Demo: the site is live and correct — MVP done

### Incremental Delivery

1. Complete Setup + Foundational → base path and asset references correct everywhere
2. Add User Story 1 → validate independently → site is live (MVP!)
3. Add User Story 2 → validate independently → merges auto-publish, failures never go live
4. Add User Story 3 → validate independently → local preview matches production
5. Polish: live link in README, full quickstart re-validation

### Parallel Team Strategy

With two contributors, once Foundational is done:

- Contributor A: User Story 1 → User Story 2 (same workflow file, sequential)
- Contributor B: User Story 3 (README + local preview, touches no CI files)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature has only 16 tasks across a ~3-file change set; most sequencing is same-file
  ordering (one workflow file touched by both US1 and US2) rather than team-scale parallelism
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
