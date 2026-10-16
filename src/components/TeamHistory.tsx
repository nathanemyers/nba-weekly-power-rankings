import type { Team } from '@/types'
import { getSeasons } from '@/store/slices/seasons/seasons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import TrendMinimap from './TrendMinimap/TrendMinimap'
import { setSelectedSeason, setView, View } from '@/store/slices/UI'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

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
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex flex-row content-center">
                  <h2 className="text-2xl font-semibold shrink mr-10">
                    {season.name}
                  </h2>
                  <div className="w-100 content-center">
                    <TrendMinimap
                      rankings={team.rankings}
                      maxWeek={season.maxWeek}
                    />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="whitespace-nowrap text-muted-foreground"
                >
                  AI-generated summary
                </Badge>
              </div>
              <p className="text-base leading-normal text-foreground-soft">
                {team.aiSummary}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
