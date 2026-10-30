import { describe, expect, it } from 'vitest'
import sources from './sources.json' with { type: 'json' }
import draftDates from './draft-dates.json' with { type: 'json' }
import { buildProcessed, checkCandidate, checkFinalize, checkRaw, matchSource, seasonWindow } from './rules.mjs'

const ctx = { sources, draftDates, season: '2024-25', teams: ['ind', 'okc', 'dal', 'lal'], playoffTeams: ['ind', 'okc'], completed: true }

const candidate = (extra = {}) => ({
  id: 'pacers-reach-finals', title: 'Pacers reach the Finals', eventDate: '2025-05-31', teams: ['ind'], featured: false,
  article: { headline: 'Pacers race past Knicks', publisher: 'ESPN', url: 'https://www.espn.com/nba/story/_/id/45413751/x', publishedAt: '2025-05-31' },
  kind: 'playoffs', guidance: ['g1'], status: 'included', ...extra,
})

const raw = (candidates) => ({ season: '2024-25', updatedAt: '2026-10-29', guidance: [{ id: 'g1', summary: 'x', origin: 'playoffs', teams: ['ind'] }], candidates })

describe('matchSource', () => {
  it('accepts approved publishers and their subdomains', () => {
    expect(matchSource('https://www.espn.com/nba/story/_/id/1/x', sources)).toBe('ESPN')
    expect(matchSource('https://www.nba.com/pacers/news/x', sources)).toBe('NBA.com')
  })

  it('rejects excluded paths and unlisted domains', () => {
    expect(matchSource('https://www.espn.com/nba/recap?gameId=1', sources)).toBeNull()
    expect(matchSource('https://www.si.com/nba/pacers/onsi/news/x', sources)).toBeNull()
    expect(matchSource('https://www.inquisitr.com/x', sources)).toBeNull()
    expect(matchSource('https://notespn.com/x', sources)).toBeNull()
  })
})

describe('seasonWindow', () => {
  it('runs from the day after one draft through the next', () => {
    expect(seasonWindow('2024-25', draftDates)).toEqual({ start: '2024-06-28', end: '2025-06-26' })
  })

  it('is undefined without both draft dates', () => {
    expect(seasonWindow('2030-31', draftDates)).toBeUndefined()
  })
})

describe('checkCandidate', () => {
  const guidanceIds = ['g1']

  it('passes a valid candidate', () => {
    expect(checkCandidate(candidate(), { ...ctx, guidanceIds })).toEqual([])
  })

  it('keeps the draft in the season before it', () => {
    expect(checkCandidate(candidate({ eventDate: '2025-06-26' }), { ...ctx, guidanceIds })).toEqual([])
    expect(checkCandidate(candidate({ eventDate: '2025-06-27' }), { ...ctx, guidanceIds })).toHaveLength(1)
    expect(checkCandidate(candidate({ eventDate: '2024-06-27' }), { ...ctx, guidanceIds })).toHaveLength(1)
  })

  it('flags each broken rule', () => {
    const failures = (extra) => checkCandidate(candidate(extra), { ...ctx, guidanceIds }).length
    expect(failures({ teams: ['xyz'] })).toBe(1)
    expect(failures({ teams: [], featured: false })).toBe(1)
    expect(failures({ kind: 'trade', blockbuster: true, featured: false })).toBe(1)
    expect(failures({ guidance: [] })).toBe(1)
    expect(failures({ guidance: ['nope'] })).toBe(1)
    expect(failures({ article: { ...candidate().article, url: 'https://www.inquisitr.com/x' } })).toBe(1)
    expect(failures({ status: 'maybe' })).toBe(1)
  })
})

describe('checkRaw', () => {
  it('flags duplicate ids and urls', () => {
    const a = candidate()
    const b = candidate({ id: 'other' })
    const c = candidate({ article: { ...a.article, url: 'https://www.espn.com/nba/story/_/id/2/y' } })
    expect(checkRaw(raw([a, b]), ctx)).toEqual([expect.stringMatching(/duplicate url/)])
    expect(checkRaw(raw([a, c]), ctx)).toEqual([expect.stringMatching(/duplicate id/)])
  })

  it('flags a raw file for the wrong season', () => {
    expect(checkRaw({ ...raw([]), season: '2023-24' }, ctx)).toHaveLength(1)
  })
})

describe('checkFinalize', () => {
  const okc = candidate({ id: 'thunder-title', teams: ['okc'], article: { ...candidate().article, url: 'https://www.espn.com/nba/story/_/id/3/z' } })

  it('passes when every playoff team has an included playoff storyline', () => {
    expect(checkFinalize(raw([candidate(), okc]), ctx)).toEqual([])
  })

  it('blocks pending candidates', () => {
    expect(checkFinalize(raw([candidate(), okc, candidate({ id: 'p', status: 'pending', article: { ...okc.article, url: 'https://www.espn.com/p' } })]), ctx)).toHaveLength(1)
  })

  it('blocks a playoff team without an included playoff storyline', () => {
    expect(checkFinalize(raw([candidate(), { ...okc, status: 'excluded' }]), ctx)).toEqual([expect.stringMatching(/okc/)])
  })

  it('blocks a season without a champion', () => {
    expect(checkFinalize(raw([candidate(), okc]), { ...ctx, completed: false })).toHaveLength(1)
  })
})

describe('buildProcessed', () => {
  it('keeps included storylines only, without review fields, in date order', () => {
    const early = candidate({ id: 'early', eventDate: '2024-11-17', article: { ...candidate().article, url: 'https://www.espn.com/e' } })
    const dropped = candidate({ id: 'dropped', status: 'excluded', article: { ...candidate().article, url: 'https://www.espn.com/d' } })
    const output = buildProcessed(raw([candidate(), dropped, early]), '2026-10-29')
    expect(output.season).toBe('2024-25')
    expect(output.finalizedAt).toBe('2026-10-29')
    expect(output.storylines.map((s) => s.id)).toEqual(['early', 'pacers-reach-finals'])
    expect(Object.keys(output.storylines[0]).sort()).toEqual(['article', 'eventDate', 'featured', 'id', 'teams', 'title'])
  })
})
