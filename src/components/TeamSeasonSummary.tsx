import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/store/hooks'
import { getAISummaryForSeason } from '@/store/slices/seasons/seasons'
import { getTeamName } from 'types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { Button } from './ui/button'
import { getSinglePinnedTeam } from '@/store/slices/chart'
import { getSelectedSeason } from '@/store/slices/UI'

export default function TeamSeasonSummary() {
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)
  const selectedSeason = useAppSelector(getSelectedSeason)

  const summary = useAppSelector((state) =>
    getAISummaryForSeason(state, singlePinnedTeam, selectedSeason.name)
  )

  const teamName = singlePinnedTeam ? getTeamName(singlePinnedTeam) : undefined

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button disabled={!singlePinnedTeam} variant="outline">
          AI Summary
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" side="bottom" className="w-200">
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
      </HoverCardContent>
    </HoverCard>
  )
}
