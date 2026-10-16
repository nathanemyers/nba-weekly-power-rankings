import {
  westernConferenceTeams,
  easternConferenceTeams,
  southwestDivisionTeams,
  pacificDivisionTeams,
  northwestDivisionTeams,
  southeastDivisionTeams,
  centralDivisionTeams,
  atlanticDivisionTeams,
  Team,
  getTeamName,
} from 'types'
import { xor } from 'lodash'

import { Button } from '@/components/ui/button'
import { getPinnedTeams, setPinnedTeams } from 'store/slices/chart'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
import TeamLogo from './TeamLogo'

function getPinGroup(pinnedTeams: Team[]) {
  if (pinnedTeams.length === 0) return 'All'
  if (pinnedTeams.length === 1) return getTeamName(pinnedTeams[0])
  if (xor(pinnedTeams, westernConferenceTeams).length === 0)
    return 'Western Conference'
  if (xor(pinnedTeams, easternConferenceTeams).length === 0)
    return 'Eastern Conference'
  if (xor(pinnedTeams, southwestDivisionTeams).length === 0)
    return 'Southwest Division'
  if (xor(pinnedTeams, pacificDivisionTeams).length === 0)
    return 'Pacific Division'
  if (xor(pinnedTeams, northwestDivisionTeams).length === 0)
    return 'Northwest Division'
  if (xor(pinnedTeams, southeastDivisionTeams).length === 0)
    return 'Southeast Division'
  if (xor(pinnedTeams, centralDivisionTeams).length === 0)
    return 'Central Division'
  if (xor(pinnedTeams, atlanticDivisionTeams).length === 0)
    return 'Atlantic Division'
  return 'Custom'
}

export default function ChartFilter() {
  const dispatch = useAppDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)

  const pinGroup = getPinGroup(pinnedTeams)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-60 justify-end">
          {pinnedTeams.length === 1 ? (
            <div className="flex w-full items-center justify-between">
              <TeamLogo team={pinnedTeams[0]} className="h-6 mr-2" />
              {pinGroup}
            </div>
          ) : (
            pinGroup
          )}
          <FontAwesomeIcon icon={faFilter} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="font-bold justify-end"
          onSelect={() => dispatch(setPinnedTeams(westernConferenceTeams))}
        >
          Western Conference
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(southwestDivisionTeams))}
        >
          Southwest Division
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(pacificDivisionTeams))}
        >
          Pacific Division
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(northwestDivisionTeams))}
        >
          Northwest Division
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="font-bold justify-end"
          onSelect={() => dispatch(setPinnedTeams(easternConferenceTeams))}
        >
          Eastern Conference
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(southeastDivisionTeams))}
        >
          Southeast Division
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(centralDivisionTeams))}
        >
          Central Division
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-end"
          onSelect={() => dispatch(setPinnedTeams(atlanticDivisionTeams))}
        >
          Atlantic Division
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
