import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { clamp } from 'lodash'
import type { AppThunk, RootState } from 'store/redux'
import type { Team } from 'types'
import { getSelectedSeason } from 'store/slices/UI'

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

const getSinglePinnedTeamRankings = (state: RootState) => {
  const teamId = getSinglePinnedTeam(state)
  return teamId
    ? getSelectedSeason(state)?.teams.find((team) => team.teamId === teamId)
    : undefined
}

export const getPinnedTeamRoster = (state: RootState) =>
  getSinglePinnedTeamRankings(state)?.roster

export const getPinnedTeamCoaches = (state: RootState) =>
  getSinglePinnedTeamRankings(state)?.coaches

const getMaxWeek = (state: RootState) => getSelectedSeason(state)?.maxWeek ?? 1

export const getIsZoomedOut = (state: RootState) => state.chart.zoomedOut

export const getWindowEnd = (state: RootState) =>
  Math.min(state.chart.endWeek, getMaxWeek(state))

export const getWindowStart = (state: RootState) =>
  Math.max(
    1,
    getWindowEnd(state) - (state.chart.endWeek - state.chart.startWeek)
  )

export const getStartWeek = (state: RootState) =>
  getIsZoomedOut(state) ? 1 : getWindowStart(state)

export const getEndWeek = (state: RootState) =>
  getIsZoomedOut(state) ? getMaxWeek(state) : getWindowEnd(state)

export const getCanPageEarlier = (state: RootState) =>
  !getIsZoomedOut(state) && getWindowStart(state) > 1

export const getCanPageLater = (state: RootState) =>
  !getIsZoomedOut(state) && getWindowEnd(state) < getMaxWeek(state)

export const getCanZoom = (state: RootState) =>
  getWindowStart(state) > 1 || getWindowEnd(state) < getMaxWeek(state)

export const pageWindow =
  (delta: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    if (getIsZoomedOut(state)) return
    const start = getWindowStart(state)
    const end = getWindowEnd(state)
    const weeks = clamp(delta, 1 - start, getMaxWeek(state) - end)
    if (weeks === 0) return
    dispatch(setZoomedInWindow({ start: start + weeks, end: end + weeks }))
  }
