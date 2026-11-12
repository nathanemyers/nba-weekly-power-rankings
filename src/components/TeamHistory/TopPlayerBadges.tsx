import { Link } from 'react-router'
import { cn } from 'cn'
import { getTopPlayersByMinutes, type Season } from '@/data/seasonData'
import type { TeamRankings } from 'types'
import { Badge } from '../ui/badge'
import { shortPlayerName } from '../PlayerStats/shortPlayerName'
import {
  isRatable,
  RATING_CLASSES,
  statRating,
} from '../PlayerStats/statRating'

interface TopPlayerBadgesProps {
  season: Season
  team: TeamRankings
}

export default function TopPlayerBadges(props: TopPlayerBadgesProps) {
  const players = getTopPlayersByMinutes(props.team.roster)
  if (!players.length) return null

  return (
    <ul
      aria-label={`${props.season.name} top players by minutes`}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {players.map((player) => {
        const rating = statRating(player, 'per')
        const per = player.per === null ? '–' : player.per.toFixed(1)
        return (
          <li key={player.id} className="min-w-0">
            <Badge
              asChild
              variant="outline"
              className="h-7 w-full cursor-pointer justify-between gap-2 px-2.5 text-sm hover:bg-muted"
            >
              <Link
                to={'/playerHistory/' + player.id}
                title={player.name}
                aria-label={`${player.name}, PER ${per}`}
              >
                <span className="truncate sm:hidden">
                  {shortPlayerName(player.name)}
                </span>
                <span className="hidden truncate sm:inline">{player.name}</span>
                <span
                  data-rating={isRatable(player) ? rating : 'unrated'}
                  className={cn(
                    'shrink-0 tabular-nums',
                    rating ? RATING_CLASSES[rating] : 'text-muted-foreground'
                  )}
                >
                  {per}
                </span>
              </Link>
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
