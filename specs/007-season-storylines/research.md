# Research: Season Storylines

Findings from the 2026-10-29 exploration (Pacers 2024-25 team storylines, league-wide 2024-25
season storylines, Hawks 2023-24 GDELT attempt) plus a review of the existing data pipeline.

## R1. Discovery tool form: Claude Code skill, not a Node script

- **Decision**: Discovery and categorization run as a project Claude Code skill
  (`.claude/skills/season-storylines/`), invoked by the maintainer in an interactive session.
  Deterministic rules (sources, dates, teams, coverage) are enforced by a separate Node
  validation script the skill must run before anything is finalized.
- **Rationale**: The work is judgment-heavy and varies by season: picking events out of
  weekly blurbs, deciding which teams a trade touches, spotting blockbusters, filtering recaps
  and fan-site posts, reconciling conflicting dates. A skill handles that flexibility and keeps
  the maintainer in the loop at every step (FR-007). It runs on the maintainer's Claude Code
  session rather than a script spending API tokens, so it does not reproduce the
  `build:summaries` cost problem called out in AGENTS.md. Pairing it with a script keeps
  FR-003/FR-005/FR-010–FR-013 from depending on the model following instructions.
- **Alternatives considered**: A Node script calling the Claude API (rejected: spends API
  tokens, and the review step would still need a separate UI). A purely mechanical script with
  no model (rejected: the exploration showed keyword search alone returns roughly half filler
  and misses events like the Dončić trade).

## R2. Search backend: Claude WebSearch + WebFetch

- **Decision**: The skill uses the `WebSearch` tool with `allowed_domains` set from the approved
  source list, and `WebFetch` to confirm an article's headline and publication date when the URL
  or search result does not make them clear.
- **Rationale**: 10/10 team events and 10/10 season events in the exploration returned relevant
  coverage from approved outlets. Anthropic's crawler honors robots rules (Principle IV).
- **Alternatives considered**: GDELT DOC API: good date-scoped results, but it rate-limited this
  IP to HTTP 429 for 15+ minutes after a handful of requests, which makes interactive use
  impractical. Kept as a possible future fallback; not used. Wikipedia team-season pages:
  reliable citations but mostly game recaps and transactions, not storylines.
- **Known limits**: WebSearch cannot date-filter, so wrong-season results appear (3/10 Pacers
  queries); the validator rejects out-of-window event dates. `apnews.com`, `indystar.com`, and
  `theathletic.com` refuse Anthropic's crawler and cannot be approved sources; some Athletic
  pieces are syndicated on nba.com.

## R3. Discovery guidance

- **Decision**: The skill builds a guidance list per season from, in order:
  1. Season-in-review articles from approved sources (primary guide for season storylines).
  2. Playoff results from `playoffSeries` / `playoffs` in the processed season file (FR-011;
     every playoff team gets a playoff-run topic).
  3. Season awards already in the processed roster data.
  4. Each team's weekly blurbs in `rankings` (primary guide for team storylines, FR-006).
  5. Themes recurring across many teams' blurbs (NBA Cup, trade deadline).
  6. Lottery and draft results for the draft following the Finals (FR-012).
- **Rationale**: The weekly blurbs stop at the regular season and miss the defining playoff
  stories; cross-team theme counts undercount single huge events (Dončić trade appeared in only
  3 teams' blurbs). Retrospectives named nearly every major season storyline in one search.
- **Alternatives considered**: Blurbs only (rejected for the reasons above).

## R4. Approved sources: domain allowlist plus path rules

- **Decision**: `scripts/storylines/sources.json` lists approved publishers, each with domains
  and optional `excludePaths` patterns. Initial list: ESPN, NBA.com (includes team sites under
  `nba.com/<team>`), The Ringer, CBS Sports, Sports Illustrated, Bleacher Report, Yahoo Sports,
  plus SB Nation / independent team blogs the maintainer approves case by case. Initial
  exclusions: `/recap`, `/boxscore`, `/game/`, `/watch/`, `/fantasy/`, `/betting/`, `/onsi/`.
- **Rationale**: In the Pacers run, si.com's FanNation "On SI" posts filled 9 of 10 results for
  one query, and box scores and recaps filled many others. Domain-only approval would let them
  through (SC-004 would pass on paper but the list would be noisy).
- **Alternatives considered**: Domain-only allowlist (rejected: too coarse). Per-URL approval
  (rejected: review burden).

## R5. Season window dates

- **Decision**: `scripts/storylines/draft-dates.json` maps each draft year to its final night's
  date. A season `YYYY-YY` covers the day after the `YYYY` draft through the `YYYY+1` draft
  inclusive (2024-25: 2024-06-28 → 2025-06-26). Each storyline records an `eventDate`, which must
  fall in the window; the article's `publishedAt` may fall shortly after (retrospectives).
- **Rationale**: FR-012 is about when the event happened, not when it was written about. Draft
  dates are not in any existing data source, and there are only ~25 of them; a checked-in table
  is simpler than scraping.
- **Alternatives considered**: Deriving from Finals dates (rejected: the lottery and draft come
  after the Finals and belong to the earlier season).

## R6. Storage layout and immutability

- **Decision**: Candidates (raw search output plus review status) live in
  `data/raw/storylines/<season>.json`. The finalized list lives in
  `data/processed/storylines/<season>.json`. `scripts/build-rankings.mjs` merges the finalized
  list into `data/processed/seasons/<season>.json` as `storylines`, mirroring how `summaries`
  are merged today.
- **Rationale**: Matches Principle IV (raw scraped inputs under `data/raw/`, app reads only
  `data/processed/`). Existence of the processed file is the "finalized" signal (spec: a list
  "does not exist until the maintainer finalizes it"). The skill never writes to an existing
  processed file unless the maintainer explicitly asks to revise that season, and the validator
  in `--finalize` mode refuses to overwrite one without `--revise` (FR-003, SC-002).
- **Alternatives considered**: A `finalized: true` flag inside one file (rejected: easier to
  accidentally rewrite during a later discovery run).

## R7. Visitor-facing placement

- **Decision**: Team storylines appear in the existing Summary tab under the AI summary when one
  team is pinned (Summary becomes available if either exists). Season storylines get a new
  "Storylines" detail tab, first in the unpinned order and last in the pinned order. A storyline
  tied to teams and marked as a season storyline appears in both places.
- **Rationale**: Reuses `DetailTabs` availability logic, so seasons without finalized lists
  simply have no tab (FR-002, SC-005). Keeps storylines alongside, not replacing, AI summaries.
- **Alternatives considered**: A separate route per season (rejected: more navigation for a
  short list).

## R8. Review workflow

- **Decision**: The skill reviews in batches: season storylines first, then one team at a time.
  For each batch it presents candidates as a table and records include/exclude/edit decisions in
  the raw candidates file as it goes, so a session can stop and resume.
- **Rationale**: A full season is roughly 30 teams × 5–8 storylines plus ~10 season storylines;
  one giant review would not fit a session or a person's attention.
