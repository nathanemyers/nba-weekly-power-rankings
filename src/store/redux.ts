import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'
import seasons from './slices/seasons/seasons'
import UI from './slices/UI/UI'
import chart from './slices/chart/chart'
import selection from './slices/selection/selection'

export function makeStore() {
  return configureStore({
    reducer: { seasons, UI, chart, selection },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>
