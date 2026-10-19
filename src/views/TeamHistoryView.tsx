import TeamHistory from '@/components/TeamHistory'
import TeamLogo from '@/components/TeamLogo'
import { useAppSelector } from '@/store/hooks'
import { getPinnedTeams } from '@/store/slices/chart'
import { getTeamName } from '@/types'

export default function TeamHistoryView() {
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const team = pinnedTeams[0]
  const displayName = getTeamName(team)

  return (
    <div className="flex flex-col">
      <h1 className="flex flex-row items-center gap-5 mb-10 text-4xl">
        <TeamLogo team={team} />
        {displayName} Team History
      </h1>
      <TeamHistory team={team} />
    </div>
  )
}
