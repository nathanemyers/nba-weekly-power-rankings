import { cn } from 'cn'
import {
  MIN_RATED_GAMES,
  MIN_RATED_MINUTES,
  RATING_BANDS,
  type StatRating,
} from './statRating'

const RATING_FILLS: Record<StatRating, string> = {
  elite: 'bg-stat-elite',
  good: 'bg-stat-good',
  fair: 'bg-stat-fair',
  poor: 'bg-stat-poor',
}

const RATING_NAMES: Record<StatRating, string> = {
  elite: 'purple',
  good: 'green',
  fair: 'yellow',
  poor: 'red',
}

export default function RatingKey() {
  const description = `Stat colors, lowest to highest: ${RATING_BANDS.map(
    (band) => `${RATING_NAMES[band.rating]} ${band.percent}%`
  ).join(
    ', '
  )}. Players under ${MIN_RATED_GAMES} games or ${MIN_RATED_MINUTES} minutes per game are gray and not rated.`

  return (
    <div role="img" aria-label={description} className="w-64 shrink-0">
      <div aria-hidden className="flex text-xs text-muted-foreground">
        {RATING_BANDS.map((band) => (
          <span
            key={band.rating}
            className="text-center tabular-nums"
            style={{ flexGrow: band.percent, flexBasis: 0 }}
          >
            {band.percent}%
          </span>
        ))}
      </div>
      <div aria-hidden className="mt-0.5 flex h-3 overflow-hidden rounded-sm">
        {RATING_BANDS.map((band) => (
          <span
            key={band.rating}
            className={cn(
              'border-foreground not-first:border-l-2',
              RATING_FILLS[band.rating]
            )}
            style={{ flexGrow: band.percent, flexBasis: 0 }}
          />
        ))}
      </div>
    </div>
  )
}
