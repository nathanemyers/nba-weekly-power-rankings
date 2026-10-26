# Research: Playoff Series Badges

Findings come from the existing `data/raw/basketball-reference/playoffs.json` and from two Basketball-Reference season pages, 2005-06 and 2020-21, fetched on 2026-10-26 with the project user agent. No unknowns from the Technical Context remain.

## 1. Where the series scores come from

- **Decision**: Read the "all_all_playoffs" series table on the same season page the playoffs scraper already fetches (`/playoffs/NBA_<endYear>.html`). Each series row's second cell reads `<a …>Miami Heat</a> over <a …>Dallas Mavericks</a> &nbsp;(4-2)`, with the round in the first cell (`<strong>Finals</strong>`).
- **Rationale**: The page is already fetched, so there's no new source and no extra requests per season. Both sampled seasons list exactly 15 series rows. The score is always winner first.
- **Round labels**: `Finals`, `Eastern Conference Finals`, `Western Conference Finals`, `Eastern Conference Semifinals`, `Western Conference Semifinals`, `Eastern Conference First Round` and `Western Conference First Round`. These map to the existing stages `finals`, `conf-finals`, `semis` and `first-round`.
- **Alternatives considered**:
  - Per-series pages (`/playoffs/2006-nba-finals-heat-vs-mavericks.html`): 15 times as many requests.
  - Counting game rows in the same table: works, but the "(4-2)" text is simpler and already summarised.

## 2. Play-in games

- **Decision**: Nothing to filter. The series table has no play-in rows: 2020-21 has 15 series rows and no "Play-In" text on the page.
- **Rationale**: Play-in games aren't on the playoffs page, so they can't produce series (FR-009). Play-in teams that lost never appear in the bracket, so they get no badges.

## 3. Upgrading seasons that were saved without scores

- **Decision**: The scraper counts a saved season as complete only if every series has `winnerWins` and `loserWins`. Seasons missing them are fetched again on the next normal run, with no `--force` needed.
- **Rationale**: FR-002. One run upgrades all 23 saved seasons: 23 requests at the scraper's existing 3-second spacing, about 70 seconds. After that, runs only fetch new seasons, as they do today.

## 4. Matching scores to the bracket

- **Decision**: Keep parsing the menu bracket for rounds and teams, as now. Then attach each score by matching the unordered team pair within the same stage of the series table. If any bracket series has no matching score row, or the table's winner disagrees with the bracket's winner, parsing fails with an error naming the season and teams.
- **Rationale**: This reuses proven parsing, and the existing `winner` logic stays the source of truth. A disagreement would mean a parsing bug, so it should stop the scrape loudly.
- **Alternatives considered**: Replacing the bracket parse with the series table alone. That's possible, but it changes how today's data is produced, which risks the "existing results unchanged" guarantee (FR-010).

## 5. Making the parser testable

- **Decision**: Move `parseSeason`, `SLUG_BY_NAME` and the new score parsing out of `scripts/scrape-playoffs.mjs` (which runs on import) into `scripts/lib/playoffs.mjs`. The scraper becomes a thin loop that imports them. Also put the build-time logic that turns a bracket into per-team runs (`teamPlayoffRuns`) in the same module, so it can be tested.
- **Rationale**: Vitest can't import a script with top-level fetches. `scripts/lib/` already holds shared, tested script modules (`articles.mjs`, `summary-plan.mjs`, `http.mjs`).

## 6. Badge details on hover, focus and screen readers

- **Decision**: Add shadcn/ui's `tooltip` component (`npx shadcn@latest add tooltip`). Each badge is a focusable trigger whose `aria-label` holds the full result, e.g. "Conference finals: beat Toronto Raptors 4-2". The tooltip shows the same text on hover and keyboard focus.
- **Rationale**: FR-007 needs the text on hover, focus and screen readers. A `title` attribute doesn't show on focus, and `hover-card` (used for the AI summary) is too heavy for four small badges. AGENTS.md says to add shadcn components with the CLI and not hand-roll them.
- **Note**: The tooltip needs a `TooltipProvider`. Add it once around the app in `src/App.tsx`, not per badge.

## 7. Colours

- **Decision**: Add two theme roles in `src/index.css`, `--series-won` and `--series-lost`, starting from the same values as `--rank-up` (`#30d158`) and `--rank-down` (`#ff5a50`). Expose them as `--color-series-won` and `--color-series-lost`. Style badges with a tinted background and a solid border in that colour, e.g. `border-series-won bg-series-won/15`, and keep the text in the normal foreground colour for contrast. Document both roles in `docs/styling.md`.
- **Rationale**: AGENTS.md: colours live only in `src/index.css`. Separate roles let series colours change without changing rank-trend colours. The site has a single dark theme, so a tinted background with light text stays readable (FR-006).

## 8. Medals

- **Decision**: Reuse `PLAYOFF_MEDALS` icons from `src/components/Chart/utils.ts`. A series in a round uses the icon of the stage with the same name (first-round 🥉, semis 🥈, conf-finals 🥇, finals 🏆). A won Finals uses the champion icon 👑.
- **Rationale**: The badges then match the chart's existing medal language. The last badge's icon equals the team's existing playoff medal in every case (SC-002): a team eliminated in round R gets R's icon on a red badge, and the champion's last badge is the crown.

## 9. Where badges go

- **Chart view**: next to the "Team History" button in the centre of the header grid. Both are only shown when exactly one team is pinned, so they appear and disappear together. Below `md` the grid stacks, so the badges get their own full-width row.
- **Team history**: on each season card, in the header row with the source badge.
- **Card clicks**: tooltip triggers stop click propagation, like `DataSourceBadge`, so clicking a badge doesn't switch to the chart (US1 scenario 7).
