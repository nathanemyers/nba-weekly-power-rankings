import { Card, CardContent } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { PLAYOFF_MEDALS } from 'components/Chart/utils'
import { useAppSelector } from '@/store/hooks'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import {
  getMostImprovedTeams,
  getMostDeclinedTeams,
  getMostChaoticTeams,
} from '@/store/slices/seasons/analysis'
import TeamLogo from '../TeamLogo'
import { useDispatch } from 'react-redux'
import { getSelectedSeason } from '@/store/slices/UI'
import type { Team } from '@/types'

interface RankSwingsProps {}

function TeamMinimapCard(props: {
  team: Team
  seasonId: string
  isPressed: boolean
  onClick: () => void
}) {
  console.log('is pressed', props.isPressed)
  return (
    <Toggle onClick={props.onClick} pressed={props.isPressed}>
      <TeamLogo team={props.team} />
      <TrendMinimap team={props.team} seasonId={props.seasonId} />
    </Toggle>
  )
}

export default function RankSwings(props: RankSwingsProps) {
  const dispatch = useDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const season = useAppSelector(getSelectedSeason)

  const biggestRisers = useAppSelector(getMostImprovedTeams)
  const biggestFallers = useAppSelector(getMostDeclinedTeams)
  const mostChaotic = useAppSelector(getMostChaoticTeams)

  return (
    <Card role="region" aria-label="Biggest rank swings" className="mt-5">
      <CardContent className="space-y-4">
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
        <h1>Most Chaotic Up</h1>
        <div className="flex direction-row gap-5 justify-between">
          {mostChaotic.map(({ team }) => (
            <TeamMinimapCard
              key={team}
              isPressed={pinnedTeams.length === 1 && pinnedTeams[0] === team}
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
              seasonId={season.name}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
