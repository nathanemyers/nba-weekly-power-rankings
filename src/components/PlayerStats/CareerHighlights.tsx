import { getCareerAwardsHighlights } from '@/data/awards'
import type { PlayerSummary } from '@/data/playerHistory'
import AwardBadge from 'components/Badges/AwardBadge'

export default function CareerHighlights({
  player,
  limit,
}: {
  player: PlayerSummary
  limit: number
}) {
  const highlightAwards = getCareerAwardsHighlights(player.awardSummary, limit)
  return (
    <div className="flex flex-row flex-wrap gap-3">
      {highlightAwards.map((award) => (
        <div
          key={award.award.code}
          className="flex flex-row gap-1 items-center"
        >
          <AwardBadge award={award.award} />{' '}
          <span className="text-sm">x{award.times}</span>
        </div>
      ))}
    </div>
  )
}
