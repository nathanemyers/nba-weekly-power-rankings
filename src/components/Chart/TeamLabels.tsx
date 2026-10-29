import type { Margin, Team, TeamRankings } from 'types'
import { interpolate, type ChartTransitionState } from './useChartTransition'
import { firstRankingInRange, getYforRank, PLAYOFF_MEDALS } from './utils'
import { getTeamLogoUrl } from 'components/teamLogos'

const LOGO_SIZE = 22

interface TeamLabelsProps {
  teams: TeamRankings[]
  transition: ChartTransitionState
  activeTeams: Team[]
  margin: Margin
  height: number
  compact: boolean
  onHover: (teamId: Team) => void
  onClick: (teamId: Team) => void
}

export default function TeamLabels(props: TeamLabelsProps) {
  const { transition } = props

  // Labels glide between the first-visible-week rank of the old and new ranges
  const labelY = (team: TeamRankings) => {
    const from = firstRankingInRange(
      team.rankings,
      transition.fromStart,
      transition.fromStart + transition.fromSpan
    )
    const to = firstRankingInRange(
      team.rankings,
      transition.toStart,
      transition.toStart + transition.toSpan
    )
    const fromRank = from?.rank ?? to?.rank
    const toRank = to?.rank ?? from?.rank
    if (fromRank === undefined || toRank === undefined) return undefined
    return interpolate(
      getYforRank(fromRank, props.height, props.margin),
      getYforRank(toRank, props.height, props.margin),
      transition.progress
    )
  }

  const anyActive = props.activeTeams.length > 0

  const teamNames = props.teams.map((team) => {
    const y = labelY(team)
    if (y === undefined) return null
    const active = props.activeTeams.includes(team.teamId)
    if (props.compact) {
      return (
        <image
          key={team.teamId}
          className="cursor-pointer transition-opacity duration-150"
          href={getTeamLogoUrl(team.teamId)}
          x={props.margin.left - 6 - LOGO_SIZE}
          y={y - LOGO_SIZE / 2}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          opacity={anyActive && !active ? 0.35 : 1}
          onMouseEnter={() => props.onHover(team.teamId)}
          onClick={(e) => {
            e.stopPropagation()
            props.onClick(team.teamId)
          }}
        >
          <title>{team.name}</title>
        </image>
      )
    }
    return (
      <text
        key={team.teamId}
        className="cursor-pointer text-[13px] transition-[fill,font-weight] duration-150 data-[state=active]:fill-foreground data-[state=dimmed]:fill-dim data-[state=idle]:fill-foreground-soft"
        data-state={active ? 'active' : anyActive ? 'dimmed' : 'idle'}
        x={props.margin.left - 10}
        y={y}
        textAnchor="end"
        dominantBaseline="middle"
        fontWeight={active ? 700 : 400}
        onMouseEnter={() => props.onHover(team.teamId)}
        onClick={(e) => {
          e.stopPropagation()
          props.onClick(team.teamId)
        }}
      >
        {team.name}
      </text>
    )
  })

  const playoffMedals = props.teams.map((team) => {
    if (props.compact) return null
    const y = labelY(team)
    const medal = team.playoff && PLAYOFF_MEDALS[team.playoff]
    if (y === undefined || !medal) return null
    return (
      <text
        key={`${team.teamId}-medal`}
        x={4}
        y={y}
        fontSize={14}
        dominantBaseline="middle"
      >
        <title>{medal.label}</title>
        {medal.icon}
      </text>
    )
  })

  return (
    <>
      <g className="team-labels">{teamNames}</g>
      <g className="team-medals">{playoffMedals}</g>
    </>
  )
}
