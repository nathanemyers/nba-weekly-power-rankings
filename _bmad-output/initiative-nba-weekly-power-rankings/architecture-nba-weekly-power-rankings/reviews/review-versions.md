---
reviewer: version/reality-check lens
target: architecture-nba-weekly-power-rankings.md
reviewed: 2026-10-07
---

# Review — Version & Reality-Check Lens

**Lens:** verify every committed decision was web-researched or reality-checked rather than asserted from training data — current library/framework versions, that each named technology still exists and fits, and the live defaults of any starter it leans on.

**Verdict: PASS, with one correction needed.** Every version claim in the Stack table independently re-verified correct against GitHub and against the repo's actual `package.json`/local Node install. The one factual claim that does *not* check out is in the Consistency Conventions table (not the Stack table): the `TEAM_SLUGS` lookup is misattributed to the wrong file. That's a one-line fix, not a reason to send the spine back for rework.

## Method

- Re-fetched the release pages for all five pinned GitHub Actions directly from github.com.
- Re-searched for Vite 8's Node engine requirement and cross-checked it against this repo's own `package.json` (`vite: ^8.3.0` is already installed — this is not a hypothetical future upgrade, it's the version on disk).
- Checked the local Node install (`node -v`) and the official Node.js release-lines page for which majors are Active LTS / Maintenance / Current as of 2026-10-07.
- Read `src/Chart/teams.ts`, `scripts/build-rankings.mjs`, `scripts/scrape-playoffs.mjs`, and sample files in `data/articles/` and `data/index.json` to check every claim the spine makes about the *existing* codebase (record shape, team-identifier convention, politeness convention), since this is a brownfield addition, not a greenfield starter.
- Re-fetched `nba.com/news/category/power-rankings` live to confirm AD-1's scraping assumption (newest-first list, "Load more" button) still holds today, rather than trusting the memlog's account alone.

## Findings

### 1. Stack table — all five GitHub Actions versions confirmed correct (no issue)

| Action | Spine claims | Confirmed via live GitHub release page |
| --- | --- | --- |
| actions/checkout | v7.0.1 | v7.0.1, released Jul 20 — matches |
| actions/setup-node | v7.0.0 | v7.0.0, released Jul 14 — matches |
| actions/configure-pages | v6.0.0 | v6.0.0, released Mar 25 — matches |
| actions/upload-pages-artifact | v5.0.0 | v5.0.0, released Apr 10 — matches |
| actions/deploy-pages | v5.0.1 | v5.0.1, released Sep 1 — matches |

All five are each action's actual latest tag as of today, not stale or hallucinated. The memlog's "(version) Verified on GitHub (2026-10-07)" line holds up under independent re-check.

### 2. Vite 8 / Node engine requirement — confirmed correct, and confirmed against the real repo (no issue)

The spine states "Vite 8 requires `^20.19.0 || >=22.12.0`" and pins CI to Node 22.x. Web search confirms Vite 8 (via its rolldown dependency) requires exactly `^20.19.0 || >=22.12.0`. More importantly, this isn't a future/hypothetical dependency to sanity-check — `package.json` in this repo already has `"vite": "^8.3.0"` installed, so the constraint is a fact about the existing project, not an assertion about an unreleased library. Local `node -v` returns `v22.22.1`, consistent with the CI pin.

### 3. Node 22.x pin is valid but worth a one-line note (minor, not a defect)

As of 2026-10-07, per Node.js's own release-lines page: Node 22 ("Jod") is LTS but in **Maintenance** phase; Node 24 ("Krypton") is the current **Active LTS**; Node 26 is **Current** (not yet LTS, released May 2026). Node 22.x still satisfies Vite 8's floor and remains supported through April 2027, so the pin isn't wrong — but the spine's own justification for "22.x" is solely "meets the Vite floor," not "current Active LTS." Worth a one-line acknowledgment that 22.x is Maintenance LTS rather than Active LTS, so whoever implements this isn't surprised later if they expected the active line.

### 4. AD-1's scraping assumption re-confirmed live today (no issue)

Fetched `nba.com/news/category/power-rankings` directly: it is still a newest-first listing with a "Load more" button, and the top entry today is the most recent offseason power-rankings piece — consistent with what the memlog recorded from its own web research and with AD-1's rule. The scraping foundation the whole pipeline depends on is not stale.

### 5. Consistency Conventions table misattributes the `TEAM_SLUGS` table's location (real finding)

The spine states: *"Teams are identified by numeric NBA `teamId`, mapped to the `slug` used in `src/Chart/teams.ts` via the existing `TEAM_SLUGS` table."*

Checked directly against the repo:
- `src/Chart/teams.ts` contains no `TEAM_SLUGS` table. It exports a `TEAMS: Team[]` array of `{ slug, name, color }` objects, keyed by **name**, not by numeric `teamId`.
- The actual `TEAM_SLUGS` table (`{ 1610612737: 'atl', 1610612738: 'bos', ... }`, numeric teamId → slug) lives in `scripts/build-rankings.mjs` (lines 11–21), with its own comment that its slugs are meant to match `src/Chart/teams.ts`.
- `scripts/scrape-playoffs.mjs` takes a third approach entirely: it builds its own `SLUG_BY_NAME` map at runtime by regex-parsing `src/Chart/teams.ts`'s name/slug pairs, because Basketball-Reference identifies teams by name, not numeric ID.

So there are two different existing team-identifier conventions already in the codebase (teamId→slug in `build-rankings.mjs`, name→slug parsed from `teams.ts` in `scrape-playoffs.mjs`), and the spine's one-line convention conflates them and points at the wrong file for the table it names. This reads as asserted-from-memory rather than checked against the file it cites — exactly the failure mode this lens is watching for. It's a one-line correction (point at `scripts/build-rankings.mjs`'s `TEAM_SLUGS`, not `src/Chart/teams.ts`), but if left as-is it would send the new scraper's author looking for a table that isn't where the spine says it is.

### 6. AD-6/AD-8 record-shape and politeness claims — confirmed correct (no issue)

- AD-6's listed article-record fields (`id, slug, url, title, shortTitle, excerpt, author, publishedAt, modifiedAt, season, week, hasStructuredRankings, rankings, rawText`) and the slim `data/index.json` pointer shape were checked against live sample files in `data/articles/` and `data/index.json` — both match exactly as described.
- AD-8's politeness convention ("space requests and set a descriptive user agent, the same convention `scripts/scrape-playoffs.mjs` already follows") is accurate: that script spaces requests 3s apart (`CRAWL_DELAY_MS = 3000`) and sets `USER_AGENT = 'nba-weekly-power-rankings (personal project)'`.

## Recommendation

Fix finding #5 before marking the spine final: change "via the existing `TEAM_SLUGS` table" in the Consistency Conventions row to point at `scripts/build-rankings.mjs` rather than `src/Chart/teams.ts`, and optionally note that the two existing scripts resolve team identity two different ways (teamId-keyed vs. name-keyed), so the new weekly scraper's author knows which convention it's extending. Everything else checked out against either live web sources or the repo itself.
