import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/store/hooks'
import { getAISummary } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import { getTeamName } from 'types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { Button } from './ui/button'
import { getSinglePinnedTeam } from '@/store/slices/chart'

export default function TeamSeasonSummary() {
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)
  const season = useSeason()
  const summary = getAISummary(season, singlePinnedTeam)

  const teamName = singlePinnedTeam ? getTeamName(singlePinnedTeam) : undefined

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button disabled={!singlePinnedTeam || !summary} variant="outline">
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
