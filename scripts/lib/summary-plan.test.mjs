import { describe, expect, it } from 'vitest'
import { buildPromptInput, decide, hashInput } from './summary-plan.mjs'

const entries = [
  { week: 2, rank: 3, teamName: 'Boston Celtics', summaryText: 'Record: 3-0\nSecond week text. ' },
  { week: 1, rank: 1, teamName: 'Boston Celtics', summaryText: 'First week text.' },
]
const storedFor = (list) => ({ summary: 'Stored.', sourceHash: hashInput(buildPromptInput(list)) })

describe('buildPromptInput', () => {
  it('lists weeks in ascending order with week, rank and the full text only', () => {
    expect(buildPromptInput(entries)).toBe(
      'Week 1 (ranked #1):\nFirst week text.\n\nWeek 2 (ranked #3):\nRecord: 3-0\nSecond week text.',
    )
  })

  it('does not reorder the caller\'s array', () => {
    buildPromptInput(entries)
    expect(entries[0].week).toBe(2)
  })
})

describe('hashInput', () => {
  it('is stable for equal input and changes when any week changes', () => {
    const changed = [entries[0], { ...entries[1], summaryText: 'First week text, corrected.' }]
    expect(hashInput(buildPromptInput(entries))).toBe(hashInput(buildPromptInput([...entries])))
    expect(hashInput(buildPromptInput(changed))).not.toBe(hashInput(buildPromptInput(entries)))
    expect(hashInput('x')).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('decide — no data', () => {
  it('skips a team with no weekly entries, whatever else is true', () => {
    expect(decide({ entries: [], stored: undefined, complete: false })).toBe('skip-no-data')
    expect(decide({ entries: undefined, stored: undefined, complete: true })).toBe('skip-no-data')
    expect(decide({ entries: [], stored: storedFor(entries), complete: true })).toBe('skip-no-data')
  })
})

describe('decide — active season', () => {
  it('generates when nothing is stored', () => {
    expect(decide({ entries, stored: undefined, complete: false })).toBe('generate')
  })

  it('skips when the stored hash matches the current source text', () => {
    expect(decide({ entries, stored: storedFor(entries), complete: false })).toBe('skip-unchanged')
  })

  it('regenerates only the team whose source text gained a week', () => {
    const other = [{ week: 1, rank: 9, teamName: 'Miami Heat', summaryText: 'Miami week one.' }]
    const storedBoston = storedFor(entries)
    const storedMiami = storedFor(other)
    const bostonNow = [...entries, { week: 3, rank: 2, teamName: 'Boston Celtics', summaryText: 'Third week.' }]

    expect(decide({ entries: bostonNow, stored: storedBoston, complete: false })).toBe('generate')
    expect(decide({ entries: other, stored: storedMiami, complete: false })).toBe('skip-unchanged')
  })
})

describe('decide — complete season', () => {
  it('generates once when nothing is stored', () => {
    expect(decide({ entries, stored: undefined, complete: true })).toBe('generate')
  })

  it('never regenerates a stored summary, even when the hash differs', () => {
    expect(decide({ entries, stored: storedFor(entries), complete: true })).toBe('skip-locked')
    expect(decide({ entries, stored: { summary: 'Old.', sourceHash: 'stale' }, complete: true })).toBe(
      'skip-locked',
    )
  })
})
