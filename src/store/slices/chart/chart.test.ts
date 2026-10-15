import { describe, expect, it, vi } from 'vitest'
import { makeStore } from 'store/redux'
import { seasonSelected } from '@/store/slices/UI'
import {
  pageWindow,
  selectCanPageEarlier,
  selectCanPageLater,
  selectCanZoom,
  selectEndWeek,
  selectStartWeek,
  setZoomedOut,
} from './chart'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const weeks = (store: ReturnType<typeof makeStore>) => [
  selectStartWeek(store.getState()),
  selectEndWeek(store.getState()),
]

describe('chartView', () => {
  it('starts zoomed out on the full season', () => {
    const store = makeStore()
    expect(weeks(store)).toEqual([1, 26])
    expect(selectCanPageEarlier(store.getState())).toBe(false)
    expect(selectCanPageLater(store.getState())).toBe(false)
    expect(selectCanZoom(store.getState())).toBe(true)
  })

  it('zooms in to a 10-week window and pages within the season', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(-1))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(1))
    expect(weeks(store)).toEqual([2, 12])
    expect(selectCanPageEarlier(store.getState())).toBe(true)
    store.dispatch(pageWindow(100))
    expect(weeks(store)).toEqual([16, 26])
    expect(selectCanPageLater(store.getState())).toBe(false)
  })

  it('keeps the window inside a shorter season and restores it after', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    store.dispatch(pageWindow(100))
    store.dispatch(seasonSelected('short'))
    expect(weeks(store)).toEqual([1, 8])
    expect(selectCanZoom(store.getState())).toBe(false)
    store.dispatch(seasonSelected('long'))
    expect(weeks(store)).toEqual([16, 26])
  })
})
