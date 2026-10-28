import { describe, expect, it, vi } from 'vitest'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)
import {
  getCareerAwardsHighlights,
  getSeasonAwardGroups,
  seasonAwards,
} from './awards'
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

describe('getCareerAwardsHighlights', () => {
  const highlights = (awards: Record<string, number>, limit?: number) =>
    getCareerAwardsHighlights(awards, limit).map(
      ({ award, times }) => `${award.label} x${times}`
    )

  it('returns the single most valuable award by default', () => {
    expect(highlights({ AS: 10, NBA1: 4, DEF2: 1 })).toEqual(['All-NBA 1st x4'])
  })

  it('ranks awards by value rather than by count', () => {
    expect(highlights({ NBA3: 5, DEF2: 3, AS: 1, NBA2: 2 }, 4)).toEqual([
      'All-Star x1',
      'All-NBA 2nd x2',
      'All-Defensive 2nd x3',
      'All-NBA 3rd x5',
    ])
  })

  it('ranks voted awards won with the team selections', () => {
    expect(
      highlights({ AS: 15, 'MVP-1': 4, 'DPOY-1': 1, NBA1: 9, 'ROY-1': 1 }, 5)
    ).toEqual(['MVP x4', 'DPOY x1', 'All-NBA 1st x9', 'All-Star x15', 'ROY x1'])
  })

  it('leaves out voting finishes', () => {
    expect(highlights({ 'MVP-2': 3, 'DPOY-5': 1, AS: 2 }, 3)).toEqual([
      'All-Star x2',
    ])
  })

  it('returns every award when the limit is above the number earned', () => {
    expect(highlights({ DEF1: 2, AS: 3 }, 10)).toEqual([
      'All-Defensive 1st x2',
      'All-Star x3',
    ])
  })

  it('returns nothing for a player without awards', () => {
    expect(highlights({})).toEqual([])
  })

  it('returns the award details with the count', () => {
    expect(getCareerAwardsHighlights({ NBA1: 2 })).toEqual([
      {
        award: {
          code: 'NBA1',
          label: 'All-NBA 1st',
          title: 'All-NBA First Team',
          kind: 'selection',
        },
        times: 2,
      },
    ])
  })
})
