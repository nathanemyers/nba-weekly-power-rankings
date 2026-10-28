import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getSinglePinnedTeam, setPinnedTeams } from '@/store/slices/chart'
import { getTeamRankings } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import { getTeamName, type CoachStint, type Team } from 'types'
import { StatCells, StatHeads } from 'components/PlayerStats/statColumns'
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
import RatingKey from 'components/PlayerStats/RatingKey'

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
            <StatHeads />
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((player) => (
            <TableRow key={player.id} className="group hover:bg-muted">
              <TableCell className="sticky left-0 bg-background font-medium transition-colors group-hover:bg-muted">
                <span className="flex items-center justify-between gap-3">
                  <Link
                    to={'/playerHistory/' + player.id}
                    className="cursor-pointer hover:underline"
                  >
                    {player.name}
                  </Link>
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
              <StatCells player={player} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
