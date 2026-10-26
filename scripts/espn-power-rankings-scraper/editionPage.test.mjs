import { describe, expect, it } from 'vitest'
import { parseEdition } from './editionPage.mjs'

const linkedRow = (rank, abbr, slug, name, record, lastWeek, comment) =>
  `<tr class="${rank % 2 ? 'oddrow' : 'evenrow'}"><td class="pr-rank">${rank}</td><td>` +
  `<a href="https://www.espn.com/nba/team/_/name/${abbr}/${slug}"><img class="logo-medium floatleft" src="x.png"></a>` +
  `<div style="padding:10px 0;"><a href="https://www.espn.com/nba/team/_/name/${abbr}/${slug}">${name}</a><br/>` +
  `<span class="pr-record">${record}</span></div></td><td><div class="pr-arrowup"></div><span class="pr-trend">1</span>` +
  (lastWeek == null ? '' : `<br/><span class="pr-last">Last Week: ${lastWeek}</span>`) +
  `</td><td>${comment}</td></tr>`

const unlinkedRow = (rank, name, record, lastWeek, comment) =>
  `<tr class="${rank % 2 ? 'oddrow' : 'evenrow'}"><td class="pr-rank">${rank}</td><td>` +
  `<div class="logo-medium logo-nba-medium nba-medium-0 floatleft"></div><div style="padding:10px 0;">${name}<br/>` +
  `<span class="pr-record">${record}</span></div></td><td><span class="pr-last">Last Week: ${lastWeek}</span></td>` +
  `<td>${comment}</td></tr>`

const page = ({ heading = '2007-08 Power Rankings: Week 10', rows }) =>
  `<html><div class="headline"><h1 class="h2">Made-up headline</h1></div>` +
  `<div class="subhead"><div class="date"><span>Updated:</span> January 7, 2008, 11:52 AM ET</div> ` +
  `<cite class="source"> By <a href="http://search.espn.com/someone/">\nMarc Stein</a> | ESPN.com</cite> </div>` +
  `<table class="tablehead" cellpadding="3" cellspacing="1"><tr class="stathead"><td colspan=5>${heading}</td></tr>` +
  `<tr class="colhead"><td>RANK</td><td>TEAM / RECORD</td><td>TRENDING</td><td>COMMENTS</td></tr>` +
  rows.join('') +
  `<tr><td colspan="4"><div class="pr-infoboxlong">Biggest Jump: <a href="https://www.espn.com/nba/team/_/name/cle/x">Cleveland</a></div></td></tr>` +
  `</table></html>`

const rows = [
  unlinkedRow(2, 'New Orleans', '23-11', 6, 'Second made-up comment.'),
  linkedRow(1, 'bos', 'boston-celtics', 'Boston', '29-3', 2, 'A <i>made-up</i> comment&#133; with an ellipsis.'),
  linkedRow(3, 'lal', 'los-angeles-lakers', 'Los Angeles', '21-11', null, 'Third made-up comment.'),
]
const url = 'https://www.espn.com/nba/powerrankings/_/year/2008/week/10'

describe('parseEdition', () => {
  it('parses the edition metadata and every team row in rank order', () => {
    const { edition, warnings } = parseEdition(page({ rows }), { season: '2007-08', espnWeek: 10, url })

    expect(warnings).toEqual([])
    expect(edition).toMatchObject({
      slug: '2007-08-week-10',
      url,
      title: 'Made-up headline',
      heading: '2007-08 Power Rankings: Week 10',
      author: 'Marc Stein',
      updatedText: 'January 7, 2008, 11:52 AM ET',
      season: '2007-08',
      espnWeek: 10,
      week: 10,
      editionType: 'weekly',
      hasStructuredRankings: true,
    })
    expect(edition.rankings.map((r) => r.rank)).toEqual([1, 2, 3])
    expect(edition.rankings[0]).toEqual({
      rank: 1,
      previousRank: 2,
      teamId: 1610612738,
      teamName: 'Boston',
      espnAbbr: 'bos',
      teamLink: 'https://www.espn.com/nba/team/_/name/bos/boston-celtics',
      record: '29-3',
      summaryHtml: 'A <i>made-up</i> comment&#133; with an ellipsis.',
      summaryText: 'A made-up comment… with an ellipsis.',
    })
    expect(edition.rankings[1]).toMatchObject({
      teamId: 1610612740,
      teamName: 'New Orleans',
      espnAbbr: null,
      teamLink: null,
      previousRank: 6,
    })
    expect(edition.rankings[2]).toMatchObject({ teamId: 1610612747, previousRank: null })
  })

  it('names preseason and training camp editions without a week number', () => {
    const preseason = parseEdition(page({ heading: '2007-08 Power Rankings: Preseason', rows }), {
      season: '2007-08',
      espnWeek: 0,
      url,
    }).edition
    expect(preseason).toMatchObject({ slug: '2007-08-preseason', week: null, editionType: 'preseason' })

    const camp = parseEdition(page({ heading: '2007-08 Power Rankings: Training Camp', rows }), {
      season: '2007-08',
      espnWeek: -1,
      url,
    }).edition
    expect(camp).toMatchObject({ slug: '2007-08-training-camp', week: null, editionType: 'training-camp' })
  })

  it('reads the comment from rows that have no TRENDING column', () => {
    const threeColumn = (rank, abbr, comment) =>
      `<tr class="oddrow"><td class="pr-rank">${rank}</td><td><div style="padding:10px 0;">` +
      `<a href="https://www.espn.com/nba/team/_/name/${abbr}/x">Team</a><br/><span class="pr-record">0-0</span></div></td>` +
      `<td>${comment}</td></tr>`
    const { edition } = parseEdition(
      page({ heading: '2012-13 Power Rankings: Training Camp', rows: [threeColumn(1, 'mia', 'Made-up camp comment.')] }),
      { season: '2012-13', espnWeek: -1, url },
    )
    expect(edition.rankings[0]).toMatchObject({
      teamId: 1610612748,
      previousRank: null,
      summaryText: 'Made-up camp comment.',
    })
  })

  it('returns null for missing title, author and date', () => {
    const bare = `<table class="tablehead"><tr class="stathead"><td colspan=5>2003-04 Power Rankings: Week 1</td></tr>${rows.join('')}</table>`
    const { edition } = parseEdition(bare, { season: '2003-04', espnWeek: 1, url })
    expect(edition).toMatchObject({ title: null, author: null, updatedText: null })
  })

  it('keeps an unmatched team with a null id and a warning', () => {
    const { edition, warnings } = parseEdition(
      page({ rows: [...rows, unlinkedRow(4, 'Nowhere', '1-1', 4, 'Made up.')] }),
      { season: '2007-08', espnWeek: 10, url },
    )
    expect(edition.rankings[3]).toMatchObject({ teamName: 'Nowhere', teamId: null })
    expect(warnings).toEqual(['unmatched team "Nowhere" in 2007-08-week-10'])
  })

  it('rejects a page from a different season', () => {
    expect(() =>
      parseEdition(page({ heading: '2008-09 Power Rankings: Week 10', rows }), { season: '2007-08', espnWeek: 10, url }),
    ).toThrow(/2007-08-week-10/)
  })

  it('keeps a tied or skipped rank as published and warns about it', () => {
    const tied = [
      rows[1],
      linkedRow(3, 'lal', 'los-angeles-lakers', 'Los Angeles', '21-11', 5, 'x'),
      unlinkedRow(3, 'New Orleans', '23-11', 2, 'y'),
    ]
    const { edition, warnings } = parseEdition(page({ rows: tied }), { season: '2007-08', espnWeek: 10, url })
    expect(edition.rankings.map((r) => [r.rank, r.teamName])).toEqual([
      [1, 'Boston'],
      [3, 'Los Angeles'],
      [3, 'New Orleans'],
    ])
    expect(warnings).toEqual(['rank 3 for "Los Angeles" breaks the 1 to 3 sequence in 2007-08-week-10'])
  })

  it('keeps an edition whose table has no team rows, flagged as unstructured', () => {
    const { edition, warnings } = parseEdition(page({ rows: [] }), { season: '2007-08', espnWeek: 10, url })
    expect(edition).toMatchObject({ title: 'Made-up headline', hasStructuredRankings: false, rankings: [] })
    expect(warnings).toEqual(['no team rows in 2007-08-week-10, saved without rankings'])
  })

  it('rejects a page with no rankings heading', () => {
    expect(() => parseEdition('<html>Some other page</html>', { season: '2007-08', espnWeek: 10, url })).toThrow(
      /2007-08-week-10/,
    )
  })
})
