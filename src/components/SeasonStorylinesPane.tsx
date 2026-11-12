import { getSeasonStorylines } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import StorylineList from './StorylineList'

export default function SeasonStorylinesPane() {
  const season = useSeason()
  const storylines = getSeasonStorylines(season)
  if (!storylines.length) return null

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Season storylines</h2>
      <StorylineList
        label={`${season.name} storylines`}
        storylines={storylines}
      />
    </div>
  )
}
