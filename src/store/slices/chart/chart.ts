import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { clamp } from 'lodash'
import type { AppThunk, RootState } from 'store/redux'
import type { Team } from 'types'

const DEFAULT_WINDOW_WEEKS = 10

type ChartViewState = {
  zoomedOut: boolean
  startWeek: number
  endWeek: number
  pinnedTeams: Team[]
}

const initialState: ChartViewState = {
  zoomedOut: true,
  startWeek: 1,
  endWeek: 1 + DEFAULT_WINDOW_WEEKS,
  pinnedTeams: [],
}

const chartViewSlice = createSlice({
  name: 'chart',
  initialState,
  reducers: {
    setZoomedOut(state, action: PayloadAction<boolean>) {
      state.zoomedOut = action.payload
    },
    setZoomedInWindow(
      state,
      action: PayloadAction<{ start: number; end: number }>
    ) {
      state.startWeek = action.payload.start
      state.endWeek = action.payload.end
    },
    setPinnedTeams(state, action: PayloadAction<Team[]>) {
      state.pinnedTeams = action.payload
    },
  },
})

const { setZoomedInWindow } = chartViewSlice.actions
export const { setZoomedOut, setPinnedTeams } = chartViewSlice.actions
export default chartViewSlice.reducer

export const getPinnedTeams = (state: RootState) => state.chart.pinnedTeams
export const getSinglePinnedTeam = (state: RootState) => {
  const pinnedTeams = getPinnedTeams(state)
  if (pinnedTeams.length !== 1) {
    return undefined
  } else {
    return pinnedTeams[0]
  }
}

export const getIsZoomedOut = (state: RootState) => state.chart.zoomedOut

export const getWindowEnd = (state: RootState, maxWeek: number) =>
  Math.min(state.chart.endWeek, maxWeek)

export const getWindowStart = (state: RootState, maxWeek: number) =>
  Math.max(
    1,
    getWindowEnd(state, maxWeek) - (state.chart.endWeek - state.chart.startWeek)
  )

export const getStartWeek = (state: RootState, maxWeek: number) =>
  getIsZoomedOut(state) ? 1 : getWindowStart(state, maxWeek)

export const getEndWeek = (state: RootState, maxWeek: number) =>
  getIsZoomedOut(state) ? maxWeek : getWindowEnd(state, maxWeek)

export const getCanPageEarlier = (state: RootState, maxWeek: number) =>
  !getIsZoomedOut(state) && getWindowStart(state, maxWeek) > 1

export const getCanPageLater = (state: RootState, maxWeek: number) =>
  !getIsZoomedOut(state) && getWindowEnd(state, maxWeek) < maxWeek

export const getCanZoom = (state: RootState, maxWeek: number) =>
  getWindowStart(state, maxWeek) > 1 || getWindowEnd(state, maxWeek) < maxWeek

export const pageWindow =
  (delta: number, maxWeek: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    if (getIsZoomedOut(state)) return
    const start = getWindowStart(state, maxWeek)
    const end = getWindowEnd(state, maxWeek)
    const weeks = clamp(delta, 1 - start, maxWeek - end)
    if (weeks === 0) return
    dispatch(setZoomedInWindow({ start: start + weeks, end: end + weeks }))
  }
