import { describe, expect, it } from 'vitest'
import { Team } from 'types'
import { parseSeason } from './seasonData'
import { getMostDeclinedTeams, getMostImprovedTeams } from './analysis'
import { weeklyRankings } from 'test/fixtures'

// Weeks 1-2 hold the start rank (week 1 is preseason), every later week holds the end rank
const swing = (start: number, end: number) =>
  weeklyRankings(10, end).map((r) => (r.week <= 2 ? { ...r, rank: start } : r))

const season = parseSeason('swings', {
  season: 'swings',
  source: 'nba',
  maxWeek: 10,
  rankings: {
    atl: swing(20, 5),
    bos: swing(10, 2),
    bkn: swing(12, 4),
    cha: swing(3, 3),
    chi: swing(15, 10),
    cle: swing(8, 6),
    dal: swing(1, 20),
    den: swing(4, 14),
    det: swing(6, 12),
    gsw: swing(5, 9),
    hou: swing(7, 11),
    ind: swing(9, 9),
    lac: weeklyRankings(1, 13),
  },
})

describe('getMostImprovedTeams', () => {
  it('returns the 5 biggest risers, largest first, ties by team id', () => {
    expect(getMostImprovedTeams(season)).toEqual([
      { team: Team.Atlanta, value: 15 },
      { team: Team.Brooklyn, value: 8 },
      { team: Team.Boston, value: 8 },
      { team: Team.Chicago, value: 5 },
      { team: Team.Cleveland, value: 2 },
    ])
  })
})

describe('getMostDeclinedTeams', () => {
  it('returns the 5 biggest fallers, largest first, ties by team id', () => {
    expect(getMostDeclinedTeams(season)).toEqual([
      { team: Team.Dallas, value: -19 },
      { team: Team.Denver, value: -10 },
      { team: Team.Detroit, value: -6 },
      { team: Team.GoldenState, value: -4 },
      { team: Team.Houston, value: -4 },
    ])
  })

  it('treats a team with a single ranking as unchanged', () => {
    const all = getMostDeclinedTeams(season, season.teams.length)
    expect(all.find((t) => t.team === Team.LAClippers)).toEqual({
      team: Team.LAClippers,
      value: 0,
    })
  })
})
