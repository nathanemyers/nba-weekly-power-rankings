import { expect, it, vi } from 'vitest'
import { makeStore } from 'store/redux'
import { setSelectedSeason, getSelectedSeasonName } from './UI'
import { getSeasons } from 'store/slices/seasons'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

it('starts on the first season and changes on selection', () => {
  const store = makeStore()
  expect(getSeasons(store.getState()).map((s) => s.name)).toEqual([
    'long',
    'short',
  ])
  expect(getSelectedSeasonName(store.getState())).toBe('long')
  store.dispatch(setSelectedSeason('short'))
  expect(getSelectedSeasonName(store.getState())).toBe('short')
})

it('returns the same season list on every read', () => {
  const store = makeStore()
  expect(getSeasons(store.getState())).toBe(getSeasons(store.getState()))
})

it('builds an independent store on each call', () => {
  const a = makeStore()
  const b = makeStore()
  a.dispatch(setSelectedSeason('short'))
  expect(getSelectedSeasonName(b.getState())).toBe('long')
})
