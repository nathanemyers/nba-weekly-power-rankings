import {
  buildRankings,
  COACHES,
  PLAYOFF_SERIES,
  PLAYOFFS,
  ROSTERS,
} from './fixtures'

// Builds a data/seasons module mock from raw season fixtures, newest first
export function mockSeasonModule(
  seasonData: Record<string, Record<string, unknown>>,
  champions: Record<string, string> = {}
) {
  const names = Object.keys(seasonData)
  return {
    seasonIndex: names.map((name) => ({
      name,
      source: seasonData[name].source,
      ...(champions[name] && { champion: champions[name] }),
    })),
    seasonLoaders: Object.fromEntries(
      names.map((name) => [
        name,
        () => Promise.resolve({ default: seasonData[name] }),
      ])
    ),
  }
}

// Two fixture seasons: a 26-week season and one shorter than the zoom window
export const mockSeasons = mockSeasonModule(
  {
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
      rosters: {
        det: [{ ...ROSTERS.bos![0], g: 70, pts: 21, awards: undefined }],
      },
    },
  },
  { long: 'bos' }
)
