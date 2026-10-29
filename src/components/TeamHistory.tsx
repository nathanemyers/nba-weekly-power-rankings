import type { Team } from '@/types'
import type { Season } from '@/data/seasonData'
import { useAppDispatch } from '@/store/hooks'
import { useNavigate } from 'react-router'
import TrendMinimap from './TrendMinimap/TrendMinimap'
import { setPinnedTeams } from '@/store/slices/chart'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import DataSourceBadge from './Badges/DataSourceBadge'
import PlayoffSeriesBadges from './Badges/PlayoffSeriesBadges'

interface TeamHistoryProps {
  team: Team
  seasons: Season[]
}
export default function TeamHistory(props: TeamHistoryProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      {props.seasons.map((season) => {
        const team = season.teams.find((team) => team.teamId === props.team)
        if (!team) return null

        return (
          <Card
            key={season.name}
            className="cursor-pointer"
            onClick={() => {
              dispatch(setPinnedTeams([props.team]))
              navigate('/' + season.name)
            }}
          >
            <CardContent>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex w-full flex-col gap-2 sm:grid sm:grid-cols-2 sm:content-center">
                  <div className="flex flex-row items-center gap-4">
                    <h2 className="shrink-0 text-xl font-semibold sm:mr-6 sm:text-2xl">
                      {season.name}
                    </h2>
                    <div className="w-full content-center md:w-100">
                      <TrendMinimap team={team.teamId} season={season} />
                    </div>
                  </div>
                  <PlayoffSeriesBadges
                    className="sm:justify-end sm:justify-self-end"
                    series={team.playoffSeries}
                  />
                </div>
              </div>
              <p className="text-base leading-normal text-foreground-soft">
                {team.aiSummary}
              </p>
              <div className="flex flex-row flex-wrap items-center justify-end gap-2 mt-2">
                <DataSourceBadge source={season.source} season={season.name} />
                {team.aiSummary && (
                  <Badge
                    variant="outline"
                    className="whitespace-nowrap text-muted-foreground"
                  >
                    AI-generated summary
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
