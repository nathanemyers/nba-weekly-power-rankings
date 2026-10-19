import TeamHistory from '@/components/TeamHistory'
import TeamLogo from '@/components/TeamLogo'
import { useAppSelector } from '@/store/hooks'
import { getSinglePinnedTeam } from '@/store/slices/chart'
import { getTeamName } from '@/types'

export default function TeamHistoryView() {
  const team = useAppSelector(getSinglePinnedTeam)!
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
