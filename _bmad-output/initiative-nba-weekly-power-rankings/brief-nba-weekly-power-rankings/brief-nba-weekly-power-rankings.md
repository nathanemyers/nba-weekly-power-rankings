---
title: NBA weekly power rankings
status: draft
created: 2026-10-06
updated: 2026-10-07
---

# NBA weekly power rankings

## Purpose

A personal data visualization of NBA weekly power rankings across seasons. It shows how each team's ranking moved week by week, lets me look back at past seasons, and surfaces the teams whose rankings told the most interesting story.

For now it is for me alone. Public polish is out of scope.

## The main chart

All teams on one chart by week. Clicking a team highlights its line against the rest. The default view stays at week 1 for every season, including past ones. That's the current behavior, and it won't change.

## Arcs to watch

A separate panel, not part of the main chart, listing the teams with the most interesting movement.

- **Large move:** a net change of at least 5 spots over a rolling 4-week window.
- **Trend:** the team moved in the same direction for at least 3 consecutive weeks.

Both thresholds are confirmed for now and expected to be tuned. Keep them as settings, not hard-coded values.

**Out of scope for now:** surprise against preseason expectations. The repo has no preseason data.

## Weekly update

A scheduled job, with no manual step during the season. Each run:

1. Fetches new weekly power-ranking articles.
2. Adds them to `data/articles/<season>/` and the index.
3. Rebuilds `src/data/seasons/*.json` with `npm run build:rankings`.
4. Commits the result, so the deployed chart picks it up.
5. Fails loudly if no new article is found, or if the article's structure changes, so a silent gap doesn't go unnoticed. This only applies within the regular-season window — the off-season and All-Star break are expected gaps, not failures. See the architecture spine's AD-2 for how that window is determined.

The repo has no article scraper yet; model the weekly fetch on the existing playoffs scraper, which spaces requests and sets a user agent.

Checked before building: nba.com's `robots.txt` allows the fetch, and its terms of use are confirmed fine.

## Running and hosting

Everything runs on free GitHub services, with no paid hosting.

- **The weekly job** runs as a scheduled GitHub Action. A weekly run uses a few minutes of Actions time.
- **The chart** is static, so it can be served from GitHub Pages.

The repo is public, so GitHub Pages and Actions are both free here.

The chart moves to a GitHub Pages address. The current `nathanemyers.com/projects/nba-power-rankings` URL isn't kept, so any link to it must be updated by hand.

Project Pages serves the site from a subpath, so Vite needs `base` set to the repo name. Not yet configured.
