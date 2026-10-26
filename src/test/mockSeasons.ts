import {
  buildRankings,
  COACHES,
  PLAYOFF_SERIES,
  PLAYOFFS,
  ROSTERS,
} from './fixtures'

// Two fixture seasons for store tests: a 26-week season and one shorter than the zoom window
export const mockSeasons = {
  seasons: ['long', 'short'],
  seasonData: {
    long: {
      season: 'long',
      source: 'nba',
      maxWeek: 26,
      rankings: buildRankings(26),
      playoffs: PLAYOFFS,
      playoffSeries: PLAYOFF_SERIES,
      summaries: { bos: 'Boston led from the first week.' },
      rosters: ROSTERS,
      coaches: COACHES,
    },
    short: {
      season: 'short',
      source: 'espn',
      maxWeek: 8,
      rankings: buildRankings(8),
    },
  },
}
