import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { omit } from 'lodash'
import { buildRankings, PLAYOFFS } from 'test/fixtures'
import { Team } from 'types'
import { loadSeasons } from './loadSeasons'

const valid = (maxWeek = 4) => ({
  season: 'valid',
  source: 'nba',
  maxWeek,
  rankings: buildRankings(maxWeek),
  playoffs: PLAYOFFS,
})

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

describe('loadSeasons', () => {
  it('builds a view of ranked teams for a valid season', () => {
    const state = loadSeasons(['valid'], { valid: valid() })
    expect(state.order).toEqual(['valid'])
    expect(state.invalidSeasons).toEqual([])
    const view = state.seasons.valid
    expect(view.maxWeek).toBe(4)
    expect(view.completed).toBe(true)
    expect(view.champion).toBe(Team.Boston)
    expect(view.teams.map((t) => t.teamId).sort()).toEqual(
      [Team.Boston, Team.Detroit, Team.LALakers, Team.Miami].sort()
    )
  })

  it('is not completed without a champion', () => {
    const noPlayoffs = omit(valid(), 'playoffs')
    const view = loadSeasons(['s'], { s: noPlayoffs }).seasons.s
    expect(view.completed).toBe(false)
    expect(view.champion).toBeUndefined()
  })

  it('accepts a ranking without a record', () => {
    const season = valid()
    season.rankings[Team.Boston] = [{ week: 1, rank: 1, summary: 'x' }]
    expect(loadSeasons(['s'], { s: season }).order).toEqual(['s'])
  })

  const noMaxWeek = omit(valid(), 'maxWeek')
  const cases: [string, unknown, string][] = [
    ['a missing maxWeek', noMaxWeek, 'maxWeek'],
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
      'an unknown playoff stage',
      { ...valid(), playoffs: { [Team.Boston]: 'winner' } },
      'playoffs',
    ],
  ]

  it.each(cases)('rejects %s and keeps valid seasons', (_, bad, field) => {
    const state = loadSeasons(['bad', 'good'], { bad, good: valid() })
    expect(state.order).toEqual(['good'])
    expect(state.seasons.bad).toBeUndefined()
    expect(state.invalidSeasons).toHaveLength(1)
    expect(state.invalidSeasons[0].season).toBe('bad')
    expect(state.invalidSeasons[0].message).toContain(field)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('bad'))
  })
})
