import { describe, expect, it } from 'vitest'
import { legacyHashTarget } from './legacyHash'

const base = '/nba-weekly-power-rankings'

describe('legacyHashTarget', () => {
  it.each([
    ['#/2018-19', '/nba-weekly-power-rankings/2018-19'],
    ['#/teamHistory/bos', '/nba-weekly-power-rankings/teamHistory/bos'],
    [
      '#/playerHistory/jamesle01',
      '/nba-weekly-power-rankings/playerHistory/jamesle01',
    ],
    ['#/', '/nba-weekly-power-rankings/'],
  ])('maps %s to its plain address', (hash, expected) => {
    expect(legacyHashTarget(base, hash, '')).toBe(expected)
  })

  it.each(['', '#', '#section'])('leaves hash %j alone', (hash) => {
    expect(legacyHashTarget(base, hash, '')).toBeNull()
  })

  it('keeps the query string', () => {
    expect(legacyHashTarget(base, '#/2018-19', '?ref=x')).toBe(
      '/nba-weekly-power-rankings/2018-19?ref=x'
    )
  })

  it('works when the site is served from the domain root', () => {
    expect(legacyHashTarget('', '#/2018-19', '')).toBe('/2018-19')
  })
})
