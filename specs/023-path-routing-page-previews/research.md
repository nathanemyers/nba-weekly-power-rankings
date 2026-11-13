# Research: Path-Based Addresses and Per-Page Link Previews

## R1. Router type

- **Decision**: Replace `createHashRouter(routes)` in `src/App.tsx` with `createBrowserRouter(routes, { basename })`. Set `basename` to `import.meta.env.BASE_URL` with the trailing slash removed (`/nba-weekly-power-rankings`).
- **Rationale**: Every in-app link and `navigate()` call already uses root-relative paths (`'/' + season`, `'/teamHistory/' + team`, `'/playerHistory/' + id`), and the route loaders `redirect('/' + latestSeason)`. With a `basename`, React Router adds the sub-path to all of these, so no link code changes. Tests use `createMemoryRouter` in `src/test/renderWithRouter.tsx` and are unaffected.
- **Alternatives considered**: Keeping the hash router and generating preview pages at hash-free "share" addresses that redirect into the app. Rejected because it leaves two address forms and doesn't meet FR-001.

## R2. Serving deep links from GitHub Pages without rewrites

- **Decision**: After the Vite build, write one HTML entry file for each known address, using the extensionless-`.html` form:
  - `dist/<season>.html` for each season in the season index
  - `dist/teamHistory/<team>.html` for each of the 30 teams
  - `dist/playerHistory/<id>.html` for each player in any season's rosters
  - `dist/404.html` as the fallback for unknown addresses

  Each file is a copy of the built `dist/index.html` with its preview tags replaced. The base address keeps `dist/index.html`.
- **Rationale**: GitHub Pages serves `/foo/bar` from `foo/bar.html` with a 200 response and no redirect. The alternative layout, `foo/bar/index.html`, makes Pages redirect `/foo/bar` to `/foo/bar/`. That adds a hop and changes the address shown in previews. Vite emits absolute asset URLs under the configured base, so a copy of `index.html` works at any folder depth. Pages serves `404.html` for any unknown path, which boots the app at the requested address. That meets FR-007 and the amended constitution's Principle III.
- **Alternatives considered**:
  - **`404.html` fallback only**: player and season pages would return HTTP 404. Link-preview services and search engines treat that as broken. That violates Principle III ("addresses that need … a successful response MUST have an entry page").
  - **The `spa-github-pages` redirect trick** (encode the path into a query string, then decode it): adds a visible redirect, and previews still come from the 404 page.
  - **Pre-rendering the full app HTML**: not needed. Previews only read `<head>`, and the app renders on the client.

## R3. Player entry pages

- **Decision**: Generate player entry files (R2), but give them the unchanged site-wide `<head>`. That means the site-wide title, description, `sitePreview.png`, and a canonical URL of the site root.
- **Rationale**: The spec (FR-012) says player pages show the site-wide preview. A real file gives a 200 response, so services render that preview instead of treating the link as broken. About 2,400 files × ~2.5 KB comes to roughly 6 MB, well inside GitHub Pages limits (1 GB per site). Writing them takes well under a second.
- **Alternatives considered**: Letting player pages fall through to `404.html`. Rejected because some preview services drop or degrade previews for 404 responses, so FR-012 couldn't be guaranteed.

## R4. Old `#/...` links

- **Decision**: In `src/App.tsx`, before the router is created, check whether `window.location.hash` starts with `#/`. If it does, call `history.replaceState(null, '', basename + hash.slice(1))`. The router then starts at the plain address.
- **Rationale**: Old links always load `index.html`, because the hash is never sent to the server. So this one check covers every legacy address. `replaceState` adds no history entry (FR-006). Unknown legacy targets then go through the same loader and not-found handling as plain addresses (Story 2, scenario 3). It needs no `useEffect`, consistent with AGENTS.md.
- **Alternatives considered**: A catch-all route that reads the hash. Rejected because it's more code and runs after the router has already matched `/`.

## R5. Browser tab titles

- **Decision**: Each view renders a React 19 `<title>` element: `ChartView` ("2018-19 · NBA Weekly Power Rankings"), `TeamHistoryView` ("Boston Celtics · NBA Weekly Power Rankings"), `PlayerHistoryView` (player name · site name). React moves it into `<head>`.
- **Rationale**: Built into React 19 (the project uses ^19.2.8), with no effect hook or new dependency.
- **Alternatives considered**: `useEffect(() => { document.title = … })` (discouraged by AGENTS.md), or React Router `meta` exports (framework mode only, not data-router mode).

## R6. Rendering preview images without a browser

- **Decision**: Build each card as an SVG string from a TypeScript template function, then rasterize it to a 1200×630 PNG with `@resvg/resvg-js` (a new **devDependency**). Text uses a font file committed to the repo (Inter, SIL Open Font License, Regular and Bold TTF, with the license file next to them) loaded through resvg's `fontFiles` option, with system fonts turned off. Team logos are embedded as base64 data URIs read from `staticAssets/logos/1x/`.
- **Rationale**: The user chose designed title cards, not screenshots (spec clarification). resvg is a single prebuilt native package with no browser and no system font dependency. Committing the font makes output identical on macOS and the Ubuntu CI runner (Principle II: reproducible, no network at build). It's dev-only and never reaches the client bundle (constitution: dev dependencies are judged separately).
- **Alternatives considered**:
  - **Playwright or Puppeteer screenshots**: needs a headless browser in CI and goes against the chosen card style.
  - **`satori` + resvg**: adds a layout engine that a fixed card layout doesn't need.
  - **`node-canvas`**: native build dependencies (Cairo) on CI.
  - **System fonts**: CI fonts differ from local, and the site's `system-ui` stack can't be pinned.
- **Risk**: `bos.gif` is the one non-PNG logo. resvg decodes GIF images in `<image>`. If a rendering check shows otherwise, convert that one logo to PNG for the card generator only.

## R7. Where generation runs

- **Decision**: A Vite plugin (`build/pagePreviews/plugin.ts`, registered in `vite.config.ts`, `apply: 'build'`) runs in `closeBundle`. It reads the built `dist/index.html`, the season JSON from `data/processed/seasons/`, and writes the entry files (R2) and the card PNGs to `dist/previews/`. Nothing it generates is committed.
- **Rationale**: `npm run build` stays the single command that produces a deployable `dist/` (constitution, Hosting constraints). The deploy workflow needs no changes. Generated images are build output, not data, so Principle II's "commit derived data" doesn't apply. Rendering 53 PNGs with resvg takes a few seconds.
- **Alternatives considered**:
  - **A separate `scripts/build-previews.mjs` run after `vite build`**: an extra step to remember, and it duplicates the base-path config.
  - **Committing the PNGs**: about 53 binary files churn on every data refresh.

## R7a. Sharing app types with the build plugin

- **Decision**: Split the work in two:
  - **Page logic** (page list, titles, descriptions, headline facts, `<head>` rewriting, legacy-hash conversion) lives in `src/pagePreviews/`. It's part of the app TypeScript project and can import `Teams`, the `Team` and `PlayoffStage` enums, and the Zod schemas through the existing aliases.
  - **Build wiring** lives in `build/pagePreviews/plugin.ts`, which is part of the `tsconfig.node.json` project. It loads the page logic at build time with Vite's `runnerImport()`. It handles file I/O and resvg only, and declares its own minimal interface for the loaded module instead of importing app types.
- **Rationale**: `tsconfig.node.json` sets `erasableSyntaxOnly`, so importing `src/types/nba.ts` (which uses enums) into the config project would fail `tsc -b`. `runnerImport` runs the module through Vite's own transform, so enums and path aliases work at build time without a second copy of the team list.
- **Alternatives considered**:
  - **Duplicating team names and colors into a JSON file**: two sources of truth.
  - **Converting the enums to const objects**: a broad, unrelated refactor.
- **Verify early**: confirm `runnerImport` resolves the app's path aliases (`types`, `schemas/*`, `data/*`). If it doesn't, pass the aliases explicitly in its inline config.

## R8. Card content and headline facts

- **Decision**:
  - **Season card**: big text is the season name ("2018-19"). If the season has a champion, the fact is "Champions: Toronto Raptors", with that team's logo and its `color` from `Teams` as the accent. If not, the fact is "#1 in week N: Team", using the site's neutral accent and the #1 team's logo.
  - **Team card**: the team's full name and logo, with the team's `color` as the accent. The fact is the first that applies from this list:
    1. "N× champion since <first season>"
    2. "Best finish: <stage> (<season>)", using the deepest `PlayoffStage` reached
    3. "Best final rank: #N (<season>)"
  - Every card shows "NBA Weekly Power Rankings" as a footer.
  - Card colors are defined in the generator, not in `src/index.css`. AGENTS.md's "colors only in index.css" rule covers app components, and team colors are the stated exception.
- **Rationale**: Matches FR-013 and the "Season in progress" edge case. All facts come from fields that already exist (`seasonIndex[].champion`, `playoffs`, `rankings`).
- **Alternatives considered**: Showing a mini chart on the card. Rejected because it's unreadable at thumbnail size and more rendering work.

## R9. Preview tags and canonical addresses

- **Decision**: The plugin replaces the `<title>`, `description`, `og:title`, `og:description`, `og:url`, `og:image` (+ width/height = 1200/630), and `twitter:image` values in each season and team entry file. URLs are absolute, built from a `SITE_ORIGIN` constant (`https://nathanemyers.github.io`) plus Vite's `base`. The site-wide tags already in `index.html` stay the source for the base address, player pages, and `404.html`.
- **Rationale**: Preview services need absolute image URLs. Deriving the path from `base` keeps the sub-path in one place (Principle III).
- **Alternatives considered**: Templating `index.html` with placeholders. Rejected because it makes `index.html` invalid for the dev server and for the site-wide default.

## R10. Testing approach

- **Decision**:
  - Unit-test the pure parts with Vitest: the page list builder (seasons, teams, players → paths, titles, descriptions, facts), the `<head>` rewriting function, and the legacy-hash conversion.
  - Keep the existing router tests on `createMemoryRouter`.
  - Check the deploy shape manually with `npm run build` + a static server and a preview checker (see quickstart.md).
- **Rationale**: These functions decide correctness (FR-009–FR-016). PNG pixels are checked by eye.
