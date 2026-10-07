---
title: Good-spine checklist review — NBA weekly power rankings architecture
reviewed_doc: ../architecture-nba-weekly-power-rankings.md
reviewed_against:
  - ../../brief-nba-weekly-power-rankings/brief-nba-weekly-power-rankings.md
  - ../.memlog.md
repo_checked: /home/nathan/code/nba-weekly-power-rankings (scripts/build-rankings.mjs, scripts/scrape-playoffs.mjs, data/, package.json, git remote)
date: 2026-10-07
reviewer: Claude (subagent review)
---

# Review: architecture-nba-weekly-power-rankings.md

## Verdict

**Pass, with minor findings.** No finding here blocks building from this spine. Judged against the project's own stakes (solo, personal, low-stakes), the spine is well-scoped and its ADs are concrete and enforceable. The one finding worth fixing before building is #1 (missed-run week skip); the rest are cheap documentation/scope fixes.

Scope note: this verdict covers what the spine claims to cover (the weekly-update pipeline and GitHub Pages/Actions hosting). Finding #3 is about whether that self-declared scope should have been wider, given the brief.

## Findings

### 1. [Gap — the real one worth fixing] AD-1 + AD-2 together can't detect a skipped week, only a missing one

- AD-1's rule: each run "takes the newest entry" from the category page (singular, newest only).
- AD-2's rule: failure fires only when **no** new article is found inside the season window.
- Neither checks that the newest article's week number is exactly `last-recorded-week + 1`.

Walk the failure mode AD-2 says it exists to catch ("a real gap... going unnoticed during the season"): a scheduled run fails outright (transient network error, GH Actions hiccup) and writes nothing for week N. Next week's run finds week N+1 as "the newest entry" — a new article *is* found, so AD-2's gate never fires, and week N is silently and permanently missing from `data/index.json`. This is exactly the silent-gap scenario the brief (and AD-2) calls out, and the current rules don't close it because "no new article" and "a week got skipped" are different conditions, and only the first is checked.

AD-7 (idempotent, keyed by slug) doesn't help either — it guards re-runs of an *already-recorded* week, not a *jumped-over* one.

**Fix is cheap and stays at this altitude:** AD-2 (or a new AD) should gate on "newest found week == last recorded week + 1 (within the season window)," not just "a new article exists." Worth a one-line rule addition, not a redesign.

### 2. [Contradiction with AD-5 and the repo] "Nothing else writes there" overclaims

Consistency Conventions / State & cross-cutting says: *"One job owns the write path to `data/` and `src/data/seasons/`; nothing else writes there."*

AD-5 explicitly keeps `scripts/scrape-playoffs.mjs` as a separate, manually-run script — and that script already writes `data/playoffs.json` (verified: `scrape-playoffs.mjs` line 8, `outFile = join(root, 'data', 'playoffs.json')`). So the convention as literally written is false on day one, contradicted by both another part of the same spine (AD-5) and the actual repo.

**Fix:** scope the convention to `data/articles/` and `data/index.json` (the files the weekly job actually owns), not all of `data/`.

### 3. [Scope gap] The brief's "Arcs to watch" capability has no architectural home anywhere

The brief (section "Arcs to watch") defines a real capability with specific, soon-to-be-tuned logic: a rolling 4-week net-change-≥5 threshold and a 3-consecutive-week trend threshold, explicitly required to live as "settings, not hard-coded values." This doesn't exist in the codebase yet (checked `src/` — only `src/Chart/` exists, no arcs/trend code), and no other architecture doc in `_bmad-output/` covers it; this is the only architecture spine for the initiative.

The spine's own frontmatter narrows scope to "weekly-update pipeline... and GitHub Pages/Actions hosting," which is presumably why it's absent — and that's a defensible scoping call, since the main chart is explicitly frozen behavior in the brief. But "Arcs to watch" is *not* frozen or existing; it's a new capability with a genuine cross-cutting question this altitude would normally own (where do the tunable thresholds live — a config file the build step reads, or client-side state; is it computed in `build-rankings.mjs` or in the chart at render time). Leaving it completely unaddressed, with no "Deferred" line even acknowledging it's out of scope on purpose, reads as an oversight rather than a decision.

**Fix:** either add one line to Deferred/scope ("Arcs to watch's data/settings home is out of scope for this spine, covered separately") to make the exclusion a decision rather than a silence, or fold a minimal AD in if it's meant to ship alongside this work.

### 4. [Minor] No concurrency guard against overlapping runs

AD-4 prevents a *second workflow* from existing, but says nothing about two runs of the *same* workflow overlapping (a manual `workflow_dispatch` fired while the weekly `schedule` run is still in flight, or two manual dispatches back to back). AD-7's "keyed by slug" idempotency guards duplicate article records, but not a git-push race or two processes writing `data/index.json` at once. A `concurrency:` block on the workflow (e.g. `group: weekly-update, cancel-in-progress: false`) would close this for the cost of one YAML stanza. Low severity for a personal project where manual dispatch is rare, but it's a real cross-run divergence the spine is silent on.

### 5. [Nit] Deferred item's stated reason is slightly off

"Vite `base` path for GitHub Pages... Needed once the repo name is confirmed as the Pages path" — the repo name is not actually unknown: `git remote -v` shows `nathanemyers/nba-weekly-power-rankings`, matching `package.json`'s name. The deferral's *real* and sufficient justification ("not a cross-unit invariant, just a config value") still holds regardless, so this doesn't change the verdict — just reword away from "needed once confirmed" since it's already confirmable today.

## Checklist walkthrough

| Checklist item | Result |
| --- | --- |
| Fixes the real divergence points for the level below, misses none | Mostly — misses the week-continuity check (#1) |
| Every AD's Rule is enforceable and prevents its stated divergence | Yes for AD-3/4/5/6/8. AD-1/AD-2 are enforceable as written but don't jointly close the gap they're meant to (#1) |
| Nothing under Deferred could let two units diverge | Yes — all three Deferred items are single-owner config values, not shared contracts |
| Named tech is verified-current | Yes — re-verified directly against GitHub's release pages today (2026-10-07): `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0, `actions/configure-pages` v6.0.0, `actions/upload-pages-artifact` v5.0.0, `actions/deploy-pages` v5.0.1 — all match the spine exactly. (An initial WebSearch pass returned stale/mirror-site noise contradicting this; direct fetch of the canonical `github.com/actions/*/releases` pages confirmed the spine is right.) |
| Ratifies rather than contradicts the brownfield codebase | Mostly — AD-6 verified field-for-field against a real article (`data/articles/2025-26/power-rankings-2025-26-week-3.json`) and the real `data/index.json` pointer shape; AD-8 matches `scrape-playoffs.mjs`'s existing user-agent/spacing convention; the `TEAM_SLUGS` table matches `build-rankings.mjs`. But the "nothing else writes there" convention contradicts AD-5 and `scrape-playoffs.mjs` (#2) |
| Covers the brief's capabilities | Weekly update and hosting: yes, thoroughly. Main chart: correctly out of scope (frozen behavior per brief). Arcs to watch: silently absent (#3) |
| Every dimension this altitude owns is decided/deferred/open, incl. deployment & environments, infra/provider strategy, operations | Deployment (GH Pages via official actions) and infra/provider strategy (free GH services, public repo) are explicitly decided. Operations is mostly decided (AD-2 failure gating, default Actions failure email, token permissions spelled out) but has a real small gap: no concurrency/overlap handling (#4) |

## Verified directly against the repo

- `data/index.json[0]` keys exactly match AD-6's slim-pointer field list.
- `data/articles/2025-26/power-rankings-2025-26-week-3.json` keys exactly match AD-6's full-record field list.
- `scripts/build-rankings.mjs`'s `TEAM_SLUGS` table matches the Consistency Conventions' team-slug mapping description.
- `scripts/scrape-playoffs.mjs` already sets a descriptive `User-Agent` and spaces requests via `CRAWL_DELAY_MS` — matches AD-8's "same convention... already follows" claim, and confirms it already writes into `data/` (contradicting the "nothing else writes there" line, see #2).
- No `.github/workflows/` exists yet — confirms this is genuinely greenfield automation being added to a brownfield data/build layer, as the spine assumes.
- `git remote -v` → `nathanemyers/nba-weekly-power-rankings` — repo name is already known (see #5).
