import { useId } from 'react'
import { cn } from 'cn'
import { Team, Teams } from 'types'
import { getYforRank } from 'components/Chart/utils'
import type { Season } from '@/data/seasonData'

const PADDING = 3
const MARGIN = { top: PADDING, right: PADDING, bottom: PADDING, left: PADDING }
const BAND_SIZE = Teams.length / 3

interface TrendMinimapProps {
  team: Team
  season: Season
  width?: number
  height?: number
  className?: string
}

export default function TrendMinimap(props: TrendMinimapProps) {
  const { season } = props
  const { rankings } = season.teams.find((t) => t.teamId === props.team)!

  const clipId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const width = props.width ?? 96
  const height = props.height ?? 40
  const plotWidth = width - MARGIN.left - MARGIN.right
  const lastStep = Math.max(1, season.maxWeek - 1)

  const x = (week: number) => MARGIN.left + ((week - 1) / lastStep) * plotWidth
  const y = (rank: number) => getYforRank(rank, height, MARGIN)

  // Start a new subpath after a missing week so the line doesn't bridge the gap
  const d = rankings
    .map((r, i) => {
      const prev = rankings[i - 1]
      const move = !prev || prev.week !== r.week - 1 ? 'M' : 'L'
      return `${move}${x(r.week)},${y(r.rank)}`
    })
    .join(' ')

  const topBoundary = y(BAND_SIZE + 0.5)
  const bottomBoundary = y(BAND_SIZE * 2 + 0.5)
  // Safari misplaces gradients on non-scaling strokes, so each band is a solid line clipped to its slice
  const bands = [
    { name: 'top', top: 0, bottom: topBoundary, className: 'stroke-rank-up' },
    {
      name: 'middle',
      top: topBoundary,
      bottom: bottomBoundary,
      className: 'stroke-rank-mid',
    },
    {
      name: 'bottom',
      top: bottomBoundary,
      bottom: height,
      className: 'stroke-rank-down',
    },
  ]

  return (
    // A size-* class opts out of library icon sizing, and preserveAspectRatio none lets callers stretch the line
    <svg
      className={cn('size-auto shrink-0', props.className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {bands.map((band) => (
          <clipPath key={band.name} id={`${clipId}-${band.name}`}>
            <rect
              x={0}
              y={band.top}
              width={width}
              height={band.bottom - band.top}
            />
          </clipPath>
        ))}
      </defs>
      {bands.map((band) => (
        <path
          key={band.name}
          data-band={band.name}
          d={d}
          clipPath={`url(#${clipId}-${band.name})`}
          className={band.className}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
