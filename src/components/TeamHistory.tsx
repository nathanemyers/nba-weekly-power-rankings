import type { Team } from '@/types'
import { getSeasons } from '@/store/slices/seasons/seasons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import TrendMinimap from './TrendMinimap/TrendMinimap'
import { setSelectedSeason, setView, View } from '@/store/slices/UI'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import DataSourceBadge from './DataSourceBadge'
import PlayoffSeriesBadges from './PlayoffSeriesBadges'

interface TeamHistoryProps {
  team: Team
}
export default function TeamHistory(props: TeamHistoryProps) {
  const seasons = useAppSelector(getSeasons)
  const dispatch = useAppDispatch()

  return (
    <div className="flex flex-col gap-5">
      {seasons.map((season) => {
        const team = season.teams.find((team) => team.teamId === props.team)
        if (!team) return null

        return (
          <Card
            key={season.name}
            className="cursor-pointer"
            onClick={() => {
              dispatch(setView(View.Chart))
              dispatch(setSelectedSeason(season.name))
            }}
          >
            <CardContent>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 content-center">
                  <div className="flex direction-row">
                    <h2 className="text-2xl font-semibold shrink mr-10">
                      {season.name}
                    </h2>
                    <div className="content-center md:w-100">
                      <TrendMinimap team={team.teamId} seasonId={season.name} />
                    </div>
                  </div>
                  <PlayoffSeriesBadges
                    className="justify-end justify-self-end"
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
