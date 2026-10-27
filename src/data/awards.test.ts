import { describe, expect, it, vi } from 'vitest'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)
import { getSeasonAwardGroups, seasonAwards } from './awards'
import { loadSeason } from './seasonData'

const labels = (codes: string[]) =>
  seasonAwards(codes).map((award) => award.label)

describe('seasonAwards', () => {
  it('names a won award, a team selection and a voting finish', () => {
    expect(seasonAwards(['MVP-1', 'NBA1', 'DPOY-2'])).toEqual([
      {
        code: 'MVP-1',
        label: 'MVP',
        title: 'Most Valuable Player',
        kind: 'won',
      },
      {
        code: 'NBA1',
        label: 'All-NBA 1st',
        title: 'All-NBA First Team',
        kind: 'selection',
      },
      {
        code: 'DPOY-2',
        label: 'DPOY 2nd',
        title: '2nd in Defensive Player of the Year voting',
        kind: 'vote',
      },
    ])
  })

  it('lists awards won, then selections, then voting finishes best first', () => {
    expect(labels(['MVP-7', 'DPOY-2', 'AS', 'NBA2', 'DEF1', 'CPOY-1'])).toEqual(
      [
        'CPOY',
        'All-NBA 2nd',
        'All-Defensive 1st',
        'All-Star',
        'DPOY 2nd',
        'MVP 7th',
      ]
    )
  })

  it('writes ordinals for 3rd, 11th, 12th, 13th and 21st', () => {
    expect(labels(['ROY-3', '6MOY-11', 'MIP-12', 'DPOY-13', 'MVP-21'])).toEqual(
      ['ROY 3rd', '6MOY 11th', 'MIP 12th', 'DPOY 13th', 'MVP 21st']
    )
  })

  it('returns nothing when there are no awards', () => {
    expect(seasonAwards(undefined)).toEqual([])
  })
})

describe('getSeasonAwardGroups', () => {
  it('lists each award won and team selection with its players, leaving out voting finishes', async () => {
    const groups = getSeasonAwardGroups(await loadSeason('long'))
    expect(
      groups.map((group) => [
        group.code,
        group.title,
        group.players.map((player) => `${player.name} ${player.team}`),
      ])
    ).toEqual([
      ['MVP-1', 'Most Valuable Player', ['Kevin Garnett bos']],
      ['DPOY-1', 'Defensive Player of the Year', ['Kevin Garnett bos']],
      ['NBA1', 'All-NBA First Team', ['Kevin Garnett bos']],
      ['NBA2', 'All-NBA Second Team', ['Paul Pierce bos']],
      ['DEF1', 'All-Defensive First Team', ['Kevin Garnett bos']],
      ['AS', 'All-Star', ['Kevin Garnett bos', 'Paul Pierce bos']],
    ])
  })

  it('returns nothing for a season without awards', async () => {
    expect(getSeasonAwardGroups(await loadSeason('short'))).toEqual([])
  })
})
