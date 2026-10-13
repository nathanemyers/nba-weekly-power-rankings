# Implementation Plan: Team AI Season Summary

**Branch**: `refactor` (spec dir `006-team-ai-summary`) | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-team-ai-summary/spec.md`

## Summary

Add an offline script that asks an LLM to condense each team's weekly write-ups for a season into one short narrative, stores the results as committed JSON under `data/summaries/`, and has the existing `build:rankings` step fold them into each season's app data. In the app, pinning a team (the existing click behavior) shows that team's summary in a panel under the chart with an "AI-generated" label. Completed seasons are generated once and never again; the active season regenerates only for teams whose source text changed.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19 (app); Node 22 ES modules (scripts)

**Primary Dependencies**: Existing stack; one new devDependency, `@anthropic-ai/sdk`, used only by the generation script

**Storage**: Committed JSON — `data/summaries/<season>.json` (source of truth, with provenance) and `src/data/seasons/<season>.json` (app-consumable, text only)

**Testing**: Vitest + Testing Library; pure selection logic unit-tested without network

**Target Platform**: Static site on GitHub Pages; script runs on the maintainer's machine

**Project Type**: Single-page web app with build-time data scripts

**Performance Goals**: Summary appears on click with no network request; weekly run makes at most 30 LLM calls, backfill about 270

**Constraints**: No runtime third-party calls; no secrets in the client bundle or CI deploy; `AGENTS.md` code rules; chart state stays owned by `App`

**Scale/Scope**: 9 seasons x 30 teams, roughly 80–120 words each (about 150 KB added to bundled data)

## Constitution Check

| Principle | Status | Note |
|-----------|--------|------|
| I. Static hosting only | PASS | Summaries ship as static JSON; nothing is generated on click |
| II. Data prepared at build time | PASS | LLM is called only by a local script; outputs are committed so a clean checkout builds offline |
| III. Base-path-safe navigation | PASS | No routing or asset URL changes |
| IV. Respectful, offline data collection | PASS | No new scraping; reads `data/articles/` already on disk; raw outputs live under `data/` |
| V. Simplicity | PASS with note | One new **dev-only** dependency, justified in Complexity Tracking |
| No secrets in client bundle | PASS | `ANTHROPIC_API_KEY` is read from the environment by the script only and is not needed by `npm run build` or the deploy workflow |
| Quality gates | PASS | `npm run lint`, `npm run build`, `npm test` cover the new code |

Re-checked after design: no change.

## Project Structure

### Documentation (this feature)

```text
specs/006-team-ai-summary/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── summaries-file.md
│   ├── build-summaries-cli.md
│   └── team-summary-ui.md
└── tasks.md              # created by /speckit-tasks
```

### Source Code (repository root)

```text
scripts/
├── build-summaries.mjs        # NEW: generates/refreshes data/summaries/<season>.json
├── lib/
│   ├── articles.mjs           # NEW: season -> team -> weekly entries, shared by both build scripts
│   ├── summary-plan.mjs       # NEW: pure "which teams need generating" logic
│   └── summary-plan.test.mjs  # NEW
└── build-rankings.mjs         # reads data/summaries/, emits `summaries`; fix stale types import path

data/summaries/<season>.json   # NEW, committed

src/
├── types.ts                   # SeasonData.summaries?, TeamRankings.aiSummary?
├── App.tsx                    # passes the pinned team's summary to the panel
├── App.test.tsx               # panel shown on pin, hidden on unpin / no summary
├── TeamSummary.tsx            # NEW: labeled summary panel
└── data/seasons/*.json        # regenerated with `summaries`
```

**Structure Decision**: Keep the two-stage pipeline the constitution describes (raw under `data/`, reduced under `src/data/`). The panel is a sibling of the chart rendered by `App`, which already owns `pinnedTeams`; the chart component is untouched.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New devDependency `@anthropic-ai/sdk` | Backfill is about 270 sequential calls; the SDK supplies retries, rate-limit backoff and typed errors | Hand-rolled `fetch` would need its own retry/backoff code, which is more to maintain than the dependency and never reaches `dist/` either way |
