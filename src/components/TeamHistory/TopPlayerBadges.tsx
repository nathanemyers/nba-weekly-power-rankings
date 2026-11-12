import { Link } from 'react-router'
import { getTopPlayersByMinutes, type Season } from '@/data/seasonData'
import type { TeamRankings } from 'types'
import { Badge } from '../ui/badge'

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
      className="flex flex-wrap gap-2"
    >
      {players.map((player) => (
        <li key={player.id}>
          <Badge
            asChild
            variant="outline"
            className="h-7 cursor-pointer px-2.5 text-sm hover:bg-muted"
          >
            <Link to={'/playerHistory/' + player.id}>{player.name}</Link>
          </Badge>
        </li>
      ))}
    </ul>
  )
}
