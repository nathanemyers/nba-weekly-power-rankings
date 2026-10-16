import TeamHistory from '@/components/TeamHistory'
import { useAppSelector } from '@/store/hooks'
import { getPinnedTeams } from '@/store/slices/chart'

export default function TeamHistoryView() {
  console.log('team history')
  const pinnedTeams = useAppSelector(getPinnedTeams)

  return <TeamHistory team={pinnedTeams[0]} />
}
