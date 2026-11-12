import type { ReactNode } from 'react'
import type { Season } from '@/data/seasonData'
import type { TeamRankings } from 'types'
import TrendMinimap from '../TrendMinimap/TrendMinimap'
import PlayoffSeriesBadges from '../Badges/PlayoffSeriesBadges'

interface SeasonOverviewProps {
  season: Season
  team: TeamRankings
  title: ReactNode
}

export default function SeasonOverview(props: SeasonOverviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="w-20 shrink-0 text-lg font-semibold">{props.title}</div>
        <TrendMinimap
          team={props.team.teamId}
          season={props.season}
          width={180}
        />
      </div>
      <div className="relative z-10 w-fit">
        <PlayoffSeriesBadges series={props.team.playoffSeries} />
      </div>
    </div>
  )
}
