import { describe, expect, it } from 'vitest'
import { ROSTERS } from 'test/fixtures'
import { Team, type RosterEntry } from 'types'
import { statRating } from './statRating'

const regular = (stats: Partial<RosterEntry>): RosterEntry => ({
  ...ROSTERS[Team.Boston]![0],
  g: 60,
  mpg: 25,
  ...stats,
})

describe('statRating', () => {
  it('rates below the low cut poor, up to the high cut fair, and from the high cut good', () => {
    expect(statRating(regular({ pts: 5.9 }), 'pts')).toBe('poor')
    expect(statRating(regular({ pts: 6 }), 'pts')).toBe('fair')
    expect(statRating(regular({ pts: 13.4 }), 'pts')).toBe('fair')
    expect(statRating(regular({ pts: 13.5 }), 'pts')).toBe('good')
  })

  it('rates the top 10% elite', () => {
    expect(statRating(regular({ pts: 18.9 }), 'pts')).toBe('good')
    expect(statRating(regular({ pts: 19 }), 'pts')).toBe('elite')
    expect(statRating(regular({ stl: 1.4 }), 'stl')).toBe('elite')
    expect(statRating(regular({ per: 20 }), 'per')).toBe('elite')
  })

  it('treats fewer turnovers as better', () => {
    expect(statRating(regular({ tov: 0.5 }), 'tov')).toBe('elite')
    expect(statRating(regular({ tov: 0.6 }), 'tov')).toBe('good')
    expect(statRating(regular({ tov: 0.8 }), 'tov')).toBe('good')
    expect(statRating(regular({ tov: 1.2 }), 'tov')).toBe('fair')
    expect(statRating(regular({ tov: 1.8 }), 'tov')).toBe('poor')
  })

  it('rates PER, including a negative one', () => {
    expect(statRating(regular({ per: 17 }), 'per')).toBe('good')
    expect(statRating(regular({ per: 19.9 }), 'per')).toBe('good')
    expect(statRating(regular({ per: -2 }), 'per')).toBe('poor')
  })

  it('leaves a missing PER unrated', () => {
    expect(statRating(regular({ per: null }), 'per')).toBeUndefined()
  })

  it('leaves players under 10 games or 10 minutes per game unrated', () => {
    expect(statRating(regular({ g: 9, pts: 20 }), 'pts')).toBeUndefined()
    expect(statRating(regular({ mpg: 9.9, pts: 20 }), 'pts')).toBeUndefined()
    expect(statRating(regular({ g: 10, mpg: 10, pts: 20 }), 'pts')).toBe(
      'elite'
    )
  })
})
