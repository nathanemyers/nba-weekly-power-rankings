# Feature Specification: GitHub Pages Deployment

**Feature Branch**: `speckit`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Set project up to be deployed in github pages"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitors can view the live power-rankings chart (Priority: P1)

A visitor opens the project's public GitHub Pages address in a browser and sees the interactive
NBA weekly power-rankings chart, fully working, with all season data, styling, and team assets
loaded.

**Why this priority**: The site has no value until it is reachable at a public address. This is
the minimum viable outcome of the feature.

**Independent Test**: Publish the current version once, open the public address in a fresh
browser session, and confirm the chart renders and responds to interaction with no missing
assets.

**Acceptance Scenarios**:

1. **Given** the site has been published, **When** a visitor opens the public address,
   **Then** the chart renders with the most recent season's rankings and no broken images,
   styles, or data.
2. **Given** the site is served from a sub-path (not the domain root), **When** a visitor loads
   the page, **Then** every asset and data file loads successfully from under that sub-path.
3. **Given** a visitor is on the published site, **When** they switch seasons or interact with
   the chart, **Then** the behavior matches what the maintainer sees when running the site
   locally.

---

### User Story 2 - Maintainer publishes updates automatically (Priority: P2)

When the maintainer merges changes (code or refreshed rankings data) into the main branch, the
public site updates to match without any manual upload or build step on their machine.

**Why this priority**: Rankings are refreshed weekly during the season; a manual publish process
would be error-prone and easy to forget.

**Independent Test**: Merge a small visible change into the main branch and confirm it appears
on the public site without any further action by the maintainer.

**Acceptance Scenarios**:

1. **Given** a change is merged into the main branch, **When** the publish process completes,
   **Then** the public site reflects that change.
2. **Given** a change breaks the build, **When** it is merged, **Then** publishing fails
   visibly to the maintainer and the previously published version stays live.
3. **Given** the maintainer wants to republish without a code change, **When** they trigger a
   publish manually, **Then** the current main branch is published.

---

### User Story 3 - Maintainer can verify a production-like build locally (Priority: P3)

Before merging, the maintainer can build and preview the site locally exactly as it will be
served from GitHub Pages, including the sub-path, to catch broken asset paths early.

**Why this priority**: Prevents broken deployments, but the site is still deployable without it.

**Independent Test**: Run the documented local preview and confirm the site loads correctly
under the same sub-path used in production.

**Acceptance Scenarios**:

1. **Given** a local checkout, **When** the maintainer follows the documented preview steps,
   **Then** the site is served under the production sub-path and renders identically to the
   published site.

---

### Edge Cases

- Assets or icons referenced from the domain root (e.g., `/favicon.svg`) would fail under a
  sub-path; all references must resolve under the published sub-path.
- A visitor reloads the page or opens a shared link: the page must load without relying on
  server rewrite rules.
- The publish runs while a previous publish is still in progress: only the latest change should
  end up live.
- The build succeeds but required data files are missing from the output: publishing must not
  produce a site with an empty chart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST be publicly reachable at the repository's GitHub Pages address.
- **FR-002**: The published site MUST function entirely as static files, with no backend or
  runtime calls to third-party services (per constitution Principles I and II).
- **FR-003**: All pages, scripts, styles, images, and data files MUST load correctly when the
  site is served from the repository's sub-path rather than a domain root.
- **FR-004**: Merging into the main branch MUST automatically build and publish the site.
- **FR-005**: The maintainer MUST be able to trigger a publish manually for the current main
  branch.
- **FR-006**: A failed build or lint check MUST prevent publishing and leave the previous
  version live, and the failure MUST be visible to the maintainer.
- **FR-007**: The publish process MUST NOT require any secrets beyond what the hosting platform
  provides by default.
- **FR-008**: The project MUST document how to preview a production-like build locally under
  the production sub-path.
- **FR-009**: The project README MUST link to the live GitHub Pages address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can load the public site and see the chart with zero failed asset or
  data requests.
- **SC-002**: A change merged into the main branch is visible on the public site within
  10 minutes with no manual steps.
- **SC-003**: 100% of merges that fail the build or lint check result in no change to the
  live site.
- **SC-004**: The site renders and behaves identically in the local production preview and in
  the published site for every season available.

## Assumptions

- The site is published as a GitHub Pages *project site* for the existing
  `nathanemyers/nba-weekly-power-rankings` repository, so it is served under the
  `/nba-weekly-power-rankings/` sub-path.
- The main branch is `master`; merges to it are the publishing trigger.
- Rankings data stays pre-built and committed; scraping is not part of the publish process.
- Configuring a custom domain is out of scope. The existing link to
  `nathanemyers.com/projects/nba-power-rankings` in the README is replaced or supplemented with
  the GitHub Pages address.
- GitHub Pages is enabled for the repository with the source set to the automated publish
  process (a one-time repository setting the maintainer performs).
