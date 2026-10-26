import { createSelector, createSlice } from '@reduxjs/toolkit'
import { seasonData, seasons } from 'data/seasons'
import { loadSeasons } from './loadSeasons'
import type { RootState } from 'store/redux'
import type { DataSource, Team, TeamRankings } from '@/types/nba'

export const initialSeasons = loadSeasons(seasons, seasonData)

export type Season = {
  name: string
  source: DataSource
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

// Memoized so the season list keeps one reference; season data never changes after load
export const getSeasons = createSelector(
  [
    (state: RootState) => state.seasons.order,
    (state: RootState) => state.seasons.seasons,
  ],
  (order, seasons) => order.map((season) => seasons[season])
)
export const getSeasonById = (state: RootState, season: string) =>
  state.seasons.seasons[season]
export const getInvalidSeasons = (state: RootState) =>
  state.seasons.invalidSeasons

export const getAISummaryForSeason = (
  state: RootState,
  teamId: Team | undefined,
  seasonName: string
) => {
  if (!teamId) return undefined
  const season = getSeasonById(state, seasonName)
  if (!season) {
    return undefined
  }

  const team = season.teams.find((t) => t.teamId === teamId)
  return team?.aiSummary
}
