import { describe, expect, it } from 'vitest'
import { resolveTeamId } from './teams.mjs'

describe('resolveTeamId', () => {
  it('tells the Los Angeles teams apart by link abbreviation', () => {
    expect(resolveTeamId({ espnAbbr: 'lal', teamName: 'Los Angeles' })).toBe(1610612747)
    expect(resolveTeamId({ espnAbbr: 'lac', teamName: 'LA' })).toBe(1610612746)
  })

  it('maps ESPN-specific abbreviations', () => {
    expect(resolveTeamId({ espnAbbr: 'utah', teamName: 'Utah' })).toBe(1610612762)
  })

  it('maps unlinked relocated and renamed franchises by printed name', () => {
    expect(resolveTeamId({ espnAbbr: null, teamName: 'NO/Oklahoma City' })).toBe(1610612740)
    expect(resolveTeamId({ espnAbbr: null, teamName: 'Seattle' })).toBe(1610612760)
    expect(resolveTeamId({ espnAbbr: null, teamName: 'New Jersey' })).toBe(1610612751)
    expect(resolveTeamId({ espnAbbr: null, teamName: 'Charlotte' })).toBe(1610612766)
  })

  it('returns null for an unknown team', () => {
    expect(resolveTeamId({ espnAbbr: null, teamName: 'Nowhere' })).toBeNull()
  })
})
