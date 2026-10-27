import { describe, expect, it } from 'vitest'
import { seasonAwards } from './awards'

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
