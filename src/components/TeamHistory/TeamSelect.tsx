import { useNavigate } from 'react-router'
import { getTeamName, Teams, type Team } from 'types'
import TeamLogo from '../TeamLogo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

const SORTED_TEAMS = Teams.toSorted((a, b) => a.name.localeCompare(b.name))

export default function TeamSelect(props: { team: Team }) {
  const navigate = useNavigate()

  return (
    <Select
      value={props.team}
      onValueChange={(value) => navigate('/teamHistory/' + value)}
    >
      <SelectTrigger
        aria-label="Team"
        className="w-full cursor-pointer text-base sm:w-60"
      >
        <SelectValue>{getTeamName(props.team)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {SORTED_TEAMS.map((team) => (
          <SelectItem
            key={team.teamId}
            value={team.teamId}
            className="h-9 cursor-pointer text-base"
          >
            <TeamLogo
              team={team.teamId}
              alt=""
              className="size-6 object-contain"
            />
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
