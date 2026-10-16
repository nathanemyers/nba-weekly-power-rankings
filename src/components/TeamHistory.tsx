import type { Team } from '@/types'
import TeamSeasonSummary from './TeamSeasonSummary'
import { getSeasons } from '@/store/slices/seasons/seasons'
import { useAppSelector } from '@/store/hooks'
import TrendMinimap from './TrendMinimap/TrendMinimap'

interface TeamHistoryProps {
  team: Team
}
export default function TeamHistory(props: TeamHistoryProps) {
  const seasons = useAppSelector(getSeasons)

  return (
    <div className="flex flex-direction-column gap-1">
      {seasons.map((season) => {
        const teamRankings = season.teams.find(
          (team) => team.name === props.team
        )
        if (!teamRankings) return null

        return (
          <div key={season.name} className="flex flex-row-column gap-1">
            <TrendMinimap
              rankings={teamRankings.rankings}
              maxWeek={season.maxWeek}
            />
            <TeamSeasonSummary
              key={season.name}
              season={season.name}
              team={props.team}
            />
          </div>
        )
      })}
    </div>
  )
}
