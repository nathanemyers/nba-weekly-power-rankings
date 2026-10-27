import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { omit } from 'lodash'
import { buildRankings, COACHES, PLAYOFFS, ROSTERS } from 'test/fixtures'
import { Team } from 'types'
import {
  loadAllSeasons,
  loadSeason,
  parseSeason,
  seasonIndex,
} from './seasonData'

// Each season name is used by one test only, because loaded seasons stay cached for the module's life
const loaders = vi.hoisted(() => ({
  cached: vi.fn(),
  flaky: vi.fn(),
  good: vi.fn(),
  broken: vi.fn(),
}))

vi.mock('data/seasons', () => ({
  seasonIndex: [
    { name: 'good', source: 'nba' },
    { name: 'broken', source: 'nba' },
    { name: 'cached', source: 'nba' },
    { name: 'flaky', source: 'nba' },
    { name: '', source: 'nba' },
  ],
  seasonLoaders: loaders,
}))

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

const valid = (maxWeek = 4) => ({
  season: 'valid',
  source: 'nba',
  maxWeek,
  rankings: buildRankings(maxWeek),
  playoffs: PLAYOFFS,
})

describe('parseSeason', () => {
  it('builds a view of ranked teams for a valid season', () => {
    const view = parseSeason('valid', valid())
    expect(view.name).toBe('valid')
    expect(view.maxWeek).toBe(4)
    expect(view.completed).toBe(true)
    expect(view.champion).toBe(Team.Boston)
    expect(view.teams.map((t) => t.teamId).sort()).toEqual(
      [Team.Boston, Team.Detroit, Team.LALakers, Team.Miami].sort()
    )
  })

  it('is not completed without a champion', () => {
    const view = parseSeason('s', omit(valid(), 'playoffs'))
    expect(view.completed).toBe(false)
    expect(view.champion).toBeUndefined()
  })

  it('accepts a ranking without a record', () => {
    const season = valid()
    season.rankings[Team.Boston] = [{ week: 1, rank: 1, summary: 'x' }]
    expect(parseSeason('s', season).name).toBe('s')
  })

  it("puts each team's roster on the team", () => {
    const view = parseSeason('s', { ...valid(), rosters: ROSTERS })
    const boston = view.teams.find((t) => t.teamId === Team.Boston)
    const miami = view.teams.find((t) => t.teamId === Team.Miami)
    expect(boston?.roster).toEqual(ROSTERS[Team.Boston])
    expect(miami?.roster).toBeUndefined()
  })

  it("puts each team's head coaches on the team", () => {
    const view = parseSeason('s', { ...valid(), coaches: COACHES })
    const boston = view.teams.find((t) => t.teamId === Team.Boston)
    expect(boston?.coaches).toEqual(COACHES[Team.Boston])
  })

  const cases: [string, unknown, string][] = [
    ['a missing maxWeek', omit(valid(), 'maxWeek'), 'maxWeek'],
    [
      'a string rank',
      {
        ...valid(),
        rankings: { [Team.Boston]: [{ week: 1, rank: '1', summary: 'x' }] },
      },
      'rank',
    ],
    [
      'an unknown team',
      { ...valid(), rankings: { ...buildRankings(4), xyz: [] } },
      'rankings',
    ],
    [
      'a roster entry with no games',
      {
        ...valid(),
        rosters: {
          [Team.Boston]: [{ ...ROSTERS[Team.Boston]![0], g: 0 }],
        },
      },
      'rosters',
    ],
    [
      'a coach with no games',
      {
        ...valid(),
        coaches: { [Team.Boston]: [{ id: 'x', name: 'X', g: 0, w: 0, l: 0 }] },
      },
      'coaches',
    ],
    [
      'an unknown playoff stage',
      { ...valid(), playoffs: { [Team.Boston]: 'winner' } },
      'playoffs',
    ],
  ]

  it.each(cases)('rejects %s naming the season and field', (_, bad, field) => {
    expect(() => parseSeason('bad', bad)).toThrow(/Season bad/)
    expect(() => parseSeason('bad', bad)).toThrow(new RegExp(field))
  })
})

describe('season index', () => {
  it('drops entries that fail validation and keeps the order', () => {
    expect(seasonIndex.map((e) => e.name)).toEqual([
      'good',
      'broken',
      'cached',
      'flaky',
    ])
  })
})

describe('loadSeason', () => {
  const mod = (raw: unknown) => Promise.resolve({ default: raw })

  it('downloads and parses a season once per visit', async () => {
    loaders.cached.mockReturnValue(mod(valid()))
    const first = await loadSeason('cached')
    const second = await loadSeason('cached')
    expect(second).toBe(first)
    expect(loaders.cached).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid data and retries on the next request', async () => {
    loaders.flaky.mockReturnValueOnce(mod({ season: 'flaky' }))
    await expect(loadSeason('flaky')).rejects.toThrow(/Season flaky/)

    loaders.flaky.mockReturnValueOnce(mod(valid()))
    await expect(loadSeason('flaky')).resolves.toMatchObject({ name: 'flaky' })
    expect(loaders.flaky).toHaveBeenCalledTimes(2)
  })

  it('rejects a season that is not in the index', async () => {
    await expect(loadSeason('nope')).rejects.toThrow(/Unknown season nope/)
  })
})

describe('loadAllSeasons', () => {
  it('skips seasons that fail and keeps index order', async () => {
    loaders.good.mockReturnValue(Promise.resolve({ default: valid() }))
    loaders.broken.mockReturnValue(Promise.reject(new Error('offline')))
    loaders.cached.mockReturnValue(Promise.resolve({ default: valid() }))
    loaders.flaky.mockReturnValue(Promise.resolve({ default: valid() }))

    const seasons = await loadAllSeasons()
    expect(seasons.map((s) => s.name)).toEqual(['good', 'cached', 'flaky'])
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'offline' })
    )
  })
})
