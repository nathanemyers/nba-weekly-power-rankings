import { describe, expect, it } from 'vitest'
import { parseStoryEdition, parseStoryIndex, storyWeek } from './storyPage.mjs'

const logo = (abbr) => `<img class="floatleft" src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr}.png?w=110&h=110" width="75">`

const block = (abbr, rank, name, record, previous, comment) =>
  `<p><b>${logo(abbr)}</b></p><p><b><b>${rank}. ${name}</b></b><br /> 2016-17 record: ${record}<br />` +
  (previous == null ? '' : ` <a href="/nba/story/_/id/1/x-week-9-rankings">Previous ranking</a>: ${previous}<img alt="" src="x.png">`) +
  `</p>${comment}<hr>`

const page = (blocks) =>
  `<h1>Made-up headline</h1><div class="article-body"><div class="author has-bio">Marc Stein<span class="timestamp ">Dec 26, 2016, 11:34 AM ET</span></div>` +
  `<p>Intro.</p><p><em><strong>Previous rankings:</strong></em> <a href="/nba/story/_/id/2/nba-power-rankings-marc-stein-week-2-rankings">Week 2</a> | ` +
  `<a href="/nba/story/_/page/powerrankings3/nba-power-rankings-marc-stein-week-3-rankings">3</a> | ` +
  `<a href="/nba/story/_/id/4/nba-power-rankings-preseason-edition">1</a> | <a href="/nba/story/_/id/5/nba-power-rankings-training-camp-edition">Camp</a></p>` +
  `${blocks.join('')}</div><footer class="article-footer"></footer>`

const url = 'https://www.espn.com/nba/story/_/id/9/nba-power-rankings-marc-stein-week-4-rankings'

describe('storyWeek', () => {
  it('reads training camp, preseason and weekly story URLs', () => {
    expect(storyWeek('/x/nba-power-rankings-training-camp-edition')).toBe(-1)
    expect(storyWeek('/x/nba-power-rankings-preseason-edition')).toBe(0)
    expect(storyWeek('/x/nba-power-rankings-marc-stein-week-11-rankings')).toBe(11)
  })
})

describe('parseStoryIndex', () => {
  it('lists the linked editions and the final story in week order', () => {
    expect(parseStoryIndex(page([]), url).map((e) => [e.espnWeek, e.url])).toEqual([
      [-1, 'https://www.espn.com/nba/story/_/id/5/nba-power-rankings-training-camp-edition'],
      [0, 'https://www.espn.com/nba/story/_/id/4/nba-power-rankings-preseason-edition'],
      [2, 'https://www.espn.com/nba/story/_/id/2/nba-power-rankings-marc-stein-week-2-rankings'],
      [3, 'https://www.espn.com/nba/story/_/page/powerrankings3/nba-power-rankings-marc-stein-week-3-rankings'],
      [4, url],
    ])
  })
})

describe('parseStoryEdition', () => {
  it('parses each team block between logos', () => {
    const html = page([
      block('gsw', 2, 'Golden State Warriors', '27-5', 1, '<p>Second <a href="/x">made-up</a> comment.</p>'),
      block('cle', 1, '<a href="/nba/team/_/name/cle/cleveland-cavaliers">Cleveland Cavaliers</a>', '23-6', 2, '<p>First.</p><div class="ad-300"></div><p>More.</p>'),
    ])
    const { edition, warnings } = parseStoryEdition(html, { season: '2016-17', espnWeek: 4, url })

    expect(warnings).toEqual([])
    expect(edition).toMatchObject({
      slug: '2016-17-week-4',
      title: 'Made-up headline',
      author: 'Marc Stein',
      updatedText: 'Dec 26, 2016, 11:34 AM ET',
      week: 4,
      editionType: 'weekly',
      hasStructuredRankings: true,
    })
    expect(edition.rankings).toEqual([
      {
        rank: 1,
        previousRank: 2,
        teamId: 1610612739,
        teamName: 'Cleveland Cavaliers',
        espnAbbr: 'cle',
        teamLink: 'https://www.espn.com/nba/team/_/name/cle/cleveland-cavaliers',
        record: '23-6',
        summaryHtml: '<p>First.</p><p>More.</p>',
        summaryText: 'First.\nMore.',
      },
      {
        rank: 2,
        previousRank: 1,
        teamId: 1610612744,
        teamName: 'Golden State Warriors',
        espnAbbr: 'gsw',
        teamLink: null,
        record: '27-5',
        summaryHtml: '<p>Second <a href="/x">made-up</a> comment.</p>',
        summaryText: 'Second made-up comment.',
      },
    ])
  })

  it('keeps the training camp edition without previous ranks', () => {
    const html = page([block('was', 1, 'Washington Wizards', '0-0', null, '<p>Camp.</p>')])
    const { edition } = parseStoryEdition(html, { season: '2016-17', espnWeek: -1, url })
    expect(edition).toMatchObject({ slug: '2016-17-training-camp', week: null, editionType: 'training-camp' })
    expect(edition.rankings[0]).toMatchObject({ previousRank: null, teamId: 1610612764 })
  })

  it('warns about blocks with no comment paragraphs', () => {
    const html = page([block('nyk', 1, 'New York Knicks', '1-0', 1, '<blockquote><p lang="en">A fan tweet</p></blockquote>')])
    const { edition, warnings } = parseStoryEdition(html, { season: '2016-17', espnWeek: 4, url })
    expect(edition.rankings[0].summaryText).toBe('')
    expect(warnings).toEqual(['empty comment for "New York Knicks" in 2016-17-week-4'])
  })
})
