import { createSlice } from '@reduxjs/toolkit'
import { seasonData, seasons } from 'data/seasons'
import { loadSeasons } from './loadSeasons'
import type { RootState } from 'store/redux'

export const initialSeasons = loadSeasons(seasons, seasonData)

const seasonsSlice = createSlice({
  name: 'seasons',
  initialState: initialSeasons,
  reducers: {},
})

export default seasonsSlice.reducer

export const selectSeasonOrder = (state: RootState) => state.seasons.order
export const selectInvalidSeasons = (state: RootState) => state.seasons.invalid
export const selectSeasonView = (state: RootState) =>
  state.navigation.season === undefined
    ? undefined
    : state.seasons.bySeason[state.navigation.season]
