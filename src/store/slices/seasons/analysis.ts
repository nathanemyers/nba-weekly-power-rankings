import type { RootState } from '@/store/redux'
import type { Team } from '@/types'
import { getSeasonById, type Season } from './seasons'
import { useAppSelector } from '@/store/hooks'
import { getSelectedSeason } from '../UI'

function calcRankChange(
  season: Season,
  team: Team,
  calc: (acc: number, diff: number) => number
) {
  const teamRankings = season.teams.find((t) => t.teamId === team)
  if (!teamRankings) throw new Error('could not find team')

  const rankings = teamRankings.rankings

  return rankings.reduce((acc, currentWeek, i) => {
    if (i === 0) {
      return 0
    }

    const lastWeek = rankings[i - 1]
    const diff = currentWeek.rank - lastWeek.rank

    return calc(acc, diff)
  }, 0)
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
        value: calcRankChange(season, team.teamId, (acc, diff) => {
          if (diff < 0) {
            return acc + diff
          } else {
            return acc
          }
        }),
      }
    })
    .sort((a, b) => {
      return a.value > b.value ? 1 : -1
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
        value: calcRankChange(season, team.teamId, (acc, diff) => {
          if (diff > 0) {
            return acc + diff
          } else {
            return acc
          }
        }),
      }
    })
    .sort((a, b) => {
      return a.value < b.value ? 1 : -1
    })
    .slice(0, returnAmount)
}

export function getMostChaoticTeams(
  state: RootState,
  returnAmount: number = 3
) {
  const season = getSelectedSeason(state)

  return season.teams
    .map((team) => {
      return {
        team: team.teamId,
        value: calcRankChange(season, team.teamId, (acc, diff) => {
          return acc + Math.abs(diff)
        }),
      }
    })
    .sort((a, b) => {
      return a.value < b.value ? 1 : -1
    })
    .slice(0, returnAmount)
}
