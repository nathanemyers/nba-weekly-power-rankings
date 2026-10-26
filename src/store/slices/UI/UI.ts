import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { initialSeasons, getSeasonById } from '@/store/slices/seasons/seasons'
import type { RootState } from 'store/redux'

type UIState = {
  selectedSeason: string
}

const initialState: UIState = {
  selectedSeason: initialSeasons.order[0],
}

const navigationSlice = createSlice({
  name: 'UI',
  initialState,
  reducers: {
    setSelectedSeason(state, action: PayloadAction<string>) {
      state.selectedSeason = action.payload
    },
  },
})

export const { setSelectedSeason } = navigationSlice.actions
export default navigationSlice.reducer

export const getSelectedSeasonName = (state: RootState) =>
  state.UI.selectedSeason
export const getSelectedSeason = (state: RootState) =>
  getSeasonById(state, state.UI.selectedSeason)
