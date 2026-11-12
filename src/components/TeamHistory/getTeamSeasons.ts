import type { Season } from '@/data/seasonData'
import type { Team, TeamRankings } from 'types'

export type TeamSeason = { season: Season; team: TeamRankings }

export const getTeamSeasons = (seasons: Season[], team: Team): TeamSeason[] =>
  seasons.flatMap((season) => {
    const rankings = season.teams.find((t) => t.teamId === team)
    return rankings ? [{ season, team: rankings }] : []
  })
