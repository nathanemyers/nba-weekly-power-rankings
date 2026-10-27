import { describe, expect, it, vi } from 'vitest'
import { getPlayerHistory } from './playerHistory'
import { loadAllSeasons, type Season } from './seasonData'
import { Team, type RosterEntry } from 'types'
import { ROSTERS } from 'test/fixtures'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const summary = (seasons: Season[], id: string) =>
  getPlayerHistory(seasons, id).map((stint) => `${stint.season} ${stint.team}`)

describe('getPlayerHistory', () => {
  it('lists every season the player appears in, oldest first', async () => {
    const seasons = await loadAllSeasons()
    expect(summary(seasons, 'piercpa01')).toEqual(['short det', 'long bos'])
    expect(getPlayerHistory(seasons, 'piercpa01')[0].player.pts).toBe(21)
  })

  it('keeps a traded player to the stint with each team', async () => {
    expect(summary(await loadAllSeasons(), 'movesjo01')).toEqual(['long bos'])
  })

  it('orders a three-team season in the order the player moved', () => {
    const base = ROSTERS.bos![0]
    const team = (teamId: Team, player: Partial<RosterEntry>) =>
      ({
        teamId,
        roster: [{ ...base, id: 'tripsjo01', ...player }],
      }) as Season['teams'][number]
    const season = {
      name: 'trips',
      teams: [
        team(Team.Chicago, { joinedFrom: Team.Toronto }),
        team(Team.LALakers, { leftFor: Team.Toronto }),
        team(Team.Toronto, {
          joinedFrom: Team.LALakers,
          leftFor: Team.Chicago,
        }),
      ],
    } as Season
    expect(summary([season], 'tripsjo01')).toEqual([
      'trips lal',
      'trips tor',
      'trips chi',
    ])
  })

  it('returns nothing for an unknown player', async () => {
    expect(getPlayerHistory(await loadAllSeasons(), 'zzzzzz99')).toEqual([])
  })
})
