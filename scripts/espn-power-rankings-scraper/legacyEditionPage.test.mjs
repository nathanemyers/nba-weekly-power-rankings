import { describe, expect, it } from 'vitest'
import { parseLegacyEdition } from './legacyEditionPage.mjs'

const row = (bg, abbr, rank, last, nickname, record, comment) =>
  `<tr bgColor=${bg}>\n<td><img src=http://espn.go.com/i/teamlogos/nba/sml/trans/${abbr}.gif border=0 alt="" height=50></td>\n` +
  `<td class=verb10 width=30 align=center>${rank}${last == null ? '' : ` (${last})`}</td>\n` +
  `<td class=verb10 width=90><a href="/nba/clubhouse?team=${abbr}">${nickname}</a></td>\n` +
  `<td class=verb10 width=40 align=center>${record}</td>\n<td class=verb10>${comment}</td>\n</tr>\n`

const page = (heading, rows) =>
  `<html><head><title>ESPN.com - NBA - NBA Power Rankings</title></head><body>` +
  `Every Monday during the regular season, ESPN.com senior NBA writer Marc Stein takes the pulse of the league.` +
  `<table align=right><tr><td><SELECT><OPTION value=/nba/teams/powerranking?team=atl>Atlanta</SELECT></td></tr></table>` +
  `<table border=0 cellspacing=0 cellpadding=2 width=600>\n` +
  `<tr bgColor=ae5a00><td colspan=5><font face=arial size=2 color=#FFFFFF><b>${heading}</b></font></td></tr>\n` +
  `<tr bgColor=#c1c1c1>\n<td colspan=2 width=100><font face=verdana size=1><b>Rank (Last Wk)</b></font></td>\n` +
  `<td width=90><b>Team</b></td><td width=40><b>Rec.</b></td><td width=250><b>Comment</b></td>\n</tr>\n` +
  rows.join('') +
  `</table></body></html>`

const rows = [
  row('#ffffff', 'sas', 1, 3, 'Spurs', '8-2', 'A made-up comment&#133; about the Spurs.'),
  row('#efefe7', 'pho', 2, 9, 'Suns', '8-2', 'Second made-up comment.'),
  row('#ffffff', 'sea', 3, 5, 'SuperSonics', '8-3', 'Third made-up comment.'),
]
const url = 'https://www.espn.com/nba/powerrankings/_/year/2005/week/3'
const archiveUrl = 'https://web.archive.org/web/20041126111255/http://sports.espn.go.com:80/nba/powerranking?season=2005&week=3'

describe('parseLegacyEdition', () => {
  it('parses a 2004-era page into the standard edition shape', () => {
    const { edition, warnings } = parseLegacyEdition(page('2005 Power Rankings: Week 3', rows), {
      season: '2004-05',
      espnWeek: 3,
      url,
      archiveUrl,
    })
    expect(warnings).toEqual([])
    expect(edition).toMatchObject({
      slug: '2004-05-week-3',
      url,
      archiveUrl,
      title: null,
      heading: '2005 Power Rankings: Week 3',
      author: 'Marc Stein',
      updatedText: null,
      season: '2004-05',
      espnWeek: 3,
      week: 3,
      editionType: 'weekly',
      hasStructuredRankings: true,
    })
    expect(edition.rankings[0]).toEqual({
      rank: 1,
      previousRank: 3,
      teamId: 1610612759,
      teamName: 'Spurs',
      espnAbbr: 'sas',
      teamLink: 'http://sports.espn.go.com/nba/clubhouse?team=sas',
      record: '8-2',
      summaryHtml: 'A made-up comment&#133; about the Spurs.',
      summaryText: 'A made-up comment… about the Spurs.',
    })
    expect(edition.rankings.map((r) => r.teamId)).toEqual([1610612759, 1610612756, 1610612760])
  })

  it('reads a preseason page and a rank with no previous week', () => {
    const { edition } = parseLegacyEdition(
      page('2004 Power Rankings: Preseason', [row('#ffffff', 'det', 1, null, 'Pistons', '0-0', 'Made up.')]),
      { season: '2003-04', espnWeek: 0, url, archiveUrl },
    )
    expect(edition).toMatchObject({ slug: '2003-04-preseason', week: null, editionType: 'preseason' })
    expect(edition.rankings[0]).toMatchObject({ rank: 1, previousRank: null, teamId: 1610612765 })
  })

  it('rejects a capture of a different week or season', () => {
    const html = page('2005 Power Rankings: Week 4', rows)
    expect(() => parseLegacyEdition(html, { season: '2004-05', espnWeek: 3, url, archiveUrl })).toThrow(
      /2004-05-week-3/,
    )
    expect(() =>
      parseLegacyEdition(page('2004 Power Rankings: Week 3', rows), { season: '2004-05', espnWeek: 3, url, archiveUrl }),
    ).toThrow(/2004-05-week-3/)
  })

  it('reads the week and end year from a heading', async () => {
    const { legacyHeadingWeek } = await import('./legacyEditionPage.mjs')
    expect(legacyHeadingWeek('2005 Power Rankings: Week 12')).toEqual({ endYear: 2005, espnWeek: 12 })
    expect(legacyHeadingWeek('2004 Power Rankings: Preseason')).toEqual({ endYear: 2004, espnWeek: 0 })
    expect(legacyHeadingWeek('2005 Power Rankings: Training Camp')).toEqual({ endYear: 2005, espnWeek: -1 })
    expect(legacyHeadingWeek('Something else')).toBeNull()
  })
})
