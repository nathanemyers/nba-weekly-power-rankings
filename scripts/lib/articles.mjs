// Reads the scraped articles in /data/raw into per-season, per-team weekly entries.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// NBA team IDs as they appear in the scraped rankings, mapped to the team ids used in src/types.ts
export const TEAM_SLUGS = {
  1610612737: 'atl', 1610612738: 'bos', 1610612751: 'bkn', 1610612766: 'cha',
  1610612741: 'chi', 1610612739: 'cle', 1610612742: 'dal', 1610612743: 'den',
  1610612765: 'det', 1610612744: 'gsw', 1610612745: 'hou', 1610612754: 'ind',
  1610612746: 'lac', 1610612747: 'lal', 1610612763: 'mem', 1610612748: 'mia',
  1610612749: 'mil', 1610612750: 'min', 1610612740: 'nop', 1610612752: 'nyk',
  1610612760: 'okc', 1610612753: 'orl', 1610612755: 'phi', 1610612756: 'phx',
  1610612757: 'por', 1610612758: 'sac', 1610612759: 'sas', 1610612761: 'tor',
  1610612762: 'uta', 1610612764: 'was',
}

// Returns { [season]: { maxWeek, weekCount, teams: { [slug]: [{ week, rank, teamName, summaryText }] } } }
export function loadSeasonEntries(dataDir) {
  const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf8'))
  const weeklyArticles = index
    .filter((a) => a.week != null && a.hasStructuredRankings && /power rankings/i.test(a.title))
    .sort((a, b) => a.week - b.week)

  const seasons = {}
  const seenWeeks = {}
  for (const article of weeklyArticles) {
    const season = (seasons[article.season] ??= { maxWeek: 0, weekCount: 0, teams: {} })
    const seen = (seenWeeks[article.season] ??= {})
    // The same week can be indexed twice (e.g. a `_v2` re-scrape); keep the first
    if (seen[article.week]) continue
    seen[article.week] = true
    season.weekCount += 1
    season.maxWeek = Math.max(season.maxWeek, article.week)

    const articleJson = JSON.parse(readFileSync(join(dataDir, article.file), 'utf8'))
    const seenTeams = {}
    for (const entry of articleJson.rankings) {
      const slug = TEAM_SLUGS[entry.teamId]
      // Some scrapes list a team twice in one week; keep the first
      if (!slug || seenTeams[slug]) continue
      seenTeams[slug] = true
      ;(season.teams[slug] ??= []).push({
        week: article.week,
        rank: entry.rank,
        teamName: entry.teamName,
        summaryText: entry.summaryText,
      })
    }
  }
  return seasons
}
