import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { useAppSelector } from '@/store/hooks'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { getMostImprovedTeams, getMostDeclinedTeams } from '@/data/analysis'
import type { Season } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import TeamLogo from './TeamLogo'
import { useDispatch } from 'react-redux'
import type { Team } from '@/types'
import { Button } from './ui/button'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card'

function TeamMinimapCard(props: {
  team: Team
  season: Season
  isPressed: boolean
  onClick: () => void
}) {
  console.log('is pressed', props.isPressed)
  return (
    <Toggle
      className="w-auto h-auto p-3"
      onClick={props.onClick}
      pressed={props.isPressed}
    >
      <TeamLogo team={props.team} />
      <TrendMinimap team={props.team} season={props.season} />
    </Toggle>
  )
}

export default function RankSwings() {
  const dispatch = useDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const season = useSeason()

  const biggestRisers = getMostImprovedTeams(season)
  const biggestFallers = getMostDeclinedTeams(season)

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button variant="outline">Season Trends</Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side={'bottom'}
        className="flex w-auto h-auto flex-col gap-0.5"
      >
        <h1>Biggest Up</h1>
        <div className="flex direction-row gap-5 justify-between">
          {biggestRisers.map(({ team }) => (
            <TeamMinimapCard
              key={team}
              isPressed={pinnedTeams.length === 1 && pinnedTeams[0] === team}
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
              season={season}
            />
          ))}
        </div>
        <h1>Biggest Down</h1>
        <div className="flex direction-row gap-5 justify-between">
          {biggestFallers.map(({ team }) => (
            <TeamMinimapCard
              key={team}
              isPressed={pinnedTeams.length === 1 && pinnedTeams[0] === team}
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
              season={season}
            />
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
