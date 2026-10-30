This is an interactive chart of the Weekly NBA Power Rankings

# [See it in action!](https://nathanemyers.github.io/nba-weekly-power-rankings/)

## Setup

To run locally:

```bash
npm install
npm run dev
```

## Styling

The site is styled with Tailwind CSS and shadcn/ui, and every color is defined in `src/index.css`. See [docs/styling.md](docs/styling.md) for how to change the look or add a component.

## Refreshing data

After new weekly articles have been scraped into `data/raw/nba/`:

```bash
npm run build:summaries
npm run build:rankings
```

`build:summaries` writes one AI-generated summary per team per season to `data/processed/summaries/`, using the Anthropic API. It needs `ANTHROPIC_API_KEY` in the environment; `SUMMARY_MODEL` overrides the model (default `claude-sonnet-5-5`). Seasons that already have a champion in `data/raw/basketball-reference/playoffs.json` are generated once and never rewritten; the active season is regenerated only for teams whose weekly write-ups changed. Add `--dry-run` to see what would be generated without calling the API, or `--season 2024-25` to limit the run.

`build:rankings` then rebuilds the app data under `data/processed/seasons/`, including the summaries. Neither step runs during deploy, so commit the results.

Raw data lives in one folder per source. `npm run scrape:powerRankings` fills `data/raw/nba/` from NBA.com, `npm run scrape:playoffs` fills `data/raw/basketball-reference/`, and `npm run scrape:espnPowerRankings` fills `data/raw/espn/` with ESPN's 2003-04 to 2015-16 rankings. `scrape:playoffs` also stores each series' score, which the playoff series badges show, and re-fetches any saved season that doesn't have scores yet. `npm run scrape:rosters` fills `data/raw/basketball-reference/rosters/` with each season's regular-season player stats and head coaches for the roster pane; it skips saved seasons, `-- --season 2025-26` re-fetches one season, and `-- --force` re-fetches all of them.

## Storylines

Completed seasons can have curated storylines: links to articles about each team's season, plus featured league-wide storylines that show in the Storylines tab. They are gathered with the `season-storylines` Claude Code skill, which the maintainer runs by hand (never in CI):

```text
/season-storylines 2024-25 discover   # search approved sources, save candidates
/season-storylines 2024-25 review     # include or exclude candidates in batches
/season-storylines 2024-25 finalize   # write the static list and rebuild the season
```

Instead of the skill's `review` phase, you can review candidates with the internal review tool, which is separate from the site and never built or deployed: run `npm run review:storylines` and open `http://127.0.0.1:5180`. It shows per-team coverage (playoff teams missing a playoff storyline are outlined in red), and lets you include or exclude each candidate, mark season storylines, and edit teams, kind, title, and event date. Save writes the raw file and shows `check:storylines` failures. The tool lives in `tools/storyline-review/`. Selecting a team or the Season tile shows a **Find more** button, which runs the skill's `more` phase headless through the `claude` CLI (it uses whatever that CLI is signed in with, normally your Claude subscription, and is capped per run) and adds what it finds as pending candidates.

Candidates live in `data/raw/storylines/<season>.json` and the finalized list in `data/processed/storylines/<season>.json`, which `build:rankings` merges into the season file. `npm run check:storylines -- <season>` checks candidates against the approved sources in `scripts/storylines/sources.json`, the season's draft-to-draft window in `scripts/storylines/draft-dates.json`, and the team rules; with `--finalize` it also requires a playoff storyline for every playoff team and refuses to overwrite a finalized season unless `--revise` is passed.
