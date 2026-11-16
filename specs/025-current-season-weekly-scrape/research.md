# Research: Current Season Support and Weekly Rankings Refresh

Findings from reading the code and probing NBA.com on 2026-11-15.

## R1. Why the saved 2026-27 Week 1 has no rankings

- **Finding**: NBA.com published `power-rankings-2026-27-week-1` (2026-10-19) with an empty `powerRankings` array. The 30 teams are only in the article HTML (`contentFiltered`), each starting with `<h4>#N <img src=".../logos/nba/{teamId}/..." alt="..."> <a href="...">Team Name</a></h4>` and followed by the write-up up to the next `<h4>`. Weeks 2-4 (2026-10-26, 11-02, 11-09) do have `powerRankings` with 30 entries in the usual shape. Earlier seasons' Week 1 articles were all structured, so this is a one-off for now, but it could happen again.
- **Decision**: Add an HTML fallback to `scripts/nba-power-rankings-scraper/articlePage.mjs`. When `powerRankings` is empty and the HTML has `<h4>#N` team headers, parse rank, team ID (from the logo URL), team name, and write-up HTML/text into the same `rankings` entries. `previousRank` is `null`. The fallback only runs for numbered weekly articles, so the "notebook" and fantasy articles stay unstructured.
- **Rationale**: This keeps one raw shape (`rankings[]`), so `scripts/lib/articles.mjs` and `build-rankings.mjs` need no changes. The team ID from the logo URL maps through the existing `TEAM_SLUGS`.
- **Alternatives considered**: Hand-entering Week 1 was rejected because it can't be repeated and breaks if the format recurs. Skipping Week 1 was rejected because it loses the season's starting point, and FR-001 asks for every published week.
- **Note**: Week 1's write-ups start with `Preseason record: 2-3`. The build's `currentRecord` regex (`^Record:`, case-sensitive, anchored to the line) already ignores it, so Week 1 shows no record. That's correct.

## R2. Rejecting partial weeks

- **Finding**: `scrape.mjs` logs a failed article and moves on, and the process still exits 0. Nothing checks the team count.
- **Decision**: When the scraper fetches a numbered weekly article (`power-rankings-YYYY-YY-week-N`) published 2017-08 or later, it requires exactly 30 distinct known team IDs, whether they come from the structured data or the HTML fallback. If not, it does not save the article and counts it as failed. `cli.mjs` exits non-zero when any article failed.
- **Rationale**: Meets the edge case "fewer than 30 teams must fail the run" and FR-014. It only checks articles fetched in this run, so historical data is never re-judged.
- **Alternatives considered**: Checking in `build-rankings.mjs` was rejected. A bad week would already be saved under `data/raw/` and skipped as "already saved" on later runs, so it would never be re-fetched.

## R3. The scraper's index drops older articles

- **Finding**: `scrape()` rewrites `data/raw/nba/index.json` from the articles inside the `--years` window (default 10) only. As the window slides past October 2017, structured 2017-18 weeks fall out of the index, and `build-rankings` would quietly drop them from the site. A weekly job makes this happen automatically.
- **Decision**: Build the index from every listed article, whether it's inside the window or already saved on disk. The window only limits what gets fetched. Saved files outside the window are read from disk and kept in the index.
- **Rationale**: Without this, an unattended weekly run would quietly shrink the site's history. A rebuilt index that loses entries is a regression the job must not cause.
- **Alternatives considered**: Running the job with `--years 100` was rejected because it only hides the bug and would fetch old unsaved prose articles. Merging with the old `index.json` was rejected because rebuilding from what's on disk and listed is simpler and can't go stale.

## R4. Current-season rosters and coaches

- **Finding**: `build-rankings.mjs` throws when a ranked team has no roster or head coach. `scripts/scrape-rosters.mjs` hard-codes `LAST_END_YEAR = 2026`, so it can't fetch 2026-27 (`NBA_2027`). `--season X` already re-fetches one season even when its file exists. Basketball-Reference publishes in-progress season pages.
- **Decision**: Work out `LAST_END_YEAR` from the date (a season ends in the following year once August arrives). The refresh runs `scrape-rosters --season <current>` every time it collects a new week. That's about 3 requests at the existing 3 s crawl delay.
- **Rationale**: Meets FR-011. Stats only matter alongside a new week, so the job doesn't re-fetch rosters when nothing new was collected (FR-013).
- **Alternatives considered**: Making rosters optional for the in-progress season was rejected. The roster tab is part of FR-003, and Basketball-Reference has the data.

## R5. How the job publishes (FR-016)

- **Finding**: The `master` ruleset requires changes to come through a pull request (0 approvals) and has no required status checks. Repo auto-merge is off (`allow_auto_merge: false`). Workflows may create pull requests (`can_approve_pull_request_reviews: true`). Pull requests and merges made with the workflow's `GITHUB_TOKEN` **do not trigger other workflows**, so `ci.yml` would never run on the job's pull request and the merge would never start `deploy.yml`. Only `workflow_dispatch` and `repository_dispatch` are exempt.
- **Decision**: The refresh workflow runs the checks itself, then opens or updates the pull request. If lint, `npm test`, and `npm run build` pass, it merges the pull request with `gh pr merge` and starts `deploy.yml` with `gh workflow run deploy.yml --ref master`. If any check fails, the pull request stays open and unmerged with the failure linked, and the job fails. The workflow token needs `contents: write`, `pull-requests: write`, `actions: write`.
- **Rationale**: This gives the agreed result ("merges itself once its checks pass, maintainer may review but doesn't have to") with no stored secrets, no token to rotate, and no ruleset or repo-setting changes. `deploy.yml` re-runs lint, test, and build before publishing anyway.
- **Alternatives considered**:
  - *Native GitHub auto-merge with a fine-grained personal access token secret*: The checks would appear on the pull request and the merge would trigger deploy on its own. But it needs a long-lived token that expires (at most about a year), auto-merge turned on, and "Lint, test and build" added as a required check in the ruleset. Without a required check, auto-merge has nothing to wait for. Rejected as more setup and more ways to fail for the same result. It's still a drop-in upgrade if the maintainer wants checks to show on the pull request.
  - *GitHub App token*: Same benefits as the personal access token, but even more setup. Rejected.
  - *Push straight to `master`*: Blocked by the ruleset, and the maintainer chose pull requests. Rejected.

## R6. Schedule, concurrency, and staying alive

- **Finding**: Weekly articles were published Sun–Mon US time (2026-10-19 18:39Z, 10-26 13:33Z, 11-02 21:19Z, 11-09 16:36Z). GitHub turns off scheduled workflows after 60 days with no repository activity, and the offseason is longer than that.
- **Decision**: Run on cron `0 15 * * 2,5` (Tuesday and Friday, 15:00 UTC) plus `workflow_dispatch`. Use `concurrency: { group: weekly-refresh, cancel-in-progress: false }` so runs queue instead of overlapping (FR-017). Use one fixed branch, `data/weekly-refresh`, which the job force-pushes, so an unmerged pull request is updated rather than duplicated. The README notes that the schedule may need turning back on in the fall if GitHub disabled it.
- **Rationale**: Twice a week keeps the worst-case delay at about 4 days, inside SC-003's 7 days, and a run with nothing new costs only the listing requests. A fixed branch is the simplest way to get one pull request.
- **Alternatives considered**: Running daily was rejected because it's more requests to NBA.com than needed. Tuesday only was rejected because an article published after Tuesday's run would wait a full week.

## R7. Bot blocking in CI

- **Finding**: NBA.com's CDN (Akamai) blocked a plain `curl` request but allowed the project's `fetchTextWithRetry` user agent from a home IP. Whether it allows GitHub-hosted runner IPs is unknown until the first run. Basketball-Reference can rate-limit too.
- **Decision**: Put all the refresh logic in one script, `npm run refresh:current`, which runs the same way locally and in CI. If CI is blocked, the job fails visibly (FR-014). The maintainer can run the same command locally and open the pull request by hand. The quickstart's first step is a manual `workflow_dispatch` run to find out early.
- **Rationale**: Keeps the job useful even in the worst case, and doesn't spoof a browser user agent, which Principle IV forbids.
- **Alternatives considered**: Spoofing a browser user agent or using a proxy was rejected because it goes against the constitution and respectful scraping.

## R8. Default view and in-progress UI

- **Finding**: `seasonIndex` is sorted newest first and only includes seasons with at least one structured numbered week (`articles.mjs` filter). `latestSeason = seasonIndex[0]`, the index route redirects to it, and unknown seasons redirect to it too. The season page previews come from the same index. The UI already copes with missing data: Storylines, Roster, and Awards tabs are disabled when empty, and Team History says "Storylines appear once the season is complete". `aiSummary` is loaded but not rendered. The season picker shows a champion logo but nothing for a season without one.
- **Decision**: No routing changes. FR-006 to FR-008 hold once 2026-27 data exists. Add tests for them. In the season picker, show an "In progress" label for a season with no champion (FR-005). As an implementation task, check every view with 2026-27 against FR-004 and SC-007, and fix any gap found.
- **Rationale**: The default-view rule is already defined by the data (R1 and R3 make sure that data is right), so the remaining risk is presentation.
- **Alternatives considered**: Choosing the current season from today's date was rejected. It would point at a season with no data before its Week 1, which breaks User Story 2, scenario 4.

## R9. Paid steps

- **Decision**: The workflow and `refresh:current` never call `build:summaries` or anything in `scripts/storylines/`, and the job doesn't get `ANTHROPIC_API_KEY`. `build-rankings.mjs` already reads summaries and storylines only from what's on disk.
- **Rationale**: Meets FR-015 and the AGENTS.md rule against spending tokens.
