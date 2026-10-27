import { describe, expect, it } from 'vitest'
import { ROSTERS } from 'test/fixtures'
import { Team, type RosterEntry } from 'types'
import { RATING_BANDS, isRatable, statRating } from './statRating'

const regular = (stats: Partial<RosterEntry>): RosterEntry => ({
  ...ROSTERS[Team.Boston]![0],
  g: 60,
  mpg: 25,
  ...stats,
})

describe('RATING_BANDS', () => {
  it('covers every rating once and adds up to 100%', () => {
    expect(RATING_BANDS.map((band) => band.rating).sort()).toEqual([
      'elite',
      'fair',
      'good',
      'poor',
    ])
    expect(RATING_BANDS.reduce((sum, band) => sum + band.percent, 0)).toBe(100)
  })
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

  it('rates blocks', () => {
    expect(statRating(regular({ blk: 0.1 }), 'blk')).toBe('poor')
    expect(statRating(regular({ blk: 0.2 }), 'blk')).toBe('fair')
    expect(statRating(regular({ blk: 0.5 }), 'blk')).toBe('fair')
    expect(statRating(regular({ blk: 0.6 }), 'blk')).toBe('good')
    expect(statRating(regular({ blk: 0.9 }), 'blk')).toBe('good')
    expect(statRating(regular({ blk: 1.0 }), 'blk')).toBe('elite')
    expect(statRating(regular({ blk: 1.6 }), 'blk')).toBe('elite')
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

describe('isRatable', () => {
  it('requires at least 10 games and 10 minutes per game', () => {
    expect(isRatable(regular({ g: 9 }))).toBe(false)
    expect(isRatable(regular({ mpg: 9.9 }))).toBe(false)
    expect(isRatable(regular({ mpg: 9.96 }))).toBe(false)
    expect(isRatable(regular({ g: 10, mpg: 10 }))).toBe(true)
  })
})
