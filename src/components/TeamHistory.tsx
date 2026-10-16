import type { Team } from '@/types'
import TeamSeasonSummary from './TeamSeasonSummary'
import { getSeasons } from '@/store/slices/seasons/seasons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import TrendMinimap from './TrendMinimap/TrendMinimap'
import { setSelectedSeason, setView, View } from '@/store/slices/UI'

interface TeamHistoryProps {
  team: Team
}
export default function TeamHistory(props: TeamHistoryProps) {
  const seasons = useAppSelector(getSeasons)
  const dispatch = useAppDispatch()

  return (
    <div className="flex flex-col gap-1">
      {seasons.map((season) => {
        const teamRankings = season.teams.find(
          (team) => team.teamId === props.team
        )
        if (!teamRankings) return null

        return (
          <div
            key={season.name}
            onClick={() => {
              dispatch(setView(View.Chart))
              dispatch(setSelectedSeason(season.name))
            }}
          >
            <h3>{season.name}</h3>
            <div className="flex flex-row gap-1">
              <div className="w-100 h-20">
                <TrendMinimap
                  rankings={teamRankings.rankings}
                  maxWeek={season.maxWeek}
                />
              </div>
              <TeamSeasonSummary
                key={season.name}
                season={season.name}
                team={props.team}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
