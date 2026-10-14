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

After new weekly articles have been scraped into `data/raw/`:

```bash
npm run build:summaries
npm run build:rankings
```

`build:summaries` writes one AI-generated summary per team per season to `data/processed/summaries/`, using the Anthropic API. It needs `ANTHROPIC_API_KEY` in the environment; `SUMMARY_MODEL` overrides the model (default `claude-sonnet-5-5`). Seasons that already have a champion in `data/raw/playoffs.json` are generated once and never rewritten; the active season is regenerated only for teams whose weekly write-ups changed. Add `--dry-run` to see what would be generated without calling the API, or `--season 2024-25` to limit the run.

`build:rankings` then rebuilds the app data under `data/processed/seasons/`, including the summaries. Neither step runs during deploy, so commit the results.
