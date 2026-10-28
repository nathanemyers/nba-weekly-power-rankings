import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { getMostImprovedTeams, getMostDeclinedTeams } from '@/data/analysis'
import type { Season } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import TeamLogo from './TeamLogo'
import type { Team } from '@/types'

function TeamMinimapCard(props: {
  team: Team
  season: Season
  isPressed: boolean
  onClick: () => void
}) {
  return (
    <Toggle
      className="h-auto w-full cursor-pointer justify-start gap-3 p-3 sm:w-auto sm:justify-center"
      onClick={props.onClick}
      pressed={props.isPressed}
    >
      <TeamLogo
        team={props.team}
        className="size-12 shrink-0 object-contain sm:size-auto"
      />
      <TrendMinimap
        team={props.team}
        season={props.season}
        className="h-10 w-auto min-w-0 flex-1 sm:size-auto sm:flex-none"
      />
    </Toggle>
  )
}

export default function RankSwings() {
  const dispatch = useAppDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const season = useSeason()

  const biggestRisers = getMostImprovedTeams(season)
  const biggestFallers = getMostDeclinedTeams(season)

  const row = (teams: typeof biggestRisers) => (
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
      {teams.map(({ team }) => (
        <TeamMinimapCard
          key={team}
          isPressed={pinnedTeams.length === 1 && pinnedTeams[0] === team}
          onClick={() => dispatch(setPinnedTeams([team]))}
          team={team}
          season={season}
        />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm text-muted-foreground">Biggest Up</h3>
      {row(biggestRisers)}
      <h3 className="mt-2 text-sm text-muted-foreground">Biggest Down</h3>
      {row(biggestFallers)}
    </div>
  )
}
