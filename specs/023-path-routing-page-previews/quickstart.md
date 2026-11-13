# Quickstart: Validate Path Routing and Page Previews

## Prerequisites

- `npm ci`
- Do **not** run `npm run build:summaries` (it spends API tokens).

## 1. Automated checks

```bash
npm run lint
npm test
npm run build
```

Expected: everything passes. `dist/` matches [contracts/build-output.md](contracts/build-output.md).

## 2. Build output spot checks

```bash
ls dist/2018-19.html dist/teamHistory/bos.html dist/404.html dist/previews | head
ls dist/playerHistory | wc -l
grep -E 'og:(title|image)' dist/2018-19.html dist/teamHistory/bos.html
diff dist/index.html dist/404.html && echo "404 matches index"
```

Expected:
- One season file per season and 30 team files.
- The player file count is about 2,400.
- The `og:image` values are absolute URLs that point to `previews/…png`.
- `404.html` is identical to `index.html`.

Open a few of the `dist/previews/*.png` files and confirm:
- They're 1200×630.
- The text is legible.
- The team card uses the team's color and logo.
- The 2025-26 season card shows the Knicks as champions.

## 3. Navigation under the sub-path

Start the `preview` server in `.claude/launch.json` (`npm run preview`). It serves the build under `/nba-weekly-power-rankings/`. Then, in a fresh tab:

| Open | Expect |
|------|--------|
| `/nba-weekly-power-rankings/` | Latest season chart. The address names the season. |
| `/nba-weekly-power-rankings/2018-19`, then reload | 2018-19 chart both times |
| `/nba-weekly-power-rankings/teamHistory/bos` | Celtics history. Tab title names the Celtics. |
| A player link from a roster | Player page with a plain address. Tab title names the player. |
| `/nba-weekly-power-rankings/#/2018-19` | 2018-19 chart. The address becomes `/nba-weekly-power-rankings/2018-19`. Back doesn't return to the `#` form. |
| `/nba-weekly-power-rankings/1999-00` | Same handling as today's invalid season, with no bare host error |

Then use Back and Forward across several pages.

## 4. After deploy: link previews

Paste these into a public Open Graph checker (e.g. opengraph.xyz):

- 3 season addresses and 3 team addresses: each shows its own title, description, and card image.
- 3 player addresses and the base address: each shows the site-wide title, description, and `sitePreview.png`.

On the live site, confirm `/nba-weekly-power-rankings/2018-19` returns HTTP 200 with no redirect:

```bash
curl -sI https://nathanemyers.github.io/nba-weekly-power-rankings/2018-19 | head -1
```
