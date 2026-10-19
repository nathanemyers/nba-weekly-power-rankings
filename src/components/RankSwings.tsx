import { Card, CardContent } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { PLAYOFF_MEDALS } from 'components/Chart/utils'
import { useAppSelector } from '@/store/hooks'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import {
  getMostImprovedTeams,
  getMostDeclinedTeams,
} from '@/store/slices/seasons/analysis'
import TeamLogo from './TeamLogo'
import { useDispatch } from 'react-redux'
import { getSelectedSeason } from '@/store/slices/UI'
import type { Team } from '@/types'
import { Button } from './ui/button'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui/hover-card'

interface RankSwingsProps {}

function TeamMinimapCard(props: {
  team: Team
  seasonId: string
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
      <TrendMinimap team={props.team} seasonId={props.seasonId} />
    </Toggle>
  )
}

export default function RankSwings() {
  const dispatch = useDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const season = useAppSelector(getSelectedSeason)

  const biggestRisers = useAppSelector(getMostImprovedTeams)
  const biggestFallers = useAppSelector(getMostDeclinedTeams)

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
              seasonId={season.name}
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
              seasonId={season.name}
            />
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
