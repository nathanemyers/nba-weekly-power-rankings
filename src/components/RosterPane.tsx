import { LogIn, LogOut } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import {
  getPinnedTeamCoaches,
  getPinnedTeamRoster,
  getSinglePinnedTeam,
} from '@/store/slices/chart'
import { getSelectedSeason } from '@/store/slices/UI'
import {
  getTeamName,
  type CoachStint,
  type RosterEntry,
  type Team,
} from 'types'
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
  { label: 'PTS', title: 'Points per game', value: (p) => decimal(p.pts) },
  { label: 'REB', title: 'Rebounds per game', value: (p) => decimal(p.trb) },
  { label: 'AST', title: 'Assists per game', value: (p) => decimal(p.ast) },
  { label: 'STL', title: 'Steals per game', value: (p) => decimal(p.stl) },
  { label: 'TOV', title: 'Turnovers per game', value: (p) => decimal(p.tov) },
  {
    label: 'PER',
    title: 'Player Efficiency Rating',
    value: (p) => decimal(p.per),
  },
]

function MoveMark(props: { joined: boolean; team: Team }) {
  const description = props.joined
    ? `Joined from ${getTeamName(props.team)} mid-season`
    : `Left for ${getTeamName(props.team)} mid-season`
  const Icon = props.joined ? LogIn : LogOut

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          tabIndex={0}
          aria-label={description}
          className="inline-flex text-muted-foreground"
        >
          <Icon aria-hidden className="size-3.5" />
        </span>
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

export default function RosterPane() {
  const teamId = useAppSelector(getSinglePinnedTeam)
  const season = useAppSelector(getSelectedSeason)
  const roster = useAppSelector(getPinnedTeamRoster)
  const coaches = useAppSelector(getPinnedTeamCoaches)

  if (!teamId || !roster?.length) return null

  return (
    <section aria-labelledby="roster-heading" className="mt-6">
      <h2 id="roster-heading" className="text-lg font-semibold">
        {getTeamName(teamId)} roster, {season.name}
      </h2>
      {coaches?.length ? <CoachLine coaches={coaches} /> : null}
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
              <TableCell className="sticky left-0 bg-background font-medium group-hover:bg-muted">
                <span className="inline-flex items-center gap-1.5">
                  {player.name}
                  {player.joinedFrom && (
                    <MoveMark joined team={player.joinedFrom} />
                  )}
                  {player.leftFor && (
                    <MoveMark joined={false} team={player.leftFor} />
                  )}
                </span>
              </TableCell>
              {STAT_COLUMNS.map((column) => (
                <TableCell
                  key={column.label}
                  className="text-right tabular-nums"
                >
                  {column.value(player)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
