import { useAppSelector } from '@/store/hooks'
import { getTeamStorylines } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import { getTeamName } from 'types'
import { getSinglePinnedTeam } from '@/store/slices/chart'
import StorylineList from './StorylineList'

export default function TeamStorylinesPane() {
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)
  const season = useSeason()
  const storylines = getTeamStorylines(season, singlePinnedTeam)

  if (!singlePinnedTeam || !storylines.length) return null

  return (
    <StorylineList
      label={`${getTeamName(singlePinnedTeam)} storylines`}
      storylines={storylines}
      hideTeam={singlePinnedTeam}
    />
  )
}
