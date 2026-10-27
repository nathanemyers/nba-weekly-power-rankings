import { describe, expect, it, vi } from 'vitest'
import {
  getAllPlayers,
  getPlayerHistory,
  searchPlayers,
  type PlayerSummary,
} from './playerHistory'
import { loadAllSeasons, type Season } from './seasonData'
import { PlayoffStage, Team, type RosterEntry } from 'types'
import { ROSTERS } from 'test/fixtures'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const summary = (seasons: Season[], id: string) =>
  getPlayerHistory(seasons, id).map((stint) => `${stint.season} ${stint.team}`)

describe('getPlayerHistory', () => {
  it('lists every season the player appears in, newest first', async () => {
    const seasons = await loadAllSeasons()
    expect(summary(seasons, 'piercpa01')).toEqual(['long bos', 'short det'])
    expect(getPlayerHistory(seasons, 'piercpa01')[1].player.pts).toBe(21)
  })

  it('keeps a traded player to the stint with each team', async () => {
    expect(summary(await loadAllSeasons(), 'movesjo01')).toEqual(['long bos'])
  })

  it('lists a three-team season from the latest team back', () => {
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
      'trips chi',
      'trips tor',
      'trips lal',
    ])
  })

  it("gives a stint its team's playoff finish unless the player left mid-season", async () => {
    const seasons = await loadAllSeasons()
    expect(
      getPlayerHistory(seasons, 'piercpa01').map((stint) => stint.playoff)
    ).toEqual([PlayoffStage.Champion, undefined])
    expect(getPlayerHistory(seasons, 'scrubjo01')[0].playoff).toBeUndefined()
  })

  it('returns nothing for an unknown player', async () => {
    expect(getPlayerHistory(await loadAllSeasons(), 'zzzzzz99')).toEqual([])
  })
})

describe('getAllPlayers', () => {
  it('lists each player once by name with their first and last season', async () => {
    const players = getAllPlayers(await loadAllSeasons())
    expect(players.map((player) => player.name)).toEqual([
      'Chauncey Billups',
      'Joe Moves',
      'Joe Scrub',
      'Kevin Garnett',
      'Paul Pierce',
    ])
    expect(players.find((player) => player.id === 'piercpa01')).toEqual({
      id: 'piercpa01',
      name: 'Paul Pierce',
      firstSeason: 'short',
      lastSeason: 'long',
    })
  })
})

describe('searchPlayers', () => {
  const player = (id: string, name: string): PlayerSummary => ({
    id,
    name,
    firstSeason: '2003-04',
    lastSeason: '2003-04',
  })
  const players = [
    player('curryst01', 'Stephen Curry'),
    player('curryse01', 'Seth Curry'),
    player('vujacsa01', 'Sasha Vujačić'),
    player('onealsh01', "Shaquille O'Neal"),
  ]
  const ids = (query: string, limit = 20) =>
    searchPlayers(players, query, limit).map((found) => found.id)

  it('matches the start of any word, in any order, ignoring case', () => {
    expect(ids('curry')).toEqual(['curryst01', 'curryse01'])
    expect(ids('cur ste')).toEqual(['curryst01'])
    expect(ids('URRY')).toEqual([])
  })

  it('ignores accents and splits on apostrophes', () => {
    expect(ids('vujacic')).toEqual(['vujacsa01'])
    expect(ids('neal')).toEqual(['onealsh01'])
  })

  it('returns nothing for a blank query and stops at the limit', () => {
    expect(ids('  ')).toEqual([])
    expect(ids('s', 2)).toEqual(['curryst01', 'curryse01'])
  })
})
