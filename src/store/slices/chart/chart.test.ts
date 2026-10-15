import { describe, expect, it, vi } from 'vitest'
import { makeStore } from 'store/redux'
import { setSelectedSeason } from '@/store/slices/UI'
import { Team } from 'types'
import {
  pageWindow,
  getCanPageEarlier,
  getCanPageLater,
  getCanZoom,
  getEndWeek,
  getStartWeek,
  setZoomedOut,
  getPinnedTeams,
  setPinnedTeams,
} from './chart'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const weeks = (store: ReturnType<typeof makeStore>) => [
  getStartWeek(store.getState()),
  getEndWeek(store.getState()),
]

describe('chartView', () => {
  it('starts zoomed out on the full season', () => {
    const store = makeStore()
    expect(weeks(store)).toEqual([1, 26])
    expect(getCanPageEarlier(store.getState())).toBe(false)
    expect(getCanPageLater(store.getState())).toBe(false)
    expect(getCanZoom(store.getState())).toBe(true)
  })

  it('zooms in to a 10-week window and pages within the season', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(-1))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(1))
    expect(weeks(store)).toEqual([2, 12])
    expect(getCanPageEarlier(store.getState())).toBe(true)
    store.dispatch(pageWindow(100))
    expect(weeks(store)).toEqual([16, 26])
    expect(getCanPageLater(store.getState())).toBe(false)
  })

  it('keeps the window inside a shorter season and restores it after', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    store.dispatch(pageWindow(100))
    store.dispatch(setSelectedSeason('short'))
    expect(weeks(store)).toEqual([1, 8])
    expect(getCanZoom(store.getState())).toBe(false)
    store.dispatch(setSelectedSeason('long'))
    expect(weeks(store)).toEqual([16, 26])
  })
})

describe('pinned teams', () => {
  it('sets and clears the pinned teams', () => {
    const store = makeStore()
    store.dispatch(setPinnedTeams([Team.Boston]))
    expect(getPinnedTeams(store.getState())).toEqual([Team.Boston])
    store.dispatch(setPinnedTeams([]))
    expect(getPinnedTeams(store.getState())).toEqual([])
  })

  it('clears the pin on a season change', () => {
    const store = makeStore()
    store.dispatch(setPinnedTeams([Team.Boston]))
    store.dispatch(setSelectedSeason('short'))
    expect(getPinnedTeams(store.getState())).toEqual([])
  })
})
