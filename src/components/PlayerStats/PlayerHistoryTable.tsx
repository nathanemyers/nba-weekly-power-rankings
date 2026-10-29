import { useNavigate } from 'react-router'
import { useAppDispatch } from '@/store/hooks'
import { setPinnedTeams } from '@/store/slices/chart'
import type { PlayerStint } from '@/data/playerHistory'
import { getTeamName } from 'types'
import AwardBadges from './AwardBadges'
import { PLAYOFF_MEDALS } from 'components/Chart/utils'
import { StatCells, StatHeads } from './statColumns'
import TeamLogo from 'components/TeamLogo'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'

export default function PlayerHistoryTable(props: {
  playerHistory: PlayerStint[]
}) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const open = (stint: PlayerStint) => {
    dispatch(setPinnedTeams([stint.team]))
    navigate('/' + stint.season)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 w-20 min-w-20 bg-background">
            Season
          </TableHead>
          <TableHead className="sticky left-20 bg-background">Team</TableHead>
          <TableHead
            title="Best playoff finish with this team"
            className="text-center"
          >
            Playoffs
          </TableHead>
          <StatHeads />
          <TableHead>Awards</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.playerHistory.map((stint) => (
          <TableRow
            key={stint.season + stint.team}
            tabIndex={0}
            aria-label={`${getTeamName(stint.team)} ${stint.season} season`}
            className="group cursor-pointer hover:bg-muted"
            onClick={() => open(stint)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') open(stint)
            }}
          >
            <TableCell className="sticky left-0 w-20 min-w-20 bg-background font-medium transition-colors group-hover:bg-muted">
              {stint.season}
            </TableCell>
            <TableCell className="sticky left-20 bg-background transition-colors group-hover:bg-muted">
              <span className="flex w-max items-center gap-2">
                <TeamLogo
                  team={stint.team}
                  alt=""
                  className="size-5 object-contain"
                />
                <span className="sr-only sm:not-sr-only">
                  {getTeamName(stint.team)}
                </span>
              </span>
            </TableCell>
            <TableCell className="text-center">
              {stint.playoff && (
                <span
                  role="img"
                  aria-label={PLAYOFF_MEDALS[stint.playoff].label}
                  title={PLAYOFF_MEDALS[stint.playoff].label}
                >
                  {PLAYOFF_MEDALS[stint.playoff].icon}
                </span>
              )}
            </TableCell>
            <StatCells player={stint.player} />
            <TableCell>
              <AwardBadges codes={stint.player.awards} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
