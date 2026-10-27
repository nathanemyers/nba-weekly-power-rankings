import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from 'cn'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getSinglePinnedTeam, setPinnedTeams } from '@/store/slices/chart'
import { getTeamRankings } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import {
  getTeamName,
  type CoachStint,
  type RosterEntry,
  type Team,
} from 'types'
import {
  RATING_BANDS,
  statRating,
  type RatedStat,
  type StatRating,
} from './statRating'
import TeamLogo from './TeamLogo'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

type StatColumn = {
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
    label: 'TOV',
    title: 'Turnovers per game',
    value: (p) => decimal(p.tov),
    rated: 'tov',
  },
  {
    label: 'PER',
    title: 'Player Efficiency Rating',
    value: (p) => decimal(p.per),
    rated: 'per',
  },
]

function MoveMark(props: { joined: boolean; team: Team }) {
  const dispatch = useAppDispatch()
  const description = props.joined
    ? `Joined from ${getTeamName(props.team)} mid-season`
    : `Left for ${getTeamName(props.team)} mid-season`
  const Arrow = props.joined ? ArrowLeft : ArrowRight

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          asChild
          variant="outline"
          className={cn(
            'h-6 cursor-pointer gap-1 px-1.5 hover:bg-muted',
            props.joined ? 'text-move-joined' : 'text-move-left'
          )}
        >
          <button
            type="button"
            aria-label={description}
            onClick={() => dispatch(setPinnedTeams([props.team]))}
          >
            <Arrow aria-hidden />
            <TeamLogo
              team={props.team}
              alt=""
              className="size-4 object-contain"
            />
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  )
}

function CoachLine(props: { coaches: CoachStint[] }) {
  return (
    <p className="text-muted-foreground">
      {props.coaches.length > 1 ? 'Head coaches: ' : 'Head coach: '}
      {props.coaches.map((coach, index) => (
        <span key={`${coach.id}-${index}`}>
          {index > 0 && (
            <>
              <span aria-hidden> → </span>
              <span className="sr-only"> then </span>
            </>
          )}
          <span className="text-foreground">{coach.name}</span> ({coach.w}-
          {coach.l})
        </span>
      ))}
    </p>
  )
}

function RatingKey() {
  const description = `Stat colors, lowest to highest: ${RATING_BANDS.map(
    (band) => `${RATING_NAMES[band.rating]} ${band.percent}%`
  ).join(', ')}. Fewer turnovers rate higher.`

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

export default function RosterPane() {
  const teamId = useAppSelector(getSinglePinnedTeam)
  const season = useSeason()
  const teamRankings = getTeamRankings(season, teamId)
  const roster = teamRankings?.roster
  const coaches = teamRankings?.coaches

  if (!teamId || !roster?.length) return null

  return (
    <section aria-labelledby="roster-heading" className="mt-6">
      <h2 id="roster-heading" className="text-lg font-semibold">
        {getTeamName(teamId)} roster, {season.name}
      </h2>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        {coaches?.length ? <CoachLine coaches={coaches} /> : null}
        <RatingKey />
      </div>
      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">
              Player
            </TableHead>
            {STAT_COLUMNS.map((column) => (
              <TableHead
                key={column.label}
                title={column.title}
                className="text-right"
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((player) => (
            <TableRow key={player.id} className="group hover:bg-muted">
              <TableCell className="sticky left-0 bg-background font-medium transition-colors group-hover:bg-muted">
                <span className="flex items-center justify-between gap-3">
                  {player.name}
                  {(player.joinedFrom || player.leftFor) && (
                    <span className="flex gap-1">
                      {player.joinedFrom && (
                        <MoveMark joined team={player.joinedFrom} />
                      )}
                      {player.leftFor && (
                        <MoveMark joined={false} team={player.leftFor} />
                      )}
                    </span>
                  )}
                </span>
              </TableCell>
              {STAT_COLUMNS.map((column) => {
                const rating = column.rated
                  ? statRating(player, column.rated)
                  : undefined
                return (
                  <TableCell
                    key={column.label}
                    data-rating={rating}
                    className={cn(
                      'text-right tabular-nums',
                      rating && RATING_CLASSES[rating]
                    )}
                  >
                    {column.value(player)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
