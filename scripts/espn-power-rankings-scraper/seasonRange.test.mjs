import { describe, expect, it } from 'vitest'
import { parseSeasonRange } from './seasonRange.mjs'

describe('parseSeasonRange', () => {
  it('defaults to the whole archive', () => {
    expect(parseSeasonRange()).toEqual({ fromEndYear: 2004, toEndYear: 2016 })
  })

  it('accepts a single season', () => {
    expect(parseSeasonRange('2007-08', '2007-08')).toEqual({ fromEndYear: 2008, toEndYear: 2008 })
  })

  it('accepts a range across a decade', () => {
    expect(() => parseSeasonRange('2009-10', '2010-11')).not.toThrow()
  })

  it.each([
    ['2001-02', '2015-16'],
    ['2003-04', '2016-17'],
    ['2007-09', '2015-16'],
    ['2007', '2015-16'],
    ['2010-11', '2007-08'],
  ])('rejects %s to %s with the supported range', (from, to) => {
    expect(() => parseSeasonRange(from, to)).toThrow(/2003-04 to 2015-16/)
  })
})
