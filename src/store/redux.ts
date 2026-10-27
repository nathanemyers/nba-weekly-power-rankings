import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'
import chart from './slices/chart/chart'

export function makeStore() {
  return configureStore({
    reducer: { chart },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>
