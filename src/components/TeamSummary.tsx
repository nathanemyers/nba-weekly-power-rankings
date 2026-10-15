import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAppSelector } from '@/store/hooks'
import { getAISummaryForSeason } from '@/store/slices/seasons/seasons'
import { type Team, getTeamName } from 'types'

interface TeamSummaryProps {
  season: string
  team: Team
}

export default function TeamSummary(props: TeamSummaryProps) {
  const summary = useAppSelector((state) =>
    getAISummaryForSeason(state, props.team, props.season)
  )

  const teamName = getTeamName(props.team)

  return (
    <Card
      role="region"
      aria-label={`AI-generated summary for ${teamName}`}
      className="mt-5"
    >
      <CardContent>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{teamName}</h2>
          <Badge
            variant="outline"
            className="whitespace-nowrap text-muted-foreground"
          >
            AI-generated summary
          </Badge>
        </div>
        <p className="text-base leading-normal text-foreground-soft">
          {summary}
        </p>
      </CardContent>
    </Card>
  )
}
