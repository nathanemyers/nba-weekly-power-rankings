# Quickstart: Validating playoff series badges

Run from the repo root. Never run `npm run build:summaries`.

## 1. Data

```bash
npm run scrape:playoffs
```
The first run after the change fetches all 23 seasons once, about 70 s, because none have scores yet. Each summary line shows series scores.

```bash
npm run scrape:playoffs
```
The second run fetches nothing (FR-002).

```bash
node -e "const p=require('./data/raw/basketball-reference/playoffs.json');for(const [s,v] of Object.entries(p)){const n=v.rounds.flatMap(r=>r.series).length;const bad=v.rounds.flatMap(r=>r.series).filter(x=>x.winnerWins!==4||x.loserWins<0||x.loserWins>3);console.log(s,n,bad.length)}"
```
Expect every season to print `15 0` (SC-001).

```bash
npm run build:rankings && git diff --stat data/processed
```
Every season with playoffs gains `playoffSeries`. Its `playoffs` stage map is unchanged (FR-010). Check with `git diff` that only the new key differs.

## 2. Tests

```bash
npm test
```
New suites:
- `scripts/lib/playoffs.test.mjs`: series-table parsing from a synthetic fixture, the bracket and score match, `hasSeriesScores`, `teamPlayoffRuns` ordering and validation errors.
- `src/components/PlayoffSeriesBadges.test.tsx`: badge count, games, medals (including crown vs. cup), won/lost styling hooks, accessible names, and empty input.
- App tests: badges appear in the chart view only with one team pinned, and on team-history cards. Clicking a badge on a card stays on the history.

## 3. Spot checks (SC-003)

Build and serve the production preview (`npm run build`, then `npm run preview`). Pin a team, and compare its chart-view and team-history badges with these runs:

| Season / team | Expected badges |
|---|---|
| 2015-16 Cleveland | DET 4 🥉 green · ATL 4 🥈 green · TOR 6 🥇 green · GSW 7 👑 green |
| 2015-16 Golden State | HOU 5 🥉 green · POR 5 🥈 green · OKC 7 🥇 green · CLE 7 🏆 red |
| 2006-07 Dallas | GSW 6 🥉 red |
| 2007-08 Boston | ATL 7 🥉 green · CLE 7 🥈 green · DET 6 🥇 green · LAL 6 👑 green |
| 2020-21 Milwaukee | MIA 4 🥉 green · BKN 7 🥈 green · ATL 6 🥇 green · PHX 6 👑 green |

Also check:
- A team that missed the playoffs shows no badges and no gap.
- Tooltips appear on hover and keyboard focus.
- At 375 px wide, four badges fit without horizontal scroll.

## 4. Gates

```bash
npm run lint
```

```bash
npm run build
```
