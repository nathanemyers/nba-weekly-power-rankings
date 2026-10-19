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

interface RankSwingsProps {}

export default function RankSwings(props: RankSwingsProps) {
  const dispatch = useDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)

  const biggestRisers = useAppSelector(getMostImprovedTeams)
  const biggestFallers = useAppSelector(getMostDeclinedTeams)
  const mostChaotic = useAppSelector(getMostChaoticTeams)

  return (
    <Card role="region" aria-label="Biggest rank swings" className="mt-5">
      <CardContent className="space-y-4">
        <h1>Biggest Up</h1>
        <div className="flex direction-row gap-5">
          {biggestRisers.map(({ team }) => (
            <TeamLogo
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
            />
          ))}
        </div>
        <h1>Biggest Down</h1>
        <div className="flex direction-row gap-5">
          {biggestFallers.map(({ team }) => (
            <TeamLogo
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
            />
          ))}
        </div>
        <h1>Most Chaotic Up</h1>
        <div className="flex direction-row gap-5">
          {mostChaotic.map(({ team }) => (
            <TeamLogo
              onClick={() => dispatch(setPinnedTeams([team]))}
              team={team}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
