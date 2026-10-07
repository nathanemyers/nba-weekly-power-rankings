# Adversarial Review — architecture-nba-weekly-power-rankings

**Reviewer lens:** construct two units one level down that each obey every AD to the letter yet still build incompatibly — clashing shared-data shapes, two owners of one entity, conflicting state-mutation paths.

**Spine reviewed:** `architecture-nba-weekly-power-rankings.md` (status: draft, 2026-10-07)

**Method:** read the spine and memlog, then cross-checked every AD against the actual repo state (`scripts/build-rankings.mjs`, `scripts/scrape-playoffs.mjs`, `data/index.json`, sampled `data/articles/**/*.json`, `src/Chart/teams.ts`, `package.json`, `.github/`) to ground each hypothetical clash in what a builder would actually see, rather than inventing scenarios divorced from the code.

## Verdict

**Conditional pass.** The spine is unusually well-grounded (AD-6/AD-8 are already verified against real files, not aspirational), but it has two holes that will produce genuinely incompatible units if two sessions build against it independently — both involving concurrency/ambiguity the ADs leave open rather than close. Close findings 1 and 2 with a tightened or new AD before writing `scripts/scrape-weekly.mjs`. Findings 3–5 are real but lower-stakes for a solo project; fine to fix opportunistically or note in Deferred.

## Findings

### 1. (High) AD-4 names one workflow file, not one workflow *run* — nothing stops concurrent runs from racing on the same push to `main`

AD-4's rule is "a single workflow file... triggered by `schedule`... and `workflow_dispatch`." That's a constraint on the YAML, not on execution. GitHub Actions does not serialize runs of the same workflow by default. Two units built strictly to this letter:

- **Unit A** adds no `concurrency:` block (AD-4 never asks for one) and relies on AD-7's "keyed by slug, no-op on repeat" for safety.
- **Unit B** also adds no `concurrency:` block, same reasoning.

Both are spine-compliant, and both are wrong under the same failure: a manual `workflow_dispatch` fired while the weekly cron run is still mid-flight (plausible — the person debugging why the cron didn't fire is exactly the moment they'd hit "Run workflow"). AD-7's idempotency protects the *article write* (same slug → same content → harmless re-write), but it does not protect the **git push**: two runs both read `data/index.json` at a stale HEAD, both append, both commit, and the second `git push` to `main` fails non-fast-forward — or worse, if either run retries with `--force`/rebase logic nobody specified, one run's commit silently disappears. The Consistency Conventions table's claim that "one job owns the write path... nothing else writes there" is true of the workflow definition and false of the possible runtime.

**Close with:** tighten AD-4 (or add a new AD) to require a `concurrency:` group on the workflow (e.g. `group: weekly-update`, queue rather than cancel — cancelling a half-committed run mid-push is its own hazard) so the "one job" guarantee is actually enforced at runtime, not just in the file.

### 2. (High) AD-1 + AD-5 leave "is a playoff/offseason special a new article" undefined — two compliant discovery filters diverge on real historical data

`data/index.json` already contains, interleaved on the same nba.com power-rankings category feed, both week-numbered entries (`week: 25`) and non-week-numbered specials (`week: null` — `"offseason-power-rankings-west-2026"`, `"power-rankings-2025-26-playoffs-conference-finals"`). AD-1 says discovery "takes the newest entry" from the category page, full stop — no filter by title or week-number. AD-5 says "the weekly job only touches nba.com power-rankings articles," scoped to exclude Basketball-Reference playoff scraping — but a playoff *power-rankings article on nba.com* is still an nba.com power-rankings article by that wording.

Two builders, both reading every AD literally:

- **Unit A** ingests whatever is newest regardless of whether it's week-numbered, matching AD-1's literal "takes the newest entry" and matching the historical convention visible in `data/index.json` (specials already live there with `week: null`).
- **Unit B** reads AD-5's framing — "the **weekly** job" — as implying only week-numbered articles are in scope, and filters out anything whose title doesn't match a week pattern, since nothing in AD-1/AD-5 says otherwise.

These two scrapers build genuinely incompatible datasets going forward (one keeps growing the specials the way history does; the other silently stops). They also disagree on what AD-2's failure gate even measures: if the newest category entry during an in-season week is actually last week's leftover special (no new numbered week yet), is that "found a new article" (AD-2 satisfied, no failure) or "no new numbered article" (should fail)? AD-2's text ("a run that finds no new article") doesn't define "new" against week-numbering vs. slug-already-seen vs. calendar newness.

**Close with:** state explicitly in AD-1 or AD-5 whether non-week-numbered specials (offseason/playoffs-on-nba.com) are in scope for the automated job, and define "new article" in AD-2 against the specific criterion (new slug vs. new week number) the failure gate should actually use.

### 3. (Medium-high) AD-7's "no-op" is ambiguous between "freeze forever" and "idempotent upsert" — and AD-3 removes the safety net that would normally catch the wrong choice

AD-7: "Re-running against an already-recorded week is a no-op, not a duplicate entry." That's consistent with either reading:

- **Unit A:** once a slug exists in `data/index.json`/`data/articles/`, skip it forever — never re-fetch, never overwrite. Matches the literal "no-op."
- **Unit B:** every run re-fetches and re-writes keyed by slug; if content is unchanged the write is a no-op *by virtue of being identical*, and if NBA.com edited the article (typo fix, added a late-game update, `modifiedAt` bump) the rewrite captures that. Also matches "no-op... not a duplicate" — it never duplicates, it overwrites in place.

Unit A never captures post-publish corrections (plausible on nba.com — the sampled article already carries a distinct `modifiedAt`). Unit B means `data/index.json`/`data/articles/` content can silently change between runs with no human in the loop, and per AD-3 that lands straight on `main` with no PR to catch an unexpected diff. The two are not just stylistically different — they produce different committed history for the same slug.

**Close with:** pick one explicitly in AD-7 (recommend: upsert, since "idempotent" normally means safe-to-repeat-with-same-effect rather than first-write-wins, and the project already has no review gate to catch a stale record otherwise).

### 4. (Medium) The team-identity mapping already has two independent, unlinked owners — the spine's own prose describes this incorrectly

The Consistency Conventions table says: "Teams are identified by numeric NBA `teamId`, mapped to the `slug` used in `src/Chart/teams.ts` via the existing `TEAM_SLUGS` table." Checking the actual code:

- `src/Chart/teams.ts` has no `teamId` field at all — only `{ slug, name, color }`.
- `TEAM_SLUGS` (the `teamId → slug` dict) is hand-maintained *inside* `scripts/build-rankings.mjs`, with no code-level link to `teams.ts`.
- `scripts/scrape-playoffs.mjs`, by contrast, builds its own `SLUG_BY_NAME` (`name → slug`) by regex-parsing `teams.ts` at runtime — a genuinely derived, single-source mapping.

So the spine's description ("mapped... via the existing TEAM_SLUGS table" as if it's sourced from `teams.ts`) is inaccurate, and the underlying entity — "which numeric/string team identifier maps to which `slug`" — already has two independently-maintained sources of truth in the codebase (one parsed from `teams.ts`, one hardcoded and not). A builder who trusts the spine's prose would assume editing `teams.ts` (e.g. on a team rebrand or relocation) updates `TEAM_SLUGS` too; it doesn't. Nothing in the spine stops a *third* copy being hand-rolled inside the new `scrape-weekly.mjs` if it ever needs this mapping (e.g. for validation before writing).

**Close with:** either make `TEAM_SLUGS` derive from `teams.ts` the way `scrape-playoffs.mjs` does (add `teamId` to the `Team` type), or correct the Consistency Conventions row to state plainly that there are two independently-maintained tables today and any team-identity change (rebrand/relocation/new expansion team) must update both by hand.

### 5. (Medium, lower priority) Season-boundary knowledge has no single declared source

AD-2's regular-season date window is "derived from past seasons' week spans," with the exact boundaries explicitly pushed to Deferred ("an implementation detail for whoever writes the scraper"). Separately, `build-rankings.mjs` already computes its own notion of season length empirically (`maxWeek` per season, from whatever's been scraped) with no reference to AD-2's calendar window. These are two different computations over the same underlying fact (how long a season runs) with no shared file either could read from. This is low risk today because only one unit (the weekly job's failure gate) currently needs the calendar window, but if a future unit wants "is this currently a scraping week" (e.g. a health-check script, or the window logic itself maturing beyond a first cut), there's no canonical place to look — it will get re-derived a third way.

**Close with (optional, can stay in Deferred):** when the window is implemented, name the file/constant it lives in (e.g. a small `data/season-calendar.json` or an exported constant) so a second consumer reuses it instead of re-deriving it.

## Not flagged (considered and dropped as too contrived for a solo low-stakes project)

- Slug vs. numeric `id` as dual identity (NBA.com changing a slug while keeping the same `id`, or vice versa) — technically possible but no evidence nba.com does this, and AD-7 already commits to slug as the key. Not worth an AD for a personal project.
- Sort order of `data/index.json` — `build-rankings.mjs` re-sorts by week internally regardless of on-disk order, so a scraper appending anywhere in the array doesn't actually clash with anything today.

## File reviewed

- Spine: `/home/nathan/code/nba-weekly-power-rankings/_bmad-output/initiative-nba-weekly-power-rankings/architecture-nba-weekly-power-rankings/architecture-nba-weekly-power-rankings.md`
- Grounded against: `scripts/build-rankings.mjs`, `scripts/scrape-playoffs.mjs`, `data/index.json`, `data/articles/**/*.json` (sampled across seasons 2016-17 through 2026-27), `src/Chart/teams.ts`, `package.json`
