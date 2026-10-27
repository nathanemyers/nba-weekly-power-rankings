import { cn } from 'cn'
import {
  getTeamName,
  PlayoffStage,
  type SeriesResult,
  type SeriesRound,
  type Team,
} from 'types'
import { PLAYOFF_MEDALS } from '../Chart/utils'
import TeamLogo from '../TeamLogo'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface PlayoffSeriesBadgesProps {
  series?: SeriesResult[]
  className?: string
  onTeamClick?: (team: Team) => void
}

const ROUND_LABELS: Record<SeriesRound, string> = {
  [PlayoffStage.FirstRound]: 'First round',
  [PlayoffStage.SecondRound]: 'Second round',
  [PlayoffStage.ConferenceFinals]: 'Conference finals',
  [PlayoffStage.Finals]: 'Finals',
}

export default function PlayoffSeriesBadges(props: PlayoffSeriesBadgesProps) {
  if (!props.series?.length) return null

  return (
    <ul
      aria-label="Playoff series"
      className={cn('flex flex-wrap items-center gap-1.5', props.className)}
    >
      {props.series.map((result) => {
        const won = result.wins === 4
        // A won Finals is the title, so it gets the champion's ring rather than the Finals cup
        const medal =
          result.round === PlayoffStage.Finals && won
            ? PLAYOFF_MEDALS[PlayoffStage.Champion].icon
            : PLAYOFF_MEDALS[result.round].icon
        const description = `${ROUND_LABELS[result.round]}: ${won ? 'defeated' : 'lost to'} ${getTeamName(result.opponent)} ${result.wins}-${result.losses}`

        return (
          <li key={result.round}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  asChild
                  variant="outline"
                  className={cn(
                    'h-7 gap-1 px-1.5 text-sm',
                    props.onTeamClick ? 'cursor-pointer' : 'cursor-default',
                    won
                      ? 'border-series-won bg-series-won/15 text-foreground'
                      : 'border-series-lost bg-series-lost/15 text-foreground'
                  )}
                >
                  <button
                    type="button"
                    aria-label={description}
                    onClick={(event) => {
                      event.stopPropagation()
                      props.onTeamClick?.(result.opponent)
                    }}
                  >
                    <TeamLogo
                      team={result.opponent}
                      alt=""
                      className="size-5 object-contain"
                    />
                    <span>{result.wins + result.losses}</span>
                    <span aria-hidden>{medal}</span>
                  </button>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
