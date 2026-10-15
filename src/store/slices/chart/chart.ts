import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { clamp } from 'lodash'
import { selectSeasonView } from 'store/slices/seasons'
import type { AppThunk, RootState } from 'store/redux'

const DEFAULT_WINDOW_WEEKS = 10

type ChartViewState = {
  zoomedOut: boolean
  startWeek: number
  endWeek: number
}

const initialState: ChartViewState = {
  zoomedOut: true,
  startWeek: 1,
  endWeek: 1 + DEFAULT_WINDOW_WEEKS,
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
  },
})

const { setZoomedInWindow } = chartViewSlice.actions
export const { setZoomedOut } = chartViewSlice.actions
export default chartViewSlice.reducer

const selectMaxWeek = (state: RootState) =>
  selectSeasonView(state)?.maxWeek ?? 1

export const selectZoomedOut = (state: RootState) => state.chartView.zoomedOut

export const selectWindowEnd = (state: RootState) =>
  Math.min(state.chartView.endWeek, selectMaxWeek(state))

export const selectWindowStart = (state: RootState) =>
  Math.max(
    1,
    selectWindowEnd(state) -
      (state.chartView.endWeek - state.chartView.startWeek)
  )

export const selectStartWeek = (state: RootState) =>
  selectZoomedOut(state) ? 1 : selectWindowStart(state)

export const selectEndWeek = (state: RootState) =>
  selectZoomedOut(state) ? selectMaxWeek(state) : selectWindowEnd(state)

export const selectCanPageEarlier = (state: RootState) =>
  !selectZoomedOut(state) && selectWindowStart(state) > 1

export const selectCanPageLater = (state: RootState) =>
  !selectZoomedOut(state) && selectWindowEnd(state) < selectMaxWeek(state)

export const selectCanZoom = (state: RootState) =>
  selectWindowStart(state) > 1 || selectWindowEnd(state) < selectMaxWeek(state)

export const pageWindow =
  (delta: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    if (selectZoomedOut(state)) return
    const start = selectWindowStart(state)
    const end = selectWindowEnd(state)
    const weeks = clamp(delta, 1 - start, selectMaxWeek(state) - end)
    if (weeks === 0) return
    dispatch(setZoomedInWindow({ start: start + weeks, end: end + weeks }))
  }
