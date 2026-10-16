import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { initialSeasons, getSeasonById } from '@/store/slices/seasons/seasons'
import type { RootState } from 'store/redux'

export enum View {
  Chart,
  TeamHistory,
}

type UIState = {
  selectedSeason: string
  view: View
}

const initialState: UIState = {
  selectedSeason: initialSeasons.order[0],
  view: View.Chart,
}

const navigationSlice = createSlice({
  name: 'UI',
  initialState,
  reducers: {
    setSelectedSeason(state, action: PayloadAction<string>) {
      state.selectedSeason = action.payload
    },
    setView(state, action: PayloadAction<View>) {
      state.view = action.payload
    },
  },
})

export const { setSelectedSeason, setView } = navigationSlice.actions
export default navigationSlice.reducer

export const getView = (state: RootState) => state.UI.view
export const getSelectedSeasonName = (state: RootState) =>
  state.UI.selectedSeason
export const getSelectedSeason = (state: RootState) =>
  getSeasonById(state, state.UI.selectedSeason)
