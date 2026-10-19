import { useId } from 'react'
import { Team, Teams } from 'types'
import { getYforRank } from 'components/Chart/utils'
import { useAppSelector } from '@/store/hooks'
import { getSeasonById } from '@/store/slices/seasons'

const PADDING = 3
const MARGIN = { top: PADDING, right: PADDING, bottom: PADDING, left: PADDING }
const BAND_SIZE = Teams.length / 3

interface TrendMinimapProps {
  team: Team
  seasonId: string
  width?: number
  height?: number
}

export default function TrendMinimap(props: TrendMinimapProps) {
  const season = useAppSelector((state) => getSeasonById(state, props.seasonId))
  const { rankings } = season.teams.find((t) => t.teamId === props.team)!

  const gradientId = useId()
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

  const topBoundary = y(BAND_SIZE + 0.5) / height
  const bottomBoundary = y(BAND_SIZE * 2 + 0.5) / height

  return (
    // A size-* class opts out of the icon sizing library controls apply to nested SVGs
    <svg
      className="size-auto shrink-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={0}
          y2={height}
        >
          <stop
            offset={topBoundary}
            data-band="top"
            className="[stop-color:var(--color-rank-up)]"
          />
          <stop
            offset={topBoundary}
            data-band="middle"
            className="[stop-color:var(--color-rank-mid)]"
          />
          <stop
            offset={bottomBoundary}
            data-band="middle"
            className="[stop-color:var(--color-rank-mid)]"
          />
          <stop
            offset={bottomBoundary}
            data-band="bottom"
            className="[stop-color:var(--color-rank-down)]"
          />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
