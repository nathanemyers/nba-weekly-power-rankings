import type { RootState } from '@/store/redux'
import type { Team } from '@/types'
import { type Season } from './seasons'
import { getSelectedSeason } from '../UI'

function getSeasonDelta(team: Team, season: Season) {
  const teamRankings = season.teams.find((t) => t.teamId === team)
  if (!teamRankings) throw new Error('could not find team')

  // skip the first rank which is a preseason rank
  const start = teamRankings.rankings[1]
  const end = teamRankings.rankings[teamRankings.rankings.length - 1]

  return start.rank - end.rank
}

export function getMostImprovedTeams(
  state: RootState,
  returnAmount: number = 3
) {
  const season = getSelectedSeason(state)

  return season.teams
    .map((team) => {
      return {
        team: team.teamId,
        value: getSeasonDelta(team.teamId, season),
      }
    })
    .sort((a, b) => {
      return a.value < b.value ? 1 : -1
    })
    .slice(0, returnAmount)
}

export function getMostDeclinedTeams(
  state: RootState,
  returnAmount: number = 3
) {
  const season = getSelectedSeason(state)

  return season.teams
    .map((team) => {
      return {
        team: team.teamId,
        value: getSeasonDelta(team.teamId, season),
      }
    })
    .sort((a, b) => {
      return a.value > b.value ? 1 : -1
    })
    .slice(0, returnAmount)
}
