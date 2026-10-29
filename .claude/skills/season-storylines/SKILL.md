---
name: 'season-storylines'
description: 'Find, review, and finalize curated storyline articles for a completed NBA season. Phases: discover (search approved sources for candidates), more (find extra candidates for one team or the season storylines), review (maintainer picks candidates in batches), finalize (write the static list), revise (deliberately change a finalized list).'
argument-hint: '<season, e.g. 2024-25> [discover|more <team|season>|review|finalize|revise]'
user-invocable: true
---

# Season storylines

Builds the storyline list for one completed season, with the maintainer making every
inclusion decision. Spec: `specs/007-season-storylines/spec.md`. File shapes:
`specs/007-season-storylines/data-model.md`.

## Files

| File                                      | Role                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `data/processed/seasons/<season>.json`    | Read only: weekly blurbs (`rankings`), `playoffs`, `playoffSeries`, `rosters` (award codes) |
| `scripts/storylines/sources.json`         | Approved publishers, domains, excluded paths                                                |
| `scripts/storylines/draft-dates.json`     | Draft dates that bound each season                                                          |
| `data/raw/storylines/<season>.json`       | Guidance topics and candidates with review status. The only file this skill edits directly  |
| `data/processed/storylines/<season>.json` | Finalized list. Written only by `npm run check:storylines -- <season> --finalize`           |
| `data/raw/storylines/<season>.additions.json` | `more` only: new topics and candidates, merged by `node scripts/storylines/add.mjs <season>` |

## Rules

- Never edit `data/processed/storylines/` by hand. Never run `npm run build:summaries` or
  `scripts/build-summaries.mjs`.
- Every inclusion, exclusion, and edit is the maintainer's decision. Propose; do not decide.
- Search only approved sources: always pass `allowed_domains` built from `sources.json`
  domains. Do not suggest adding `apnews.com`, `indystar.com`, or `theathletic.com`; they block
  the search tool. Athletic pieces syndicated on nba.com are fine.
- Reuse what the raw file already holds: skip guidance topics already searched and URLs already
  present.
- Run `npm run check:storylines -- <season>` after every write to the raw file and fix or drop
  whatever it reports before moving on.

## Choosing the phase

Parse `$ARGUMENTS` as `<season> [phase] [section]` (`section` is only for `more`). With no phase: `discover` if there is no raw file,
`review` if any candidate is `pending`, otherwise `finalize`.

Before any phase, stop and tell the maintainer if:

- the season file has no team with `"champion"` in `playoffs` (season not complete), or
- `seasonWindow` cannot be computed (draft date missing for either end in `draft-dates.json`).

If `data/processed/storylines/<season>.json` already exists, only `revise` may change it. Other
phases may still update the raw file, and must say so.

## Season window

A season `YYYY-YY` runs from the day after the `YYYY` draft through the `YYYY+1` draft. The
lottery and draft after the Finals belong to the season that just ended. A candidate's
`eventDate` is when the event happened, not when the article was published.

## discover

1. **Build guidance topics** in this order, writing each to `guidance` with `id`, `summary`,
   `origin`, `teams`, and `weeks` (for weekly topics):
   1. `retrospective`: search for season-in-review pieces (e.g. "<season> NBA season review",
      "biggest surprises of the <season> season"). Read the top two or three and turn each
      storyline they name into a topic. These are the main guide for season storylines.
   2. `playoffs`: one topic per playoff team from `playoffSeries`, describing its run (rounds,
      opponents, results), plus one for the Finals and champion.
   3. `awards`: season award winners (codes ending `-1` in `rosters[*][*].awards`, e.g. `MVP-1`).
   4. `weekly`: for each team, read its weekly blurbs in `rankings` and pick 3–6 notable
      events: injuries to key players, streaks, coaching changes, trades, milestones, the
      season's arc.
   5. `theme`: events mentioned in many teams' blurbs (NBA Cup, trade deadline, a record).
      A theme count undercounts single huge events, so do not use it to rank importance.
   6. `draft`: the lottery and draft that follow the Finals.
2. **Search** once per topic with `WebSearch`, `allowed_domains` from `sources.json`, and the
   season and teams in the query. Keep the best one or two results per topic. Prefer reported
   stories, features, and analysis. Skip game recaps, box scores, injury-report posts,
   previews, "storylines to watch" pieces, and anything about a different season (WebSearch
   cannot filter by date, so check every date).
3. **Confirm details**: use `WebFetch` only when the headline or publication date is unclear
   from the URL or search result.
4. **Categorize** each kept result as a candidate (all Storyline fields plus `kind`,
   `blockbuster`, `guidance`, `status: "pending"`):
   - `kind`: `playoffs` for a team's playoff run, `trade`, `draft` (lottery and draft),
     `season` for league-wide stories, otherwise `team`.
   - `teams`: every team the story concerns. A trade lists every team in the deal.
   - `featured: true` for league-wide stories, blockbuster trades (`blockbuster: true`), the
     champion's title run, and the No. 1 pick or a lottery shock. Mark these as proposals for
     the maintainer to confirm.
   - `title`: a short storyline label in your own words. `article.headline`: exactly as
     published. `article.publisher`: the matching `publisher` from `sources.json`.
   - `id`: kebab-case from the title, unique within the season.
5. **Write** the raw file (`updatedAt` = today), run the check, and report counts per kind and
   any playoff team still without a `playoffs` candidate. Then open the review tool for the
   season (see **Review tool** below).

## more

`more <team|season>` finds extra candidates for one section: a team code, or `season` for the
season storylines. The review tool's "Find more" button runs it headless with
`claude -p "/season-storylines <season> more <section>"`, so nobody is there to answer questions:
do not ask any, make the reasonable choice, and say what you chose in the final summary.

1. Run `node scripts/storylines/section.mjs <season> <section>`. It prints the window, approved
   domains, the section's existing candidates (with status) and guidance topics, and for a team its
   playoff run, award codes, and weekly blurbs. Do not read the whole season or raw file.
2. Pick 3–6 storylines the section does not cover yet: events in the blurbs, playoff run, awards,
   offseason and draft-week moves inside the window, or, for `season`, league-wide stories from a
   retrospective search. Excluded candidates are the maintainer's "no": do not re-add that story
   under a new URL.
3. Search and choose articles exactly as in `discover` steps 2–4 (approved domains only, check
   dates, skip recaps and previews), skipping URLs already listed.
4. Write `data/raw/storylines/<season>.additions.json` as
   `{ "guidance": [GuidanceTopic], "candidates": [Candidate] }`, giving every new storyline its
   own new guidance topic (or an existing topic ID). Then run
   `node scripts/storylines/add.mjs <season>`. It appends them as `pending`, sorted by event date,
   and refuses the whole batch if any entry fails the checks; fix or drop the failures and rerun.
   Never edit existing candidates or topics.
5. Run `npm run check:storylines -- <season>`. End with a short summary: one line per added
   candidate (title, publisher), and any storyline you searched for but could not source.

If the season is already finalized, this still only changes the raw file; say so in the summary.

## review

### Review tool

Review happens in the internal review tool by default; it saves straight to the raw file.

1. Start it with the `storyline-review` entry in `.claude/launch.json` (`preview_start` when the
   browser pane is available), or run `npm run review:storylines` in the background. Reuse it if
   it is already running.
2. Open `http://127.0.0.1:5180/?season=<season>` for the maintainer, and tell them to edit, press
   Save, and say when they are done.
3. When they are done, re-read the raw file, run the check, and report what it says, how many
   candidates are still pending, and any playoff team without an included `playoffs` candidate.
   Do not re-ask about decisions already saved in the file.

### Chat review

Use this only when the maintainer asks for it or the review tool cannot start.

Work in batches and save after each one, so the maintainer can stop at any point and resume
later.

1. Season storylines batch: candidates with `featured: true` or `kind: "season"`.
2. One batch per team, alphabetical by team code, covering every candidate listing that team
   that has not been decided yet. Flag `playoffs` candidates, and say when a playoff team would
   be left without one.

For each batch show a numbered table: title, headline, publisher, event date, teams, featured.
Ask the maintainer to reply per row with include, exclude, or an edit (title, teams, featured,
kind, eventDate). Use `AskUserQuestion` for quick include/exclude choices when it helps. Apply
the decisions to the raw file, run the check, and report how many candidates are still pending.

In either mode, the maintainer can ask for more searches on a topic during review; add the
results as new pending candidates (in the same batch for chat review). In the review tool, first
make sure the maintainer has saved, then tell them to reload the page to see the new candidates.
The tool's "Find more" button does this itself for one section by running `more`.

## finalize

1. Run `npm run check:storylines -- <season> --finalize`. If it fails, show the failures and
   go back to `review` (or `discover` for a playoff team with no candidates).
2. On success the script writes `data/processed/storylines/<season>.json`. Run
   `npm run build:rankings` so the season file picks it up.
3. Report how many storylines were finalized, how many are featured, and the files that
   changed.

## revise

Only when the maintainer explicitly asks to change an already finalized season.

1. Ask the maintainer to confirm by name the season being revised and what should change.
2. Set the affected candidates back to `pending` (or add new ones), then run `review` for just
   those.
3. Run `npm run check:storylines -- <season> --finalize --revise`, then `npm run build:rankings`.
