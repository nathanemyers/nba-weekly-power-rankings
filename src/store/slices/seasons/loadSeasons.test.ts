import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { omit } from 'lodash'
import { buildRankings, COACHES, PLAYOFFS, ROSTERS } from 'test/fixtures'
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

  it("puts each team's roster on the team", () => {
    const view = loadSeasons(['s'], { s: { ...valid(), rosters: ROSTERS } })
      .seasons.s
    const boston = view.teams.find((t) => t.teamId === Team.Boston)
    const miami = view.teams.find((t) => t.teamId === Team.Miami)
    expect(boston?.roster).toEqual(ROSTERS[Team.Boston])
    expect(miami?.roster).toBeUndefined()
  })

  it("puts each team's head coaches on the team", () => {
    const view = loadSeasons(['s'], { s: { ...valid(), coaches: COACHES } })
      .seasons.s
    const boston = view.teams.find((t) => t.teamId === Team.Boston)
    expect(boston?.coaches).toEqual(COACHES[Team.Boston])
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
