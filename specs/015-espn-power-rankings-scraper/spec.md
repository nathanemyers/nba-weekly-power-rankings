# Feature Specification: ESPN Power Rankings Scraper (2003-04 to 2015-16)

**Feature Branch**: `015-espn-power-rankings-scraper`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "write an ESPN power rankings scraper to cover 2003-2016. It should be a separate scraper but work similarly to the NBA.com scraper"

## Clarifications

### Session 2026-10-25

- Q: Where should the NBA.com scraper's data live once ESPN data is added? → A: The NBA.com scraper writes to `data/raw/nba/`, and the existing NBA.com data in `data/raw/` (`index.json` and `articles/`) is moved there as part of this feature.
- Q: Should `data/raw/playoffs.json` move into `data/raw/nba/` along with the NBA.com articles, or stay where it is? → A: Neither. It moves to its own source folder, `data/raw/basketball-reference/playoffs.json`, and the playoffs scraper writes there.
<<<<<<< HEAD
- Q: Should the ESPN seasons be shown in the app, and the follow-up work recorded in this spec or a new one? → A: Show them in the app (User Stories 5 and 6), and record everything in this spec because it shipped in the same pull request.
- Q: ESPN no longer serves 20 editions its week dropdowns list. Accept the gap or recover them? → A: Recover them from the Wayback Machine (User Story 7).
=======
>>>>>>> master

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collect every ESPN weekly edition from 2003-04 to 2015-16 (Priority: P1)

The maintainer wants rankings for the 13 seasons before NBA.com's archive begins. They run the ESPN scraper once with no options. It visits each ESPN Power Rankings edition from the 2003-04 preseason through the 2015-16 final week and saves each one as a file in the project's raw data folder. Each file lists every team's rank, previous rank, record and comment for that week. When the run finishes, it prints how many editions it saved, skipped and failed.

**Why this priority**: Collecting the historical data is the reason the feature exists. Everything else builds on these files.

**Independent Test**: Run the scraper against a clean output folder. Confirm there is one file per published edition across all 13 seasons, and that each file lists every team ranked that week.

**Acceptance Scenarios**:

1. **Given** no ESPN data has been saved, **When** the maintainer runs the scraper with default options, **Then** every published edition from 2003-04 through 2015-16 is saved under the raw data folder, grouped by season.
2. **Given** a saved edition, **When** the maintainer opens it, **Then** it shows the season, the week (with preseason identified), the author, and a ranked list of teams. Each team has its rank, previous rank (when ESPN published one), record, the comment text, and the team's standard identifier.
3. **Given** the run has finished, **When** the maintainer reads the console output, **Then** it reports how many editions were fetched, skipped and failed.

---

### User Story 2 - Re-run cheaply and resume interrupted runs (Priority: P2)

The maintainer's first run is interrupted partway through, or they want to re-run later. Running the scraper again without changes reuses every edition already on disk and only contacts ESPN for editions it doesn't have. An option forces everything to be fetched again.

**Why this priority**: A full run sends a few hundred requests to ESPN. Not repeating them is kinder to ESPN and makes the tool practical to run more than once.

**Independent Test**: Run the scraper, stop it partway, and run it again. Confirm the second run fetches only the missing editions. Run it a third time with the force option and confirm every edition is fetched again.

**Acceptance Scenarios**:

1. **Given** some editions are already saved, **When** the maintainer re-runs the scraper without the force option, **Then** saved editions are read from disk and only the missing ones are requested from ESPN.
2. **Given** all editions are saved, **When** the maintainer runs with the force option, **Then** every edition is requested again and overwritten.
3. **Given** any run finishes, **When** the maintainer opens the index file, **Then** it lists every saved edition, including ones that were reused from disk.

---

### User Story 3 - Scrape a narrower range of seasons (Priority: P3)

The maintainer wants to check or refresh one season, or a few, without running the whole archive. They pass a starting and ending season, and only those seasons are scraped.

**Why this priority**: This is useful for spot checks and debugging the parser, but the default full run already covers the main need.

**Independent Test**: Run the scraper for a single season and confirm only that season's editions are requested and saved.

**Acceptance Scenarios**:

1. **Given** the maintainer passes a single season, **When** the scraper runs, **Then** only that season's editions are requested.
2. **Given** the maintainer passes a range outside 2003-04 to 2015-16, **When** the scraper starts, **Then** it explains the supported range and exits without making requests.

---

### User Story 4 - Each raw data source gets its own folder (Priority: P1)

With ESPN added, `data/raw/` holds data from three sources, so each gets its own folder. The NBA.com scraper now writes to `data/raw/nba/`, and the playoffs scraper writes to `data/raw/basketball-reference/`. The data already scraped is moved to match. The build scripts read from the new locations, so the app's processed data comes out identical.

**Why this priority**: It has to happen before ESPN data lands next to the NBA.com files, and the build scripts break if it's done halfway.

**Independent Test**: After the move, run the NBA.com scraper with default options and confirm it reuses every saved article in `data/raw/nba/` without fetching any. Run `npm run build:rankings` and confirm `data/processed/` is unchanged.

**Acceptance Scenarios**:

1. **Given** the existing NBA.com `index.json` and `articles/` and `playoffs.json` in `data/raw/`, **When** the move is done, **Then** the NBA.com files are in `data/raw/nba/` and `playoffs.json` is in `data/raw/basketball-reference/`, all with the same contents, and no data files remain directly under `data/raw/`.
2. **Given** the moved data, **When** the maintainer runs the NBA.com scraper without `--out`, **Then** it reads from and writes to `data/raw/nba/` and re-downloads nothing it already has.
3. **Given** the moved data, **When** the maintainer runs `npm run build:rankings`, **Then** the processed output is byte-for-byte unchanged.
4. **Given** the moved data, **When** the summaries build later runs, **Then** it finds the NBA.com articles and `playoffs.json` in their new locations and does not regenerate summaries whose input text hasn't changed.
5. **Given** the moved data, **When** the maintainer runs the playoffs scraper, **Then** it writes to `data/raw/basketball-reference/playoffs.json`.

---

<<<<<<< HEAD
### User Story 5 - Browse the ESPN seasons in the app, with each season's source shown (Priority: P2)

A visitor opens the season dropdown and sees 2003-04 to 2015-16 listed under the NBA.com seasons, each with its champion's logo. Choosing one charts that season's weekly rankings just like an NBA.com season. A badge next to the season dropdown, and on each card of a team's history, says whether that season's rankings came from NBA.com or ESPN and links to the source.

**Why this priority**: The scraped archive only helps visitors once it's in the app, and mixing two writers' rankings needs the source shown so the change in voice and format isn't confusing.

**Independent Test**: Build the app, pick 2007-08 in the season dropdown, and confirm its chart, playoff medals and "Source: ESPN" badge appear. Pin a team, open its team history, and confirm every season card shows the right source badge.

**Acceptance Scenarios**:

1. **Given** the ESPN archive is saved, **When** `npm run build:rankings` runs, **Then** each ESPN season is written to `data/processed/seasons/` from its weekly editions (preseason and training camp editions are left out, as with NBA.com), and the NBA.com seasons are unchanged apart from the new `source` field.
2. **Given** the built app, **When** a visitor opens the season dropdown, **Then** all 22 seasons are listed, newest first, each completed season with its champion's logo.
3. **Given** any selected season, **When** the chart shows, **Then** a "Source: NBA.com" or "Source: ESPN" badge beside the season dropdown links to that source and names its writer on hover.
4. **Given** a pinned team's history, **When** it shows, **Then** each season card has its source badge, the "AI-generated summary" badge only appears on cards that have a summary, and clicking a source badge opens the source without leaving the history.
5. **Given** a pinned team in a season with no AI summary, **When** the visitor looks at the AI Summary button, **Then** it is disabled rather than opening an empty card.

---

### User Story 6 - Playoff results for the ESPN seasons (Priority: P2)

The playoffs scraper covers 2003-04 onward, so the ESPN seasons get champions, playoff medals and the Season Trends view, like the NBA.com seasons.

**Why this priority**: Without playoff results, older seasons look unfinished: no champion logo, no medals, and the summary buttons are hidden.

**Independent Test**: Run `npm run scrape:playoffs` and confirm it fetches only seasons not yet saved, then confirm `data/raw/basketball-reference/playoffs.json` has every season from 2003-04 with the right champions.

**Acceptance Scenarios**:

1. **Given** the playoffs file has 2017-18 onward, **When** the playoffs scraper runs, **Then** it fetches only 2003-04 to 2016-17 and leaves the saved seasons unchanged. With `--force` it fetches every season again.
2. **Given** a Basketball-Reference page naming a relocated or renamed franchise (SuperSonics, New Jersey Nets, Bobcats, New Orleans or New Orleans/Oklahoma City Hornets), **When** it is parsed, **Then** the team maps to the franchise's current slug.

---

### User Story 7 - Recover editions ESPN no longer serves (Priority: P3)

ESPN's week dropdowns still list the 2003-04 preseason and the 2004-05 preseason through week 18, but espn.com redirects those pages. The maintainer runs a separate recovery command that finds the Wayback Machine's copies of ESPN's 2003-05 pages, parses their older layout, and saves them alongside the rest of the archive.

**Why this priority**: It turns a 20-edition hole (most of the 2004-05 season) into a complete archive, but the rest of the feature works without it.

**Independent Test**: Delete a recovered 2004-05 edition, run the recovery command for 2004-05, and confirm it restores that edition from the Wayback Machine and nothing else.

**Acceptance Scenarios**:

1. **Given** a season with gaps between its preseason and last saved week, **When** the recovery command runs, **Then** it fetches archived pages only until every gap is filled or no archived copies remain, saves each as a normal edition with an `archiveUrl`, and adds it to the index.
2. **Given** an archived page whose heading names a different week or season, **When** it is fetched, **Then** it is never saved under the wrong edition.
3. **Given** recovered editions, **When** the main scraper re-runs, even with `--force`, **Then** it keeps the archived copies of weeks ESPN redirects.

---

=======
>>>>>>> master
### Edge Cases

- **Weeks that don't exist.** Seasons have different numbers of weeks. The 2011-12 lockout season had about 17. Requesting a week ESPN never published should be recorded as missing, not as a failure, and should not stop the run.
- **ESPN redirects a request.** A missing season or week sends the browser back to the current rankings page instead of returning an error. The scraper must spot this and treat it as "not published". It must not save the current page as if it were the requested edition.
- **Team count.** 2003-04 had 29 teams and later seasons have 30. Each edition lists however many teams ESPN ranked that week.
- **Relocated and renamed franchises.** Seattle SuperSonics, New Jersey Nets, Charlotte Bobcats, New Orleans Hornets and the New Orleans/Oklahoma City Hornets (2005-07) each map to the franchise's current standard identifier. ESPN's short names (e.g. "LA Clippers", "Golden State") are matched as well.
- **A team name that can't be matched.** The edition is still saved. The unmatched team is kept with an empty identifier and a warning is printed, so the problem is visible without losing data.
- **Wrong date stamps.** Some old pages carry dates that don't match their season (the 2003-04 final week says it was updated in October 2005). The season and week come from the edition's place in the archive, not the page's date.
<<<<<<< HEAD
- **No previous rank.** Some editions have no "last week" value. Every training camp edition is like this, and so are 2003-04 week 1 rows for a few teams. Previous rank is left empty rather than guessed.
- **Ties and skipped ranks.** ESPN occasionally printed two teams at the same rank and none at the next (2005-06 week 18 has two No. 13s, and 2004-05 week 3 has two No. 27s). The edition is kept as published, in ESPN's order, with a warning.
- **Empty tables and blank comments.** The 2010-11 training camp page has a heading but no team rows. It is saved with `hasStructuredRankings: false` and no rankings, with a warning. Blank comment cells (two in the 2005-06 training camp edition) are saved as empty, with a warning.
- **Hidden training camp editions.** The week dropdown never lists the training camp edition (week -1), though eleven seasons have one. The scraper always tries week -1, and a redirect there is skipped quietly rather than counted as missing.
- **Editions ESPN no longer serves.** ESPN redirects some weeks its dropdowns still list. These are reported as missing by the scraper and can be recovered from the Wayback Machine (User Story 7).
- **Mixed character encodings.** Pages are UTF-8 but contain stray Windows-1252 bytes (e.g. "5½ games out"). These are decoded as Windows-1252. A few ESPN pages contain genuinely broken byte sequences (2012-13 week 23 and the 2014-15 training camp edition), which are kept as U+FFFD.
=======
- **No previous rank.** Preseason editions (and the first edition of some seasons) have no "last week" value. Previous rank is left empty rather than guessed.
>>>>>>> master
- **Temporary network or server errors.** These are retried with increasing waits. An edition that still fails is counted as failed and the run continues.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The scraper MUST be a separate tool from the NBA.com scraper, with its own command. It MUST be runnable directly with Node and through an `npm run scrape:*` command.
- **FR-002**: By default the scraper MUST cover every published edition from the 2003-04 preseason through the final 2015-16 edition.
- **FR-003**: The maintainer MUST be able to limit the run to a range of seasons within 2003-04 to 2015-16. Ranges outside that span MUST be rejected with an explanation.
- **FR-004**: Each saved edition MUST record: source URL, title or headline (when present), author, publish/updated date as shown on the page, season (e.g. "2007-08"), week number (preseason identified separately), and the ranked team entries.
- **FR-005**: Each team entry MUST record: rank, previous rank (or empty), the team name as ESPN printed it, the team's standard identifier, the record as printed, and the comment as both the original markup and plain text.
- **FR-006**: The team identifier MUST use the same identifier scheme as the NBA.com data, so a team can be matched across both sources and across relocations.
- **FR-007**: Season and week MUST come from the edition's position in ESPN's archive, not from dates printed on the page.
- **FR-008**: Saved files MUST go under the project's raw data folder, in an ESPN-specific location that keeps them apart from NBA.com data. The layout MUST mirror the NBA.com scraper: one file per edition, grouped by season, plus an index file listing every edition.
- **FR-009**: Without the force option, the scraper MUST reuse saved editions and request only missing ones. With it, every edition MUST be requested again.
- **FR-010**: The scraper MUST wait between requests to ESPN (default at least as long as the NBA.com scraper's), allow the wait to be changed, and identify itself with a descriptive user agent.
- **FR-011**: Editions ESPN never published MUST be recorded as missing, not saved and not counted as failures.
- **FR-012**: The scraper MUST print progress for each edition and a final summary of fetched, skipped, missing and failed counts.
<<<<<<< HEAD
- **FR-013**: The scraper itself MUST NOT write app data. ESPN seasons reach the app only through `npm run build:rankings` (FR-019).
- **FR-019**: `npm run build:rankings` MUST build a processed season for every ESPN season from its weekly editions, using ESPN's printed record. Where a season exists in both sources, NBA.com MUST be used.
- **FR-020**: Every processed season MUST record its `source` (`nba` or `espn`), and the app MUST validate it like the rest of the season data.
- **FR-021**: The app MUST show the selected season's source as a badge beside the season dropdown and on each team-history season card. The badge MUST link to the source (NBA.com's Power Rankings page, or ESPN's page for that season) and name the writer on hover.
- **FR-022**: Team-history cards MUST only show the "AI-generated summary" badge when the card has a summary, and the AI Summary button MUST be disabled when the pinned team has no summary for the season.
- **FR-023**: The playoffs scraper MUST cover 2003-04 onward, map relocated and renamed franchises to current slugs, keep already-saved seasons unless `--force` is passed, and not depend on app source files for team names.
- **FR-024**: A separate recovery command MUST fill gaps from the Wayback Machine. A gap is any week from the preseason to a season's last saved week that isn't saved. The command MUST verify each archived page's heading before saving it, record its `archiveUrl`, add it to the index, pace requests (default 3 seconds) with the project's user agent, and request only what it needs.
- **FR-025**: The main scraper MUST keep a saved edition in the index when ESPN redirects that week, even with `--force`.
- **FR-026**: ESPN pages MUST be decoded so stray Windows-1252 bytes come out as the intended characters.
=======
- **FR-013**: The scraper MUST NOT change the existing app data. Feeding ESPN data into the app is out of scope.
>>>>>>> master
- **FR-015**: The NBA.com scraper's default output folder MUST be `data/raw/nba/`.
- **FR-016**: The existing NBA.com `index.json` and `articles/` MUST be moved from `data/raw/` to `data/raw/nba/`, and `playoffs.json` MUST be moved to `data/raw/basketball-reference/`. Contents stay unchanged and git history is kept where possible.
- **FR-017**: Every script and document that reads or writes this raw data MUST use the new locations. That covers the rankings build, the summaries build, their shared article loader, the NBA.com scraper, the playoffs scraper and both README files. No fallback to the old locations is kept. The constitution only requires raw data under `data/raw/`, so it needs no change.
- **FR-018**: The playoffs scraper MUST write to `data/raw/basketball-reference/playoffs.json`.
- **FR-014**: The scraper MUST have a help option describing its options, matching the NBA.com scraper's style.

### Key Entities

<<<<<<< HEAD
- **ESPN edition**: One weekly, preseason or training camp ESPN Power Rankings page for a given season. Attributes: source URL, headline, author, date as shown, season, week, its team entries, and an archive URL when it was recovered from the Wayback Machine.
- **Team entry**: One team's place in an edition. Attributes: rank, previous rank, team name as published, standard team identifier, record, and comment (markup and plain text).
- **Edition index**: A list of all saved editions with season, week, headline, date, team count and file location. Ordered so the newest edition is first, like the NBA.com index.
- **Processed season**: The app's data for one season (`data/processed/seasons/<season>.json`), now with a `source` of `nba` or `espn`.
=======
- **ESPN edition**: One weekly (or preseason) ESPN Power Rankings page for a given season. Attributes: source URL, headline, author, date as shown, season, week, and its team entries.
- **Team entry**: One team's place in an edition. Attributes: rank, previous rank, team name as published, standard team identifier, record, and comment (markup and plain text).
- **Edition index**: A list of all saved editions with season, week, headline, date, team count and file location. Ordered so the newest edition is first, like the NBA.com index.
>>>>>>> master

## Success Criteria *(mandatory)*

### Measurable Outcomes

<<<<<<< HEAD
- **SC-001**: The scraper plus the recovery command save at least 95% of the editions ESPN published between 2003-04 and 2015-16 (every edition its week dropdowns list, plus training camp editions), and each one lists every team ESPN ranked that week. Achieved: 329 editions, none missing.
- **SC-002**: Every team in every saved edition is matched to a standard team identifier, apart from any that are flagged in the run's warnings. The goal is zero unmatched teams.
- **SC-003**: Re-running after a complete run requests only the 13 season pages (which double as each season's final edition) and the training camp week of the 2 seasons that have none (2003-04 and 2011-12). It makes no other requests for editions.
- **SC-004**: A full run finishes unattended in under an hour at the default request delay.
- **SC-005**: Picking any saved edition at random, its ranks, records and comments match what the ESPN page shows.
- **SC-006**: After the move, the contents of the raw data, the processed app data and the results of existing tests are unchanged. Only the raw files' locations differ.
- **SC-007**: The built app lists all 22 seasons with champion logos, and every season shows the correct source badge beside the chart and in team history.
=======
- **SC-001**: A default run saves at least 95% of the editions ESPN published between 2003-04 and 2015-16 (about 300 or more), and each one lists every team ESPN ranked that week.
- **SC-002**: Every team in every saved edition is matched to a standard team identifier, apart from any that are flagged in the run's warnings. The goal is zero unmatched teams.
- **SC-003**: Re-running after a complete run makes no requests for editions, apart from any that previously failed or were missing.
- **SC-004**: A full run finishes unattended in under an hour at the default request delay.
- **SC-005**: Picking any saved edition at random, its ranks, records and comments match what the ESPN page shows.
- **SC-006**: After the move, the contents of the raw data, the processed app data and the results of existing tests are unchanged. Only the raw files' locations differ.
>>>>>>> master

## Assumptions

- "2003-2016" means the 2003-04 season through the 2015-16 season. These are the seasons ESPN still serves on its structured weekly rankings pages. Earlier seasons are not on ESPN's site, and from 2016-17 onward ESPN publishes rankings as ordinary articles in a different format.
- ESPN's season pages use the year the season ends (2007-08 is "2008"), with weeks numbered from preseason up to about 24.
- ESPN's robots.txt (checked 2026-10-25) does not block the rankings pages and sets no crawl delay. The scraper still waits between requests, as the project constitution requires.
- Each source has its own folder: `data/raw/nba/` for NBA.com, `data/raw/espn/` for ESPN and `data/raw/basketball-reference/` for playoffs. The build scripts read rankings only from the NBA.com folder, so they won't pick up ESPN files.
- The summaries build decides what to regenerate by hashing each team's input text, not by file path. Moving the raw files won't trigger regeneration, and the summaries build doesn't need to run to verify the move.
- Everything is by Marc Stein, but author is recorded per edition rather than assumed.
- ESPN's comments are shorter than NBA.com's and have no ratings or stats lines. The scraper saves what ESPN published and doesn't fill in missing fields.
<<<<<<< HEAD
- ESPN seasons get no AI summaries: generating them would mean running `build:summaries`, which spends API tokens and is outside this feature.
- The Wayback Machine sets no crawl delay. The recovery command waits 3 seconds between requests anyway, matching the playoffs scraper's Basketball-Reference pace.
- Charts use today's team names (e.g. "New Orleans Pelicans" for the 2000s Hornets). Showing historical names is a separate change.
=======
- Feeding ESPN rankings into the chart, summaries or build scripts is a separate future feature.
>>>>>>> master
