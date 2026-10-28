import { cn } from 'cn'
import type { RosterEntry } from 'types'
import {
  isRatable,
  statRating,
  type RatedStat,
  type StatRating,
} from './statRating'
import { TableCell, TableHead } from 'components/ui/table'

export type StatColumn = {
  label: string
  title: string
  value: (player: RosterEntry) => string
  rated?: RatedStat
}

const RATING_CLASSES: Record<StatRating, string> = {
  elite: 'text-stat-elite',
  good: 'text-stat-good',
  fair: 'text-stat-fair',
  poor: 'text-stat-poor',
}

const decimal = (value: number | null) =>
  value === null ? '–' : value.toFixed(1)

const STAT_COLUMNS: StatColumn[] = [
  { label: 'Pos', title: 'Position', value: (p) => p.pos },
  {
    label: 'Age',
    title: 'Age on February 1 of the season',
    value: (p) => String(p.age),
  },
  { label: 'G', title: 'Games played', value: (p) => String(p.g) },
  { label: 'MIN', title: 'Minutes per game', value: (p) => decimal(p.mpg) },
  {
    label: 'PTS',
    title: 'Points per game',
    value: (p) => decimal(p.pts),
    rated: 'pts',
  },
  {
    label: 'REB',
    title: 'Rebounds per game',
    value: (p) => decimal(p.trb),
    rated: 'trb',
  },
  {
    label: 'AST',
    title: 'Assists per game',
    value: (p) => decimal(p.ast),
    rated: 'ast',
  },
  {
    label: 'STL',
    title: 'Steals per game',
    value: (p) => decimal(p.stl),
    rated: 'stl',
  },
  {
    label: 'BLK',
    title: 'Blocks per game',
    value: (p) => decimal(p.blk),
    rated: 'blk',
  },
  {
    label: 'PER',
    title: 'Player Efficiency Rating',
    value: (p) => decimal(p.per),
    rated: 'per',
  },
]

export function StatHeads() {
  return STAT_COLUMNS.map((column) => (
    <TableHead key={column.label} title={column.title} className="text-right">
      {column.label}
    </TableHead>
  ))
}

export function StatCells(props: { player: RosterEntry }) {
  return STAT_COLUMNS.map((column) => {
    const unrated = column.rated && !isRatable(props.player)
    const rating = column.rated
      ? statRating(props.player, column.rated)
      : undefined
    return (
      <TableCell
        key={column.label}
        data-rating={unrated ? 'unrated' : rating}
        className={cn(
          'text-right tabular-nums',
          rating && RATING_CLASSES[rating],
          unrated && 'text-muted-foreground'
        )}
      >
        {column.value(props.player)}
      </TableCell>
    )
  })
}
