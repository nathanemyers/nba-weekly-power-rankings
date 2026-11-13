---

description: "Task list for path-based addresses and per-page link previews"
---

# Tasks: Path-Based Addresses and Per-Page Link Previews

**Input**: Design documents from `/specs/023-path-routing-page-previews/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/addresses.md, contracts/build-output.md, quickstart.md

**Tests**: Included. The plan's testing approach (research R10) calls for Vitest unit tests of the pure page logic in `src/pagePreviews/`.

**Organization**: Tasks are grouped by user story. US1 and US2 (both P1) are client-side only and ship without the build plugin. US3 (P2) adds the build-time entry files and preview cards.

**Project rules (AGENTS.md)**: no `useMemo`; keep `useEffect` to a minimum; no `Map`/`Set`; comments are one sentence at most; colors only in `src/index.css`, except team colors and the preview-card generator (plan, Implementation Notes). Do **not** run `npm run build:summaries`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Dependencies and assets needed by the build plugin (US3). US1 and US2 don't need this phase and can start right away.

- [X] T001 Add `@resvg/resvg-js` as a devDependency (`npm install -D @resvg/resvg-js`) and confirm `package.json` and `package-lock.json` update
- [X] T002 [P] Ask the user for approval, then download Inter Regular and Bold TTF from the official Inter release (github.com/rsms/inter) and commit them, with the license, as `build/pagePreviews/fonts/Inter-Regular.ttf`, `build/pagePreviews/fonts/Inter-Bold.ttf`, and `build/pagePreviews/fonts/OFL.txt`
- [X] T003 [P] Create `build/pagePreviews/` and add `build/pagePreviews/plugin.ts` to the `include` array in `tsconfig.node.json`

---

## Phase 2: Foundational (Spike)

**Purpose**: Check the two risky assumptions from research R6 and R7a before building on them. These spikes block US3 only.

- [X] T004 Spike `runnerImport` from `vite`: in a throwaway script, load `src/pagePreviews/pages.ts` (or any `src` module that imports from `types`, `schemas/season`, and `data/seasons`) and confirm that the path aliases and TS enums resolve. If the aliases don't resolve, record the inline-config `resolve.alias` values needed in `build/pagePreviews/plugin.ts`. Delete the throwaway script afterward.
- [X] T005 [P] Spike resvg GIF decoding: render a small SVG that embeds `staticAssets/logos/1x/bos.gif` as a base64 `data:image/gif` `<image>` with `@resvg/resvg-js`, and look at the PNG. If it doesn't render, note that `cardSvg.ts` must use a PNG conversion of that logo, and add it as `build/pagePreviews/logos/bos.png` (convert with `sips -s format png`).

**Checkpoint**: Plugin approach confirmed. US3 can begin.

---

## Phase 3: User Story 1 - Clean, shareable page addresses (Priority: P1) 🎯 MVP

**Goal**: Every page lives at a plain path under `/nba-weekly-power-rankings/`, with no `#`. Back, Forward, and reload work. Tab titles name the page.

**Independent Test**: `npm run dev` (or the `preview` server in `.claude/launch.json` after `npm run build`). Open `/nba-weekly-power-rankings/2018-19`, `/nba-weekly-power-rankings/teamHistory/bos`, and a player page directly, then reload each. Navigate between pages and use Back and Forward. Check each tab title. (The dev and preview servers fall back to `index.html` for any path, so this works before US3.)

### Implementation for User Story 1

- [X] T006 [US1] In `src/App.tsx`, replace `createHashRouter(routes)` with `createBrowserRouter(routes, { basename })`. Compute `basename` as `import.meta.env.BASE_URL` with any trailing slash removed (giving `/nba-weekly-power-rankings`). Leave all `navigate('/' + …)`, `<Link to="/…">`, and `redirect('/' + latestSeason)` calls unchanged, because the basename prefixes them.
- [X] T007 [P] [US1] In `src/views/ChartView.tsx`, render a React 19 `<title>` reading `{season} · NBA Weekly Power Rankings`, using the `season` route param already read with `useParams`
- [X] T008 [P] [US1] In `src/views/TeamHistoryView.tsx`, render `<title>` reading `{getTeamName(team)} · NBA Weekly Power Rankings`
- [X] T009 [P] [US1] In `src/views/PlayerHistoryView.tsx`, render `<title>` reading `{playerHistory[0].player.name} · NBA Weekly Power Rankings` inside `PlayerHistoryContent` after the data resolves. Render the site name alone when the player isn't found.
- [X] T010 [US1] Add Vitest assertions in `src/App.test.tsx` and `src/views/PlayerHistoryView.test.tsx` (these use `renderWithRouter` from `src/test/renderWithRouter.tsx`) that `document.title` matches the season, team, and player formats above
- [X] T011 [US1] Run `npm run lint`, `npm test`, `npm run build`, and confirm the existing router tests still pass on `createMemoryRouter`. Then do the US1 Independent Test above in the browser pane.

**Checkpoint**: Plain addresses work locally. On GitHub Pages, deep links still need US3's entry files (or at least `404.html`), so don't deploy US1 alone. See the Dependencies section.

---

## Phase 4: User Story 2 - Old links keep working (Priority: P1)

**Goal**: Old `#/...` links open the matching page and the address changes to its plain form, with no extra history entry.

**Independent Test**: Open `/nba-weekly-power-rankings/#/2018-19`, `#/teamHistory/bos`, a `#/playerHistory/<id>`, and `#/1999-00`. Each lands on the same page as its plain address, the address bar shows the plain form, and Back doesn't return to the `#` form.

### Tests for User Story 2

- [X] T012 [P] [US2] Write `src/pagePreviews/legacyHash.test.ts` covering the LegacyAddress rules from data-model.md:
  - `<base>#/<rest>` becomes `<base><rest>`. Cases: `#/2018-19` → `/nba-weekly-power-rankings/2018-19`, `#/teamHistory/bos`, `#/playerHistory/jamesle01`.
  - "Any hash not starting with `#/`" is left unchanged (returns `null`). Cases: an empty hash, `#section`.
  - The search string is kept if one is present.

### Implementation for User Story 2

- [X] T013 [US2] Implement `legacyHashTarget(basename: string, hash: string, search: string): string | null` in `src/pagePreviews/legacyHash.ts`. It returns the plain address for a `#/` hash, or `null`.
- [X] T014 [US2] In `src/App.tsx`, before `createBrowserRouter`, call `legacyHashTarget(basename, window.location.hash, window.location.search)`. If it returns a value, call `window.history.replaceState(null, '', target)`. This runs at module scope, not in a `useEffect`.
- [X] T015 [US2] Do the US2 Independent Test in the browser pane against the dev server, including Back after a legacy redirect

**Checkpoint**: US1 + US2 are complete on the client.

---

## Phase 5: User Story 3 - Page-specific link previews (Priority: P2)

**Goal**: The build writes a static entry file for every address, plus `404.html` (contracts/build-output.md). Season and team files carry page-specific tags and 1200×630 title-card PNGs. Player files, the base address, and `404.html` keep the site-wide preview.

**Independent Test**: Run quickstart.md §2 (build output spot checks) and look at the PNGs. After deploy, run §4 in a public Open Graph checker: 3 seasons and 3 teams show their own cards, and 3 players show the site-wide preview.

### Tests for User Story 3

- [X] T016 [P] [US3] Write `src/pagePreviews/cards.test.ts` with small hand-built `Season`-shaped fixtures, covering the PreviewCard derivation in data-model.md:
  - A season with a `champion` gives "Champions: <name>" with the champion's logo and color.
  - A season without a champion gives "#1 in week <maxWeek>: <name>" with the neutral accent.
  - A team with 1 or more titles gives "N× champion since <first season>".
  - Otherwise, a team's deepest `PlayoffStage` gives "Best finish: <stage> (<season>)", using the earliest season it was reached.
  - Otherwise, it gives "Best final rank: #N (<season>)".
- [X] T017 [P] [US3] Write `src/pagePreviews/pages.test.ts`:
  - The page list has one entry per season, 30 team entries, and one entry per unique player ID across rosters.
  - Files are `<season>.html`, `teamHistory/<team>.html`, and `playerHistory/<id>.html`.
  - Player entries have `head: null`.
  - Player IDs not matching `/^[a-z]+\d{2}$/` are skipped.
  - `canonicalUrl` and `imageUrl` are absolute (`https://nathanemyers.github.io/nba-weekly-power-rankings/…`).
  - All `path` values are unique.
- [X] T018 [P] [US3] Write `src/pagePreviews/head.test.ts`. Given an HTML string shaped like `index.html`, `applyHead(html, head)` replaces the values of `<title>`, `meta[name=description]`, `og:title`, `og:description`, `og:url`, `og:image`, and `twitter:image`. It sets `og:image:width` to 1200 and `og:image:height` to 630. Each tag appears exactly once afterward, and every other line is unchanged.

### Implementation for User Story 3

- [X] T019 [P] [US3] Implement `src/pagePreviews/cards.ts`. Export a `PreviewCard` type (`file`, `heading`, `fact`, `accentColor`, `logo: Team | null`) and `seasonCard(season: Season)` / `teamCard(team: Team, seasons: Season[])` following research R8 and data-model.md. Use `Teams` for names and colors, and `PlayoffStage` for ordering. Card files are `previews/season-<name>.png` and `previews/team-<id>.png`.
- [X] T020 [P] [US3] Implement `src/pagePreviews/head.ts`. Export a `PageHead` type (`title`, `description`, `canonicalUrl`, `imageUrl`) and `applyHead(html: string, head: PageHead): string`, which edits the existing tags in `index.html` with targeted string replacement.
- [X] T021 [US3] Implement `src/pagePreviews/pages.ts`:
  - Export the `PageEntry` type (`kind`, `path`, `file`, `head: PageHead | null`).
  - Export `buildPages(seasons: Season[], origin: string, base: string): { pages: PageEntry[]; cards: PreviewCard[] }`.
  - Season descriptions read "Week-by-week power rankings for the <season> NBA season. <fact>." Team descriptions read "<team name>'s weekly power rankings and playoff results, season by season. <fact>."
  - Titles are "<page name> · NBA Weekly Power Rankings".
  - Export a `loadSeasonsForBuild()` that loads every season through `seasonLoaders` and `parseSeason` from `src/data/seasonData.ts`, skipping (and logging) seasons that fail validation.
  - Depends on T019 and T020.
- [X] T022 [US3] Implement `src/pagePreviews/cardSvg.ts`, exporting `cardSvg(card: PreviewCard, logoDataUri: string | null): string`. It builds a 1200×630 SVG with:
  - a `#1d1d1f` background and a band in the accent color
  - the heading in Inter Bold (large), the fact in Inter Regular, and the logo at the right
  - the footer "NBA Weekly Power Rankings"

  Keep text inside a 64px safe margin, and shrink heading text for long team names (e.g. "Minnesota Timberwolves").
- [X] T023 [US3] Implement `build/pagePreviews/plugin.ts`. It exports `pagePreviews(): Plugin` with `apply: 'build'`, and in `closeBundle`:
  1. Uses `runnerImport` (with aliases from T004 if needed) to load `src/pagePreviews/pages.ts` and `cardSvg.ts`. It declares a local minimal interface for them, not app-type imports.
  2. Reads `dist/index.html`.
  3. Writes `dist/404.html` as an identical copy.
  4. For each `PageEntry`, creates parent folders and writes `dist/<file>`, using `applyHead` for season and team entries and an unchanged copy for players.
  5. Renders each `PreviewCard` with `@resvg/resvg-js`. It uses `font.fontFiles` for the Inter TTFs and `loadSystemFonts: false`, embeds logos from `staticAssets/logos/1x/` (or the T005 PNG for Boston) as base64 data URIs, and writes `dist/<card.file>`.
  6. Logs the counts.

  A missing font or logo throws, which fails the build (contracts/build-output.md, "Failure behavior"). `SITE_ORIGIN` is `https://nathanemyers.github.io`, and `base` comes from the resolved Vite config.
- [X] T024 [US3] Register `pagePreviews()` in the `plugins` array of `vite.config.ts`
- [X] T025 [US3] Run `npm run build` and quickstart.md §2. Check that the file counts match contracts/build-output.md, that `diff dist/index.html dist/404.html` is empty, and that the `og:image` URLs are absolute. Open `dist/previews/season-2025-26.png` (Knicks champions), `season-2003-04.png`, `team-bos.png`, and `team-min.png` (long name) and fix any layout problems in `cardSvg.ts`.
- [X] T026 [US3] Confirm `npm run build` timing grows by no more than ~10 s, and note the total `dist/` size (expected about 18 MB, up from 8.8 MB)

**Checkpoint**: The build produces every entry file and card. Ready to deploy.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T027 [P] Run `npm run lint` and `npm test` and fix any failures in `src/pagePreviews/` and `build/pagePreviews/`
- [X] T028 Run quickstart.md §3 against the `preview` server in `.claude/launch.json`. Check: the base address redirect, a direct load plus reload of `/2018-19`, team and player pages, a legacy `#/2018-19`, an invalid `/1999-00`, and Back/Forward. Screenshot the results.
- [X] T029 [P] Update `README.md` (if it mentions hash URLs or `#/`) to describe the plain addresses and that `npm run build` generates entry pages and preview cards
- [ ] T030 After the user deploys, run quickstart.md §4. Check with an Open Graph checker, and confirm `curl -sI https://nathanemyers.github.io/nba-weekly-power-rankings/2018-19` returns `HTTP/2 200`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** and **Foundational (Phase 2)**: block US3 only.
- **US1 (Phase 3)**: no prerequisites. MVP.
- **US2 (Phase 4)**: T014 edits `src/App.tsx` after T006. T012 and T013 can run alongside US1.
- **US3 (Phase 5)**: needs Phases 1–2. It doesn't need US1 code to build, but it only makes sense with US1.
- **Polish (Phase 6)**: after the stories you're shipping.

### Deploy rule

- **Don't deploy US1 without at least `dist/404.html`.** On GitHub Pages, direct loads of plain addresses return the host's 404 until entry files exist.
- The safe deploy units are **US1 + US2 + US3 together**, or **US1 + US2 plus a minimal `404.html` copy** (T023 step 3 only) as an interim release.

### Within US3

T016–T018 (tests) → T019, T020 [P] → T021 → T022 → T023 → T024 → T025 → T026

### Parallel Opportunities

- T002 and T003 run alongside T001. T004 and T005 run in parallel.
- T007, T008, and T009 touch different views and run in parallel.
- T012 (and T013) run alongside US1.
- T016, T017, and T018 run in parallel. T019 and T020 run in parallel.

## Parallel Example: User Story 3

```text
Task: "T016 cards.test.ts"   Task: "T017 pages.test.ts"   Task: "T018 head.test.ts"
Task: "T019 cards.ts"        Task: "T020 head.ts"
```

## Implementation Strategy

### MVP

1. Phase 3 (US1) → test locally.
2. Phase 4 (US2) → test locally.
3. Don't deploy yet (see the deploy rule).

### Full delivery

1. Phases 1–2 spikes → Phase 5 (US3) → quickstart §2–3.
2. Deploy → quickstart §4.

### Notes

- Commit after each phase. Stop at each checkpoint to validate.
- Card colors in `cardSvg.ts` are the documented exception to "colors only in `src/index.css`".

## Implementation Notes (2026-11-12)

- **T004 finding**: Vite's module runner closes as soon as `runnerImport` returns, so dynamic imports made later fail. `src/pagePreviews/buildEntry.ts` therefore loads every season with top-level `await` and exports the loaded seasons. The runner uses `configFile: false` and `resolve.tsconfigPaths: true`, and the aliases resolve.
- **T005 finding**: resvg decodes the Boston GIF. It does **not** decode WebP, so the Wizards logo is a PNG copy at `build/pagePreviews/logos/was.png`.
- **Fact wording**: one title reads "Champions in <season>", and several read "N× champions since <first season>".
- **Heading wrap**: team names longer than 14 characters split into two lines at the space that gives the shortest longest line (e.g. "Portland / Trail Blazers").
- **T026**: `npm run build` went from about 7 s to about 15 s. `dist/` is 22 MB on disk (block-rounded). That includes 2,385 player entry files and 3.4 MB of cards.
- **T029**: README has no hash-URL references, so no change was needed.
- **T030**: pending. It needs a deploy.

## Revision: screenshots instead of title cards (2026-11-12)

At the user's request, the preview images are now screenshots of the pages (research R6, revised):
- Replaced `@resvg/resvg-js` with `playwright-core`, and removed `src/pagePreviews/cardSvg.ts`, the Inter fonts, and the PNG Wizards logo.
- `build/pagePreviews/plugin.ts` serves `dist/` with Vite's preview server and screenshots each season and team page in the installed Chrome (1200×630, dark mode, JPEG). The rest of the plugin is unchanged.
- `PreviewCard` is now `{ file, path, heading, fact }`, with images at `previews/*.jpg`. The headline facts still appear in the preview descriptions.
- `npm run build` takes about 28 s and needs Google Chrome installed. GitHub's Ubuntu runners include it.
