# Research: Team AI Season Summary

## 1. Where generation runs

- **Decision**: A new local script, `npm run build:summaries`, run by the maintainer after each weekly scrape and before `npm run build:rankings`.
- **Rationale**: Constitution II forbids runtime third-party calls; the article scraper itself is not in this repository, so "on each weekly scrape" is implemented as the next step in the same manual refresh routine. Keeping it out of the deploy workflow means CI needs no API key.
- **Alternatives considered**: Calling the LLM inside `build-rankings.mjs` (makes a pure, offline, deterministic step need a network and a key); a scheduled GitHub Action (adds a repository secret and auto-commits; can be layered on later without changing the script).

## 2. Source text

- **Decision**: Feed the model each week's full `summaryText` for that team from `data/articles/`, in week order, labeled with week, rank and record. Nothing else.
- **Rationale**: FR-008 limits input to the team's own weekly summaries. The app's 260-character blurbs are truncated for tooltips and lose most of the narrative.
- **Alternatives considered**: The truncated blurbs in `src/data/seasons/` (poorer summaries); adding playoff results (violates FR-008).

## 3. Shared article reading

- **Decision**: Extract the "index -> season -> week -> team entry" walk, including its de-duplication rules, from `build-rankings.mjs` into `scripts/lib/articles.mjs` and use it from both scripts.
- **Rationale**: The summary must cover exactly the weeks the chart shows; two copies of the dedupe rules would drift.

## 4. Active vs complete season

- **Decision**: A season is complete when `data/playoffs.json` has a `champion` for it; otherwise it is active.
- **Rationale**: This is the notion the app already uses for postseason data, as the spec's assumption requires, and it is unambiguous. Today 2017-18 through 2025-26 are complete.
- **Alternatives considered**: "Not the newest season" (wrong during the offseason gap); a date cutoff (needs a maintained calendar).

## 5. When to regenerate

- **Decision**: Store a SHA-256 of the exact prompt input with each summary. Rules, per team and season:
  1. No weekly entries: generate nothing and remove nothing.
  2. Complete season with a stored summary: skip, always.
  3. Complete season without one: generate once.
  4. Active season: generate when there is no stored summary or the stored hash differs.
- **Rationale**: Rule 2 gives the byte-for-byte guarantee of SC-004. Rule 4 implements the edge case "only regenerated if its underlying weekly summaries actually changed". A season that completes between runs gets one last hash-driven refresh while still active and is locked from then on.
- **Alternatives considered**: Comparing week counts (misses corrected re-scrapes); a `--force` flag (would make it easy to break SC-004; a maintainer can delete an entry deliberately instead).

## 6. Storage and bundling

- **Decision**: `data/summaries/<season>.json` keeps text plus provenance. `build-rankings.mjs` copies only the text into `src/data/seasons/<season>.json` as `summaries: { [teamId]: string }`.
- **Rationale**: `build-rankings.mjs` deletes and rewrites `src/data/seasons/` on every run, so generated text cannot live only there. The app needs no provenance, and it already loads each season file statically, so no loading state is introduced.
- **Alternatives considered**: A lazily imported summaries chunk behind `Suspense` (saves about 150 KB of a 2.2 MB bundle at the cost of async UI; revisit with bundle splitting generally).

## 7. Model and prompt

- **Decision**: Anthropic Messages API via `@anthropic-ai/sdk`; model from `SUMMARY_MODEL`, default `claude-sonnet-5-5`; one request per team-season; fixed system prompt asking for one neutral paragraph of 80–120 words, past tense for complete seasons and present for the active one, using only the supplied text, no preamble.
- **Rationale**: Sonnet is a deliberate cost choice for this small summarizing task, and the full nine-season backfill was generated with it; `SUMMARY_MODEL=claude-opus-5-5` or `claude-haiku-5-5` overrides it. Effort is set to `low`, and the server-side refusal fallback is enabled on models that support it. The model that actually answered is recorded in provenance.
- **Failure handling**: Each season file is rewritten after every successful team, so an interrupted run resumes where it stopped. A team whose request fails or whose summary is rejected makes the script exit non-zero after attempting the rest; missing or rejected credentials stop the run at once, leaving earlier stored summaries intact. An empty or over-long response counts as a failure.

## 8. UI placement

- **Decision**: A `TeamSummary` panel under the chart, shown when exactly the pinned team has a summary for the selected season: team name, an "AI-generated summary" badge, and the paragraph.
- **Rationale**: The spec leaves the element undefined but requires click-to-view and a visible label. Pinning is the existing click behavior and already lives in `App`. A self-contained panel is easy to relocate when the team page (spec 009) arrives.
- **Alternatives considered**: Putting it in the hover tooltip (transient, and the tooltip is per week); a modal (heavier than the content warrants).

## 9. Pre-existing defect that blocks this work

- **Finding**: `build-rankings.mjs` still writes `src/data/seasons/index.ts` with `import type { SeasonData } from '../../Chart/types'`, a file the refactor removed. Running `npm run build:rankings` today would break the build.
- **Decision**: Fix the template to import from `'../../types'` as the first task, since this feature must run that script.
