import { expect, it, vi } from 'vitest'
import { makeStore } from 'store/redux'
import { seasonSelected, selectSeason } from './UI'
import { selectSeasonOrder } from 'store/slices/seasons'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

it('starts on the first season and changes on selection', () => {
  const store = makeStore()
  expect(selectSeasonOrder(store.getState())).toEqual(['long', 'short'])
  expect(selectSeason(store.getState())).toBe('long')
  store.dispatch(seasonSelected('short'))
  expect(selectSeason(store.getState())).toBe('short')
})

it('builds an independent store on each call', () => {
  const a = makeStore()
  const b = makeStore()
  a.dispatch(seasonSelected('short'))
  expect(selectSeason(b.getState())).toBe('long')
})
