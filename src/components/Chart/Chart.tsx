import { useState } from 'react'
import { cn } from 'cn'
import { type Margin, type Team, type TeamRankings } from 'types'
import TeamLabels from './TeamLabels'
import { useChartTransition } from './useChartTransition'
import { getYforRank, PLAYOFF_MEDALS } from './utils'
import { findLast, max, range, sortBy } from 'lodash'

const PLAYOFFS_WEEK = 24

// Room around the plot so dots on rank 1 and rank 30 aren't clipped
const CLIP_PAD = 12

// Playoff column sits between the rank numbers and the "Rank" axis label
const RANK_TICKS = [1, 5, 10, 15, 20, 25, 30]

type Hover = { teamId: Team; week?: number }

interface ChartProps {
  teams: TeamRankings[]
  startWeek: number
  endWeek: number
  width: number
  height: number
  margin: Margin
  pinnedTeams: Team[]
  compact: boolean
  onClick: (team?: Team) => void
}

export default function RankingsChart(props: ChartProps) {
  const [hover, setHover] = useState<Hover | undefined>()

  const targetSpan = Math.max(1, props.endWeek - props.startWeek)
  // The span only changes when the zoom mode does, which should close any open tooltip
  const [prevSpan, setPrevSpan] = useState(targetSpan)
  if (prevSpan !== targetSpan) {
    setPrevSpan(targetSpan)
    setHover(undefined)
  }

  const transition = useChartTransition({
    start: props.startWeek,
    span: targetSpan,
  })
  const start = transition.start
  const span = transition.span
  const end = start + span

  const activeTeams =
    props.pinnedTeams.length > 0
      ? props.pinnedTeams
      : hover
        ? [hover.teamId]
        : []
  const hoveredTeam = props.teams.find((t) => t.teamId === hover?.teamId)
  const hoveredTooltip =
    hover?.week !== undefined && activeTeams.includes(hover.teamId)
      ? hoveredTeam?.rankings.find((r) => r.week === hover.week)
      : undefined

  const lastWeek =
    max(props.teams.flatMap((t) => t.rankings.map((r) => r.week))) ??
    props.endWeek

  const PLAYOFF_X =
    props.margin.left +
    (props.width - props.margin.left - props.margin.right) +
    (props.compact ? 44 : 60)
  const PLOT_W = props.width - props.margin.left - props.margin.right
  const PLOT_H = props.height - props.margin.top - props.margin.bottom

  const x = (week: number) =>
    props.margin.left + ((week - start) / span) * PLOT_W
  const y = (rank: number) => getYforRank(rank, props.height, props.margin)

  // Anchoring on the far edge keeps the full width available near the right side
  const tipX = hoveredTooltip ? x(hoveredTooltip.week) / props.width : 0
  const tipY = hoveredTooltip ? y(hoveredTooltip.rank) / props.height : 0
  // Narrow charts have no room beside the dot, so the tooltip spans the width above or below it
  const tipPosition = props.compact
    ? {
        left: '2%',
        right: '2%',
        transform: tipY > 0.5 ? 'translateY(calc(-100% - 14px))' : 'translateY(14px)',
      }
    : tipX > 0.5
      ? { right: `${(1 - tipX) * 100}%`, transform: 'translate(-14px, -50%)' }
      : { left: `${tipX * 100}%`, transform: 'translate(14px, -50%)' }

  // Narrow charts label every fifth week once the window is too wide for every tick
  const tickEvery = props.compact && span > 12 ? 5 : 1
  const weeks = range(Math.floor(start), Math.ceil(end) + 1).filter(
    (w) => w >= 1 && w <= lastWeek && (w === 1 || w % tickEvery === 0)
  )

  const inWindow = (week: number) => week >= start && week <= end
  const inTargetWindow = (week: number) =>
    week >= props.startWeek && week <= props.endWeek

  return (
    <div
      className="w-full"
      style={{ maxWidth: props.width }}
      onClick={() => props.onClick(undefined)}
    >
      <div className="relative">
        <svg
          className="block h-auto w-full select-none"
          viewBox={`0 0 ${props.width} ${props.height}`}
          role="img"
          aria-label="Weekly NBA power rankings line chart"
          onMouseLeave={() => setHover(undefined)}
        >
          <defs>
            <clipPath id="plot-clip">
              <rect
                x={props.margin.left - CLIP_PAD}
                y={props.margin.top - CLIP_PAD}
                width={PLOT_W + CLIP_PAD * 2}
                height={PLOT_H + CLIP_PAD * 2}
              />
            </clipPath>
          </defs>

          {RANK_TICKS.map((r) => (
            <g key={r}>
              <line
                className="stroke-chart-grid stroke-1"
                x1={props.margin.left}
                x2={props.margin.left + PLOT_W}
                y1={y(r)}
                y2={y(r)}
              />
              <text
                className="fill-muted-foreground text-[13px]"
                x={props.margin.left + PLOT_W + 10}
                y={y(r)}
                dominantBaseline="middle"
              >
                {r}
              </text>
            </g>
          ))}

          <g className="week-ticks">
            {weeks.map((w) => (
              <text
                className="fill-muted-foreground text-[13px]"
                key={w}
                x={x(w)}
                y={props.margin.top + PLOT_H + 22}
                textAnchor="middle"
              >
                {w}
              </text>
            ))}
          </g>
          <text
            className="fill-muted-foreground text-[15px]"
            x={props.margin.left + PLOT_W / 2}
            y={props.height - 8}
            textAnchor="middle"
          >
            Week
          </text>
          {!props.compact && (
            <text
              className="fill-muted-foreground text-[15px]"
              transform={`translate(${props.width - 14}, ${props.margin.top + PLOT_H / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Rank
            </text>
          )}

          {inWindow(PLAYOFFS_WEEK) && (
            <g>
              <line
                className="stroke-chart-playoffs stroke-2 [stroke-dasharray:6_4]"
                x1={x(PLAYOFFS_WEEK)}
                x2={x(PLAYOFFS_WEEK)}
                y1={props.margin.top}
                y2={props.margin.top + PLOT_H}
              />
              {!props.compact && (
                <text
                  className="fill-chart-playoffs text-[13px]"
                  x={x(PLAYOFFS_WEEK) - 6}
                  y={props.margin.top + 14}
                  textAnchor="end"
                >
                  Playoffs Begin
                </text>
              )}
            </g>
          )}

          <g clipPath="url(#plot-clip)">
            {/* Pinned teams draw last so their line and dots sit above every other line */}
            {sortBy(props.teams, (team) =>
              props.pinnedTeams.includes(team.teamId)
            ).map((team) => {
              const active = activeTeams.includes(team.teamId)
              const dim = activeTeams.length > 0 && !active
              // Start a new subpath after a missing week so the line doesn't bridge the gap
              const d = team.rankings
                .map((r, i) => {
                  const prev = team.rankings[i - 1]
                  const move = !prev || prev.week !== r.week - 1 ? 'M' : 'L'
                  return `${move}${x(r.week)},${y(r.rank)}`
                })
                .join(' ')

              return (
                <g key={team.teamId}>
                  <path
                    d={d}
                    fill="none"
                    stroke={team.color}
                    strokeWidth={active ? 3 : 1.5}
                    opacity={dim ? 0.25 : 1}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHover((h) => ({
                        teamId: team.teamId,
                        week: h?.teamId === team.teamId ? h.week : undefined,
                      }))
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      props.onClick(team.teamId)
                    }}
                  />
                  {active &&
                    team.rankings
                      .filter((r) => inWindow(r.week))
                      .map((r) => (
                        <circle
                          key={r.week}
                          cx={x(r.week)}
                          cy={y(r.rank)}
                          r={5}
                          fill={team.color}
                          strokeWidth={1.5}
                          className="cursor-pointer stroke-background"
                          onMouseEnter={() =>
                            setHover({ teamId: team.teamId, week: r.week })
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            setHover({ teamId: team.teamId, week: r.week })
                          }}
                        />
                      ))}
                </g>
              )
            })}
          </g>

          <TeamLabels
            teams={props.teams}
            margin={props.margin}
            onHover={(teamId) =>
              setHover((h) => ({
                teamId,
                week: h?.teamId === teamId ? h?.week : undefined,
              }))
            }
            onClick={(teamId) => props.onClick(teamId)}
            transition={transition}
            activeTeams={activeTeams}
            height={props.height}
            compact={props.compact}
          />

          {props.endWeek >= lastWeek && (
            <g className="playoff-column">
              {!props.compact && (
                <text
                  className="fill-muted-foreground text-[15px]"
                  x={PLAYOFF_X}
                  y={props.margin.top - 8}
                  textAnchor="middle"
                >
                  Playoffs
                </text>
              )}
              {props.teams.map((team) => {
                const last = findLast(team.rankings, (r) =>
                  inTargetWindow(r.week)
                )
                const medal = team.playoff && PLAYOFF_MEDALS[team.playoff]
                if (!last || !medal) return null
                return (
                  <text
                    key={team.teamId}
                    x={PLAYOFF_X}
                    y={y(last.rank)}
                    fontSize={14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <title>{medal.label}</title>
                    {medal.icon}
                  </text>
                )
              })}
            </g>
          )}
        </svg>

        {hoveredTooltip && (
          <div
            className={cn(
              'pointer-events-none absolute rounded-md bg-popover/85 px-3 py-2.5 text-[0.9rem] leading-snug text-popover-foreground',
              !props.compact && 'w-max max-w-[min(20rem,calc(50%-14px))]'
            )}
            style={{
              ...tipPosition,
              top: `${tipY * 100}%`,
            }}
          >
            <strong>
              #{hoveredTooltip.rank} {hoveredTeam?.name}
              {hoveredTooltip.record && ` (${hoveredTooltip.record})`}
            </strong>
            <p className="my-1">{hoveredTooltip.summary}</p>
            <small className="text-muted-foreground">
              Week {hoveredTooltip.week}
            </small>
          </div>
        )}
      </div>
    </div>
  )
}
