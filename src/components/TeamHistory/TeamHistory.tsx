import type { Season } from '@/data/seasonData'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Team } from 'types'
import TeamHistoryAccordion from './TeamHistoryAccordion'
import TeamHistoryColumns from './TeamHistoryColumns'

interface TeamHistoryProps {
  team: Team
  seasons: Season[]
}

export default function TeamHistory(props: TeamHistoryProps) {
  const narrow = useMediaQuery('(max-width: 1023.98px)')
  return narrow ? (
    <TeamHistoryAccordion team={props.team} seasons={props.seasons} />
  ) : (
    <TeamHistoryColumns team={props.team} seasons={props.seasons} />
  )
}
