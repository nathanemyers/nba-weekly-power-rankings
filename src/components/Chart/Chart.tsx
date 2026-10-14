import { useState } from "react";
import { type Margin, type Team, type TeamRankings } from "types";
import TeamLabels from "./TeamLabels";
import { useChartTransition } from "./useChartTransition";
import { getYforRank, PLAYOFF_MEDALS } from "./utils";
import { findLast, max, range } from "lodash";

export const DEFAULT_WINDOW_WEEKS = 10;
const PLAYOFFS_WEEK = 24;

// Room around the plot so dots on rank 1 and rank 30 aren't clipped
const CLIP_PAD = 12;

// Playoff column sits between the rank numbers and the "Rank" axis label
const RANK_TICKS = [1, 5, 10, 15, 20, 25, 30];

type Hover = { teamId: Team; week?: number };

interface ChartProps {
  teams: TeamRankings[];
  startWeek: number;
  endWeek: number;
  width: number;
  height: number;
  margin: Margin;
  pinnedTeams: Team[];
  onClick: (team?: Team) => void;
}

export default function RankingsChart(props: ChartProps) {
  const [hover, setHover] = useState<Hover | undefined>();

  const targetSpan = Math.max(1, props.endWeek - props.startWeek);
  // The span only changes when the zoom mode does, which should close any open tooltip
  const [prevSpan, setPrevSpan] = useState(targetSpan);
  if (prevSpan !== targetSpan) {
    setPrevSpan(targetSpan);
    setHover(undefined);
  }

  const transition = useChartTransition({
    start: props.startWeek,
    span: targetSpan,
  });
  const start = transition.start;
  const span = transition.span;
  const end = start + span;

  const activeTeams =
    props.pinnedTeams.length > 0
      ? props.pinnedTeams
      : hover
        ? [hover.teamId]
        : [];
  const hoveredTeam = props.teams.find((t) => t.teamId === hover?.teamId);
  const hoveredTooltip =
    hover?.week !== undefined && activeTeams.includes(hover.teamId)
      ? hoveredTeam?.rankings.find((r) => r.week === hover.week)
      : undefined;

  const lastWeek =
    max(props.teams.flatMap((t) => t.rankings.map((r) => r.week))) ??
    props.endWeek;

  const PLAYOFF_X =
    props.margin.left +
    (props.width - props.margin.left - props.margin.right) +
    60;
  const PLOT_W = props.width - props.margin.left - props.margin.right;
  const PLOT_H = props.height - props.margin.top - props.margin.bottom;

  const x = (week: number) =>
    props.margin.left + ((week - start) / span) * PLOT_W;
  const y = (rank: number) => getYforRank(rank, props.height, props.margin);

  const weeks = range(Math.floor(start), Math.ceil(end) + 1).filter(
    (w) => w >= 1 && w <= lastWeek,
  );

  const inWindow = (week: number) => week >= start && week <= end;
  const inTargetWindow = (week: number) =>
    week >= props.startWeek && week <= props.endWeek;

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
          <text
            className="fill-muted-foreground text-[15px]"
            transform={`translate(${props.width - 14}, ${props.margin.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Rank
          </text>

          {inWindow(PLAYOFFS_WEEK) && (
            <g>
              <line
                className="stroke-chart-playoffs stroke-2 [stroke-dasharray:6_4]"
                x1={x(PLAYOFFS_WEEK)}
                x2={x(PLAYOFFS_WEEK)}
                y1={props.margin.top}
                y2={props.margin.top + PLOT_H}
              />
              <text
                className="fill-chart-playoffs text-[13px]"
                x={x(PLAYOFFS_WEEK) - 6}
                y={props.margin.top + 14}
                textAnchor="end"
              >
                Playoffs Begin
              </text>
            </g>
          )}

          <g clipPath="url(#plot-clip)">
            {props.teams.map((team) => {
              const active = activeTeams.includes(team.teamId);
              const dim = activeTeams.length > 0 && !active;
              // Start a new subpath after a missing week so the line doesn't bridge the gap
              const d = team.rankings
                .map((r, i) => {
                  const prev = team.rankings[i - 1];
                  const move = !prev || prev.week !== r.week - 1 ? "M" : "L";
                  return `${move}${x(r.week)},${y(r.rank)}`;
                })
                .join(" ");

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
                      e.stopPropagation();
                      props.onClick(team.teamId);
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
                        />
                      ))}
                </g>
              );
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
          />

          {props.endWeek >= lastWeek && (
            <g className="playoff-column">
              <text
                className="fill-muted-foreground text-[15px]"
                x={PLAYOFF_X}
                y={props.margin.top - 8}
                textAnchor="middle"
              >
                Playoffs
              </text>
              {props.teams.map((team) => {
                const last = findLast(team.rankings, (r) =>
                  inTargetWindow(r.week),
                );
                const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
                if (!last || !medal) return null;
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
                );
              })}
            </g>
          )}
        </svg>

        {hoveredTooltip && (
          <div
            className="pointer-events-none absolute max-w-80 rounded-md bg-popover/85 px-3 py-2.5 text-[0.9rem] leading-snug text-popover-foreground"
            style={{
              left: `${(x(hoveredTooltip.week) / props.width) * 100}%`,
              top: `${(y(hoveredTooltip.rank) / props.height) * 100}%`,
              transform:
                x(hoveredTooltip.week) > props.width * 0.6
                  ? "translate(calc(-100% - 14px), -50%)"
                  : "translate(14px, -50%)",
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
  );
}
