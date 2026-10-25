import { describe, expect, it } from 'vitest'
import { editionUrl, parseSeasonPage, seasonLabel, seasonUrl } from './seasonPage.mjs'

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

const page = (endYear, heading, weeks) =>
  `<table class="tablehead"><tr class="stathead"><td colspan=5>${heading}</td></tr></table>` +
  `<div class="floatleft">Week: <form><select class="tablesm"><option value="#">Select One</option>` +
  weeks.map((w) => `<option value="//www.espn.com/nba/powerrankings/_/year/${endYear}/week/${w}">${w}</option>`).join('') +
  `</select></form></div><select class="tablesm"><option value="/nba/teams/powerranking?team=atl">Atlanta</option></select>`

describe('seasonPage', () => {
  it('builds season labels and URLs', () => {
    expect(seasonLabel(2008)).toBe('2007-08')
    expect(seasonLabel(2000)).toBe('1999-00')
    expect(seasonUrl(2008)).toBe('https://www.espn.com/nba/powerrankings/_/year/2008')
    expect(editionUrl(2013, -1)).toBe('https://www.espn.com/nba/powerrankings/_/year/2013/week/-1')
  })

  it('reads the final week from the heading and lists the other weeks once each', () => {
    const html = page(2008, '2007-08 Power Rankings: Week 24', [0, ...range(1, 23), 0])
    expect(parseSeasonPage(html, 2008)).toEqual({ finalWeek: 24, otherWeeks: range(0, 23) })
  })

  it('drops the final week from the list when the dropdown includes it', () => {
    const html = page(2013, '2012-13 Power Rankings: Week 17', [-1, -1, 0, ...range(1, 23), 17])
    expect(parseSeasonPage(html, 2013)).toEqual({
      finalWeek: 17,
      otherWeeks: [-1, 0, ...range(1, 16), ...range(18, 23)],
    })
  })

  it('maps training camp and preseason headings to weeks -1 and 0', () => {
    expect(parseSeasonPage(page(2013, '2012-13 Power Rankings: Training Camp', [0]), 2013).finalWeek).toBe(-1)
    expect(parseSeasonPage(page(2016, '2015-16 Power Rankings: Preseason', [1]), 2016).finalWeek).toBe(0)
  })

  it('throws when the heading has no week', () => {
    expect(() => parseSeasonPage('<html></html>', 2008)).toThrow(/2007-08/)
  })
})
