# Quickstart: Validate the Two-Column Team History Page

## Automated

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

The tests should cover:

- `getTopPlayersByMinutes`: ordering by `g × mpg`, alphabetical tie-break, a cap of 6, fewer than 6 players, and a missing roster.
- `TeamHistory` desktop (default, since the test `matchMedia` reports no match): the `Seasons` navigation, the first entry with `aria-current`, the top-player links, the "View … chart" link, and no "AI-generated summary".
- `TeamHistory` narrow (override `matchMedia` so `(max-width: 1023.98px)` matches): the accordion headers start collapsed, clicking one shows that season's storylines and top players, and clicking it again hides them.

jsdom has no layout, so scroll-spy geometry is checked by hand below.

## Manual (dev server, built-in browser)

1. Start the dev server and open `#/teamHistory/bos`.
2. **Desktop, 1280px wide**
   - Two columns scroll independently; the header stays put.
   - Each left entry shows the season name, minimap and playoff badges. No AI summary appears anywhere.
   - Each right section shows storylines, up to 6 player links and a "View season chart" link.
   - Click a mid-list season: the right column smooth-scrolls it to the top. The highlight goes straight to it with no flicker through the seasons in between.
   - Click the last season: it stays highlighted even though it can't reach the top.
   - Scroll the right column slowly: the highlight follows. Scroll far enough that the highlighted entry would be off the left column's view: the left column nudges just enough to show it.
   - Turn on reduced motion (macOS Accessibility › Display › Reduce motion): clicks jump instead of animating.
   - Hovering or clicking a playoff badge shows its tooltip and doesn't select the season.
   - Click a player link → player history page. Click "View season chart" → that season's chart with the team pinned.
3. **Narrow, 375px wide (mobile preset)**
   - Only overviews are shown, all collapsed; one page scroll; no horizontal scroll.
   - Tap a season: its detail opens below. Tap again: it closes. Two seasons can be open at once.
4. Check a season with no storylines and an in-progress season: the right note appears and the section still renders.
5. `npm run preview` under the configured base path: the route and links still work.
