import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { initialSeasons } from '@/store/slices/seasons/seasons'
import type { RootState } from 'store/redux'

// Holds what the visitor is looking at; future routes and UI state belong here too
type UIState = {
  selectedSeason: string
}

const initialState: UIState = { selectedSeason: initialSeasons.order[0] }

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

export const getSelectedSeason = (state: RootState) => state.UI.selectedSeason
