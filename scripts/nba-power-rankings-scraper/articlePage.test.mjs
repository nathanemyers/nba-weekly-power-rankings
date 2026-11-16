import { describe, expect, it } from 'vitest'
import { parsePowerRankingsArticle, validateWeeklyRankings } from './articlePage.mjs'
import { TEAM_SLUGS } from '../lib/articles.mjs'

const TEAM_IDS = Object.keys(TEAM_SLUGS).map(Number)

// One ranked team the way NBA.com's 2026-27 Week 1 article prints it in the HTML body
function htmlTeam(teamId, rank) {
  return (
    `<h4>#${rank} <img decoding="async" src="https://cdn.nba.com/logos/nba/${teamId}/primary/L/72x72/logo.png" alt="Team ${rank} logo" height="40" /> ` +
    `<a href="https://www.nba.com/team${rank}/">Team ${rank}</a></h4>\n` +
    `<p><strong>Preseason record:</strong> 2-3</p>\n<p>Write-up for team ${rank}.</p>\n`
  )
}

function article({ slug = 'power-rankings-2026-27-week-1', teamIds = TEAM_IDS, structured = false } = {}) {
  return {
    id: 1,
    slug,
    title: 'Power Rankings',
    date: '2026-10-19T18:39:52Z',
    modified: '2026-10-20T12:34:36Z',
    powerRankings: structured
      ? teamIds.map((teamId, i) => ({
          teamId,
          teamName: `Team ${i + 1}`,
          teamLink: null,
          lastWeekRank: 30 - i,
          currentWeekRank: i + 1,
          powerRankSummary: `<p><strong>Record:</strong> 8-2</p><p>Team ${i + 1}.</p>`,
        }))
      : [],
    contentFiltered: structured ? '' : `<p>Intro.</p>\n<hr />\n${teamIds.map((id, i) => htmlTeam(id, i + 1)).join('')}`,
  }
}

describe('parsePowerRankingsArticle', () => {
  it('reads structured rankings', () => {
    const parsed = parsePowerRankingsArticle(article({ slug: 'power-rankings-2026-27-week-4', structured: true }), 'x')
    expect(parsed.hasStructuredRankings).toBe(true)
    expect(parsed.rankings).toHaveLength(30)
    expect(parsed.rankings[0]).toMatchObject({ rank: 1, previousRank: 30, teamId: TEAM_IDS[0] })
    expect(parsed.season).toBe('2026-27')
    expect(parsed.week).toBe(4)
  })

  it('falls back to the HTML team sections of a weekly article', () => {
    const parsed = parsePowerRankingsArticle(article(), 'x')
    expect(parsed.hasStructuredRankings).toBe(true)
    expect(parsed.rawText).toBeNull()
    expect(parsed.rankings.map((entry) => entry.rank)).toEqual(TEAM_IDS.map((_, i) => i + 1))
    expect(parsed.rankings[0]).toMatchObject({
      previousRank: null,
      teamId: TEAM_IDS[0],
      teamName: 'Team 1',
      teamLink: 'https://www.nba.com/team1/',
    })
    expect(parsed.rankings[0].summaryText).toContain('Preseason record: 2-3')
    expect(parsed.rankings[0].summaryText).not.toContain('Team 2')
  })

  it('leaves non-weekly articles unstructured', () => {
    const parsed = parsePowerRankingsArticle(article({ slug: 'power-rankings-notebook-week-3' }), 'x')
    expect(parsed.hasStructuredRankings).toBe(false)
    expect(parsed.rankings).toEqual([])
    expect(parsed.rawText).toContain('Intro.')
  })
})

describe('validateWeeklyRankings', () => {
  const parse = (options) => parsePowerRankingsArticle(article(options), 'x')

  it('accepts all 30 teams from either source', () => {
    expect(() => validateWeeklyRankings(parse())).not.toThrow()
    expect(() => validateWeeklyRankings(parse({ slug: 'power-rankings-2026-27-week-4', structured: true }))).not.toThrow()
  })

  it('rejects a partial week', () => {
    expect(() => validateWeeklyRankings(parse({ teamIds: TEAM_IDS.slice(0, 29) }))).toThrow(/29 teams/)
  })

  it('rejects a duplicated team', () => {
    expect(() => validateWeeklyRankings(parse({ teamIds: [...TEAM_IDS.slice(0, 29), TEAM_IDS[0]] }))).toThrow(/duplicated/)
  })

  it('rejects an unknown team id', () => {
    expect(() => validateWeeklyRankings(parse({ teamIds: [...TEAM_IDS.slice(0, 29), 123] }))).toThrow(/unknown team/)
  })

  it('skips articles that are not numbered weeks', () => {
    expect(() => validateWeeklyRankings(parse({ slug: 'offseason-power-rankings-west-2026', teamIds: [] }))).not.toThrow()
  })
})
