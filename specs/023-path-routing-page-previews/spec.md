# Feature Specification: Path-Based Addresses and Per-Page Link Previews

**Feature Branch**: `023-path-routing-page-previews`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "convert project to use a normal router instead of a hash router, and add preview images on each page"

## Current State *(context)*

- Every page address puts the view after a `#`, e.g. `/nba-weekly-power-rankings/#/2024-25`, `#/teamHistory/bos`, `#/playerHistory/jamesle01`.
- Link-preview services (Slack, iMessage, Discord, X, Facebook) ignore everything after `#` and do not run the app's scripts. Every shared link therefore shows the same site-wide title, description, and image (`sitePreview.png`), whichever page was shared.
- The site has three kinds of pages: 23 season charts (2003-04 to 2025-26), 30 team history pages, and about 2,400 player history pages.
- The site is hosted as static files on GitHub Pages under the `/nba-weekly-power-rankings/` sub-path. The host cannot rewrite unknown paths to the app's entry page.
- Constitution Principle III required hash routing or query parameters until v1.6.0, which now allows path addresses (see Constitution Notes).

## Clarifications

### Session 2026-11-12

- Q: Should player history pages get their own link preview? → A: No. Player pages show the site-wide preview (title, description, `sitePreview.png`). Only season and team pages get page-specific previews.
- Q: What should season and team preview images show? → A: A designed title card (site name, page name, one headline fact, team colors and logo), not a screenshot of the chart.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean, shareable page addresses (Priority: P1)

A visitor viewing the 2018-19 season chart sees a plain address like `/nba-weekly-power-rankings/2018-19`, with no `#`. They copy it and send it to a friend, who opens it in a fresh browser and lands directly on the 2018-19 chart. The same is true for team and player history pages. Back and Forward work as they do today.

**Why this priority**: Plain addresses are the base the preview work depends on. Link-preview services can only tell pages apart when the page is in the path.

**Independent Test**: Open each kind of page by typing its plain address into a fresh tab on the deployed site, and confirm the right page renders with no host error. Navigate between pages and confirm Back and Forward.

**Acceptance Scenarios**:

1. **Given** a fresh browser tab, **When** the visitor opens `/nba-weekly-power-rankings/2018-19`, **Then** the 2018-19 chart is shown and the address has no `#`.
2. **Given** a fresh browser tab, **When** the visitor opens a team history address such as `/nba-weekly-power-rankings/teamHistory/bos`, **Then** the Celtics history page is shown.
3. **Given** a fresh browser tab, **When** the visitor opens a player history address, **Then** that player's history page is shown.
4. **Given** the visitor is on any page, **When** they press the browser's reload button, **Then** the same page reloads with no host error.
5. **Given** the visitor goes from the 2024-25 chart to the 2019-20 chart, **When** they press Back, **Then** the 2024-25 chart is shown again.
6. **Given** the visitor opens the site's base address, **When** the page loads, **Then** the most recent season's chart is shown and the address names that season.

---

### User Story 2 - Old links keep working (Priority: P1)

Someone opens a link shared before this change, such as `/nba-weekly-power-rankings/#/2018-19`. They land on the 2018-19 chart, and the address bar switches to the new plain form.

**Why this priority**: Old-style links are already bookmarked and posted. Breaking them would be a regression for existing visitors.

**Independent Test**: Open an old `#/...` address for each kind of page and confirm the same page loads and the address is rewritten to the plain form.

**Acceptance Scenarios**:

1. **Given** an old-style season link `#/2018-19`, **When** it is opened, **Then** the 2018-19 chart is shown and the address becomes `/nba-weekly-power-rankings/2018-19`.
2. **Given** an old-style team or player history link, **When** it is opened, **Then** the matching page is shown at its plain address.
3. **Given** an old-style link naming a page that does not exist, **When** it is opened, **Then** the visitor sees the same result as opening that bad plain address.

---

### User Story 3 - Page-specific link previews (Priority: P2)

A visitor shares the Celtics team history page in a group chat. The preview card shows a title naming the Celtics, a short description of that page, and an image specific to that page, not the generic site image. Sharing the 2018-19 chart shows a preview for that season. Player history pages are not included and keep the site-wide preview.

**Why this priority**: This is the visible payoff of the change. It needs Story 1 in place first.

**Independent Test**: Paste the plain address of a season page and a team page into a link-preview checker and confirm each shows its own title, description, and image. Paste a player page address and confirm it shows the site-wide preview.

**Acceptance Scenarios**:

1. **Given** the plain address of a season chart, **When** a link-preview service fetches it, **Then** the preview shows a title naming the season, a description of that season, and that season's preview image.
2. **Given** the plain address of a team history page, **When** a link-preview service fetches it, **Then** the preview shows the team's name, a description of the page, and that team's preview image.
3. **Given** the plain address of a player history page, **When** a link-preview service fetches it, **Then** the preview shows the site-wide title, description, and `sitePreview.png`.
4. **Given** the site's base address, **When** a link-preview service fetches it, **Then** the preview shows the site-wide title, description, and `sitePreview.png`.
5. **Given** any page open in a browser, **When** the visitor looks at the browser tab, **Then** the tab title names that page (season, team, or player).

---

### Edge Cases

- **Unknown address** (e.g. `/nba-weekly-power-rankings/1999-00` or a misspelled team): the visitor sees the app's own not-found handling or is sent to the most recent season, as the app does today, not a bare host error page. The link preview for an unknown address shows the site-wide preview.
- **Trailing slash** (e.g. `/2018-19/`): loads the same page as the address without the slash.
- **Team abbreviation case** (e.g. `teamHistory/BOS`): loads the same page as lower case, as today.
- **Address outside the site's sub-path**: not served by this site and out of scope.
- **New season or player added in a data refresh**: their pages (and, for a season, its preview) are produced the next time the site is built, with no manual step.
- **Season in progress**: the current season has no champion yet. Its card shows the current #1 team instead and uses the site's own colors, and it updates at the next build after new rankings arrive.
- **Preview caches**: services that already cached the generic preview for an old link may keep showing it until their cache expires. That is outside the site's control.

## Requirements *(mandatory)*

### Functional Requirements

**Addresses and navigation**

- **FR-001**: Every page MUST be reachable at a plain path address under the site's sub-path, with no `#`: `/<season>`, `/teamHistory/<team>`, and `/playerHistory/<player>`.
- **FR-002**: Opening or reloading any valid page address in a fresh tab MUST show that page. The host must never return its own error page for a valid page.
- **FR-003**: All in-app links and navigation (season picker, team history button, season cards, player links) MUST produce plain addresses.
- **FR-004**: Back and Forward MUST move between previously viewed pages as they do today.
- **FR-005**: The base address MUST continue to show the most recent season and update the address to name it.
- **FR-006**: Old hash-style addresses (`#/...`) for any page MUST open the matching page and replace the address with its plain form, without adding an extra history entry.
- **FR-007**: Unknown addresses under the site's sub-path MUST be handled by the app (its not-found view or redirect to the latest season), not by a bare host error page.
- **FR-008**: The site MUST keep working when served from the `/nba-weekly-power-rankings/` sub-path and from any other configured sub-path.

**Link previews**

- **FR-009**: Every valid season and team page address MUST serve page-specific preview information (title, description, image, and canonical address) that a link-preview service can read without running scripts.
- **FR-010**: Each season chart page MUST have its own preview image that identifies the season.
- **FR-011**: Each team history page MUST have its own preview image that identifies the team.
- **FR-012**: Player history pages MUST NOT get page-specific previews. A link-preview service fetching a player page address MUST see the site-wide title, description, and `sitePreview.png`.
- **FR-013**: Season and team preview images MUST be designed title cards built from the site's data, not screenshots of the page. Each card MUST show the site name, the page's name (the season, e.g. "2018-19", or the team's full name), and one headline fact. For a season, the fact is the season's champion. For a team, it is the team's best season result (e.g. a championship count, or its highest finish). Team cards MUST use that team's colors and logo. Season cards MUST use the champion's colors, or the site's own colors when the season has no champion yet.
- **FR-014**: Preview images MUST be at least 1200×630 pixels with a roughly 1.91:1 shape so major services show them as a large card without cropping out important content.
- **FR-015**: The base address, player pages, and unknown addresses MUST use the site-wide title, description, and `sitePreview.png`.
- **FR-016**: The browser tab title MUST name the current page (season, team, or player) while the visitor browses.
- **FR-017**: Season and team previews and images MUST be produced automatically as part of the normal site build from the committed data, with no paid services, API keys, or manual steps.

### Key Entities

- **Page**: One viewable address in the site: a season chart, a team history page, or a player history page. It has a plain address and a tab title. Season and team pages also have their own preview title, description, and image.
- **Preview image**: A picture shown on link-preview cards for one season or team page. It is produced at build time and served as a static file.
- **Legacy address**: An old `#/...` address that must map to exactly one current page address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of season, team, and player page addresses load the correct page when opened directly in a fresh tab on the deployed site.
- **SC-002**: 100% of old `#/...` addresses tested (at least one of each page kind) open the matching page at its plain address.
- **SC-003**: For a sample of at least 3 seasons and 3 teams, a public link-preview checker shows the page-specific title, description, and image. For at least 3 players, it shows the site-wide preview.
- **SC-004**: No two season pages, and no two team pages, show the same preview image.
- **SC-005**: A visitor's experience on a page they already have open (navigation speed, chart interactions) does not get noticeably slower than before the change.
- **SC-006**: A data refresh that adds a new season or player needs no manual step to give the new pages working addresses (and, for seasons, previews).

## Constitution Notes

- **Principle III (Base-Path-Safe, Server-Free Navigation)** says navigation must use "hash routing or query parameters" because the host cannot rewrite unknown paths. This feature replaces hash routing with path addresses. Principle III was amended in constitution v1.6.0 (2026-11-12) to allow path addresses when every linked address is served by a static file. This feature meets that by giving every valid page, including player pages, its own static entry file, with a `404.html` fallback for unknown paths.
- **Principle I (Static Hosting Only)** and **Principle II (Data Prepared at Build Time)** are unaffected: preview information and images are static files produced at build time from committed data.
- The quality gate requiring a check with a static server under a non-root sub-path applies, because this change affects routing and asset paths.

## Assumptions

- Hosting stays on GitHub Pages under `/nba-weekly-power-rankings/`. No custom domain or server is added.
- Existing page paths and parameters stay the same, minus the `#`. That means `/<season>`, `/teamHistory/<team>`, and `/playerHistory/<player>`, with lower-case team abbreviations and the same player IDs.
- The site-wide preview (title, description, `sitePreview.png`) and the `apple-touch-icon` from the recent polish work stay as the default.
- Unknown paths fall back to the app through the host's standard "not found" page. Visitors see correct app behavior, but the host's response status for those addresses will be "not found". That is acceptable because they are not real pages.
- Chart interaction state that isn't in the address today (zoom window, pinned teams) stays out of the address and out of previews.
- Build time and deployed size may grow because of per-page files and images. A moderate increase is acceptable as long as the deploy still succeeds within GitHub Pages limits.
