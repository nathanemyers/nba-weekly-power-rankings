import { Teams, type Team } from 'types'
import { getTeamLogoUrl } from './teamLogos'

interface TeamLogoProps extends React.ComponentProps<'img'> {
  team: Team
}

export default function TeamLogo(props: TeamLogoProps) {
  const { team, ...rest } = props
  const name = Teams.find((t) => t.teamId === team)?.name
  return <img src={getTeamLogoUrl(team)} alt={`${name} logo`} {...rest} />
}
