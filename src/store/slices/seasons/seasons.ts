import { createSlice } from '@reduxjs/toolkit'
import { seasonData, seasons } from 'data/seasons'
import { loadSeasons } from './loadSeasons'
import type { RootState } from 'store/redux'
import type { Team, TeamRankings } from '@/types/nba'

export const initialSeasons = loadSeasons(seasons, seasonData)

export type Season = {
  name: string
  teams: TeamRankings[]
  maxWeek: number
  completed: boolean
  champion?: Team
}

export type InvalidSeason = { season: string; message: string }

export type SeasonsState = {
  order: string[]
  seasons: Record<string, Season>
  invalidSeasons: InvalidSeason[]
}

const seasonsSlice = createSlice({
  name: 'seasons',
  initialState: initialSeasons,
  reducers: {},
})

export default seasonsSlice.reducer

export const getSeasons = (state: RootState) => {
  return state.seasons.order.map((season) => state.seasons.seasons[season])
}
export const getSeasonById = (state: RootState, season: string) =>
  state.seasons.seasons[season]
export const getInvalidSeasons = (state: RootState) =>
  state.seasons.invalidSeasons

export const getAISummaryForSeason = (
  state: RootState,
  teamId: Team,
  seasonName: string
) => {
  const season = getSeasonById(state, seasonName)
  if (!season) {
    return undefined
  }

  const team = season.teams.find((t) => t.teamId === teamId)
  return team?.aiSummary
}
