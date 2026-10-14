import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Team } from 'types'
import { seasonSelected } from 'store/slices/navigation'
import { selectSeasonView } from 'store/slices/seasons'
import type { RootState } from 'store/redux'

type SelectionState = { pinnedTeams: Team[] }

const initialState: SelectionState = { pinnedTeams: [] }

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    pinToggled(state, action: PayloadAction<Team | undefined>) {
      const team = action.payload
      state.pinnedTeams =
        team && !state.pinnedTeams.includes(team) ? [team] : []
    },
  },
  extraReducers: (builder) => {
    builder.addCase(seasonSelected, (state) => {
      state.pinnedTeams = []
    })
  },
})

export const { pinToggled } = selectionSlice.actions
export default selectionSlice.reducer

export const selectPinnedTeams = (state: RootState) =>
  state.selection.pinnedTeams

export const selectPinnedTeam = (state: RootState) => {
  const pinned = state.selection.pinnedTeams
  if (pinned.length !== 1) return undefined
  return selectSeasonView(state)?.teams.find(
    (team) => team.teamId === pinned[0]
  )
}
