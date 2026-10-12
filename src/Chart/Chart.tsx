import { useState } from "react";
import styled from "styled-components";
import { type Margin, type Team, type TeamRankings } from "../types";
import TeamLabels from "./TeamLabels";
import { getYforRank } from "./utils";
import { range } from "lodash";

export const DEFAULT_WINDOW_WEEKS = 10;
const PLAYOFFS_WEEK = 24;

// Room around the plot so dots on rank 1 and rank 30 aren't clipped
const CLIP_PAD = 12;

// Playoff column sits between the rank numbers and the "Rank" axis label
const RANK_TICKS = [1, 5, 10, 15, 20, 25, 30];

type Hover = { teamId: Team; week?: number };

const ChartWrap = styled.div`
  width: 100%;
`;

const Relative = styled.div`
  position: relative;
`;

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
`;

const Playoffs = styled.g`
  line {
    stroke: #ff4d4f;
    stroke-width: 2;
    stroke-dasharray: 6 4;
  }

  text {
    fill: #ff4d4f;
    font-size: 13px;
  }
`;

const GridLine = styled.line`
  stroke: #333336;
  stroke-width: 1;
`;

const Tick = styled.text`
  fill: #a1a1a6;
  font-size: 13px;
`;

const AxisLabel = styled.text`
  fill: #a1a1a6;
  font-size: 15px;
`;

const Tooltip = styled.div`
  position: absolute;
  pointer-events: none;
  max-width: 320px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.35;

  p {
    margin: 4px 0;
  }

  small {
    color: #a1a1a6;
  }
`;
interface ChartProps {
  teams: TeamRankings[];
  startWeek: number;
  endWeek: number;
  width: number;
  height: number;
  margin: Margin;
  pinnedTeams: Team[];
  onClick: (team?: Team) => {};
}

export default function RankingsChart(props: ChartProps) {
  const [hover, setHover] = useState<Hover | undefined>();
  const hoveredTeam = props.teams.find((t) => t.teamId === hover?.teamId);
  const hoveredTooltip = hover?.week
    ? hoveredTeam?.rankings.find((r) => r.week === hover.week)
    : undefined;

  const span = props.endWeek - props.startWeek;

  const PLAYOFF_X =
    props.margin.left +
    (props.width - props.margin.left - props.margin.right) +
    60;
  const PLOT_W = props.width - props.margin.left - props.margin.right;
  const PLOT_H = props.height - props.margin.top - props.margin.bottom;

  const x = (week: number, start: number) =>
    props.margin.left + ((week - start) / span) * PLOT_W;
  const y = (rank: number) => getYforRank(rank, props.height, props.margin);

  const weeks = range(props.startWeek, props.endWeek);

  const inWindow = (week: number) =>
    week >= props.startWeek && week <= props.endWeek;

  return (
    <ChartWrap onClick={() => props.onClick(undefined)}>
      <Relative>
        <Svg
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
              <GridLine
                x1={props.margin.left}
                x2={props.margin.left + PLOT_W}
                y1={y(r)}
                y2={y(r)}
              />
              <Tick
                x={props.margin.left + PLOT_W + 10}
                y={y(r)}
                dominantBaseline="middle"
              >
                {r}
              </Tick>
            </g>
          ))}

          {weeks.map((w) => (
            <Tick
              key={w}
              x={x(w, props.startWeek)}
              y={props.margin.top + PLOT_H + 22}
              textAnchor="middle"
            >
              {w}
            </Tick>
          ))}
          <AxisLabel
            x={props.margin.left + PLOT_W / 2}
            y={props.height - 8}
            textAnchor="middle"
          >
            Week
          </AxisLabel>
          <AxisLabel
            transform={`translate(${props.width - 14}, ${props.margin.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Rank
          </AxisLabel>

          {inWindow(PLAYOFFS_WEEK) && (
            <Playoffs>
              <line
                x1={x(PLAYOFFS_WEEK, props.startWeek)}
                x2={x(PLAYOFFS_WEEK, props.startWeek)}
                y1={props.margin.top}
                y2={props.margin.top + PLOT_H}
              />
              <text
                x={x(PLAYOFFS_WEEK, props.startWeek) - 6}
                y={props.margin.top + 14}
                textAnchor="end"
              >
                Playoffs Begin
              </text>
            </Playoffs>
          )}

          <g clipPath="url(#plot-clip)">
            {props.teams.map((team) => {
              const active = props.pinnedTeams.includes(team.teamId);
              const dim = props.pinnedTeams.length > 0 && !active;
              // Start a new subpath after a missing week so the line doesn't bridge the gap
              const d = team.rankings
                .map((r, i) => {
                  const prev = team.rankings[i - 1];
                  const move = !prev || prev.week !== r.week - 1 ? "M" : "L";
                  return `${move}${x(r.week, props.startWeek)},${y(r.rank)}`;
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
                    style={{ cursor: "pointer" }}
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
                          cx={x(r.week, props.startWeek)}
                          cy={y(r.rank)}
                          r={5}
                          fill={team.color}
                          stroke="#1d1d1f"
                          strokeWidth={1.5}
                          style={{ cursor: "pointer" }}
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
                week: h?.teamId === teamId ? h.week : undefined,
              }))
            }
            onClick={(teamId) => props.onClick(teamId)}
            week={props.startWeek}
            pinnedTeams={[]}
            height={props.height}
          />

          <g className="playoff-column">
            <AxisLabel
              x={PLAYOFF_X}
              y={props.margin.top - 8}
              textAnchor="middle"
            >
              Playoffs
            </AxisLabel>
          </g>
        </Svg>

        {hoveredTooltip && (
          <Tooltip
            style={{
              left: `${(x(hoveredTooltip.week, props.startWeek) / props.width) * 100}%`,
              top: `${(y(hoveredTooltip.rank) / props.height) * 100}%`,
              transform:
                x(hoveredTooltip.week, props.startWeek) > props.width * 0.6
                  ? "translate(calc(-100% - 14px), -50%)"
                  : "translate(14px, -50%)",
            }}
          >
            <strong>
              #{hoveredTooltip.rank} {hover?.teamId}
              {hoveredTooltip.record && ` (${hoveredTooltip.record})`}
            </strong>
            <p>{hoveredTooltip.summary}</p>
            <small>Week {hoveredTooltip.week}</small>
          </Tooltip>
        )}
      </Relative>
    </ChartWrap>
  );
}
