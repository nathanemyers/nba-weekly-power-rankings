import { createSlice } from '@reduxjs/toolkit'
import { seasonData, seasons } from 'data/seasons'
import { loadSeasons } from './loadSeasons'
import type { RootState } from 'store/redux'
import type { Team, TeamRankings } from '@/types/nba'

export const initialSeasons = loadSeasons(seasons, seasonData)

export type Season = {
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
  return state.seasons.order.map((season) => ({
    name: season,
    ...state.seasons.seasons[season],
  }))
}
export const getSeasonById = (state: RootState, season: string) =>
  state.seasons.seasons[season]
export const getInvalidSeasons = (state: RootState) =>
  state.seasons.invalidSeasons
