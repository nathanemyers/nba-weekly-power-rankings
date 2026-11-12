import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/store/hooks'
import { getAISummary, getTeamStorylines } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import { getTeamName } from 'types'
import { getSinglePinnedTeam } from '@/store/slices/chart'
import StorylineList from './StorylineList'

export default function TeamSeasonSummary() {
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)
  const season = useSeason()
  const summary = getAISummary(season, singlePinnedTeam)
  const storylines = getTeamStorylines(season, singlePinnedTeam)

  if (!singlePinnedTeam || (!summary && !storylines.length)) return null

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {getTeamName(singlePinnedTeam)}
        </h2>
        {summary && (
          <Badge
            variant="outline"
            className="whitespace-nowrap text-muted-foreground"
          >
            AI-generated summary
          </Badge>
        )}
      </div>
      {summary && (
        <p className="text-base leading-normal text-foreground-soft">
          {summary}
        </p>
      )}
      {storylines.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-lg font-semibold">Storylines</h2>
          <StorylineList
            label={`${getTeamName(singlePinnedTeam)} storylines`}
            storylines={storylines}
            hideTeam={singlePinnedTeam}
          />
        </>
      )}
    </div>
  )
}
