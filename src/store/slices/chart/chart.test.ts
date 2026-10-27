import { describe, expect, it } from 'vitest'
import { makeStore } from 'store/redux'
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

const LONG = 26
const SHORT = 8

const weeks = (store: ReturnType<typeof makeStore>, maxWeek = LONG) => [
  getStartWeek(store.getState(), maxWeek),
  getEndWeek(store.getState(), maxWeek),
]

describe('chartView', () => {
  it('starts zoomed out on the full season', () => {
    const store = makeStore()
    expect(weeks(store)).toEqual([1, 26])
    expect(getCanPageEarlier(store.getState(), LONG)).toBe(false)
    expect(getCanPageLater(store.getState(), LONG)).toBe(false)
    expect(getCanZoom(store.getState(), LONG)).toBe(true)
  })

  it('zooms in to a 10-week window and pages within the season', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(-1, LONG))
    expect(weeks(store)).toEqual([1, 11])
    store.dispatch(pageWindow(1, LONG))
    expect(weeks(store)).toEqual([2, 12])
    expect(getCanPageEarlier(store.getState(), LONG)).toBe(true)
    store.dispatch(pageWindow(100, LONG))
    expect(weeks(store)).toEqual([16, 26])
    expect(getCanPageLater(store.getState(), LONG)).toBe(false)
  })

  it('keeps the window inside a shorter season and restores it after', () => {
    const store = makeStore()
    store.dispatch(setZoomedOut(false))
    store.dispatch(pageWindow(100, LONG))
    expect(weeks(store, SHORT)).toEqual([1, 8])
    expect(getCanZoom(store.getState(), SHORT)).toBe(false)
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
})
