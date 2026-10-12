import { useState } from "react";
import styled from "styled-components";
import { type Team, type TeamRankings } from "../types";
import { interpolate } from "./useChartTransition";
import TeamLabels, { PLAYOFF_MEDALS } from "./TeamLabels";

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
  margin: { top: number; right: number; bottom: number; left: number };
  pinnedTeams: Team[];
}

export default function RankingsChart(props: ChartProps) {
  const [hover, setHover] = useState<Hover | null>(null);

  const PLAYOFF_X =
    props.margin.left +
    (props.width - props.margin.left - props.margin.right) +
    60;
  const PLOT_W = props.width - props.margin.left - props.margin.right;
  const PLOT_H = props.height - props.margin.top - props.margin.bottom;

  const x = (week: number, start: number, span: number) =>
    props.margin.left + ((week - start) / span) * PLOT_W;
  const y = (rank: number) => props.margin.top + ((rank - 1) / 29) * PLOT_H;

  const rankingsByWeek = new Map(
    props.teams.map((team) => [
      team.teamId,
      new Map(team.rankings.map((r) => [r.week, r])),
    ]),
  );

  const weeks = Array.from(
    { length: Math.ceil(effectiveEnd) - Math.floor(effectiveStart) + 1 },
    (_, i) => Math.floor(effectiveStart) + i,
  ).filter((w) => w >= 1 && w <= props.maxWeek);
  const inWindow = (week: number) =>
    week >= effectiveStart && week <= effectiveEnd;
  const inRange = (week: number, rangeStart: number, rangeSpan: number) =>
    week >= rangeStart && week <= rangeStart + rangeSpan;

  const labelPositions = new Map<string, number>();
  for (const team of props.teams) {
    const fromFirst = team.rankings.find((r) =>
      inRange(r.week, transition.fromStart, transition.fromSpan),
    );
    const toFirst = team.rankings.find((r) =>
      inRange(r.week, transition.toStart, transition.toSpan),
    );
    const fromRank = fromFirst?.rank ?? toFirst?.rank;
    const toRank = toFirst?.rank ?? fromFirst?.rank;
    if (fromRank === undefined || toRank === undefined) continue;
    labelPositions.set(
      team.teamId,
      interpolate(y(fromRank), y(toRank), transition.progress),
    );
  }

  const activeSlug = pinned ?? hover?.teamId ?? null;
  const hoverTeam = hover && props.teams.find((t) => t.teamId === hover.teamId);
  const showTooltip =
    hoverTeam &&
    hover?.week !== undefined &&
    (pinned === null || pinned === hover.teamId);
  const tooltipRanking = showTooltip
    ? rankingsByWeek.get(hoverTeam.teamId)?.get(hover.week!)
    : undefined;

  const togglePin = (teamId: string) =>
    setPinned((p) => (p === teamId ? null : teamId));

  return (
    <ChartWrap onClick={() => setPinned(null)}>
      <Relative>
        <Svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Weekly NBA power rankings line chart"
          onMouseLeave={() => setHover(null)}
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
                className="grid"
                x1={props.margin.left}
                x2={props.margin.left + PLOT_W}
                y1={y(r)}
                y2={y(r)}
              />
              <text
                className="tick"
                x={props.margin.left + PLOT_W + 10}
                y={y(r)}
                dominantBaseline="middle"
              >
                {r}
              </text>
            </g>
          ))}

          {weeks.map((w) => (
            <text
              key={w}
              className="tick"
              x={x(w, effectiveStart, effectiveSpan)}
              y={props.margin.top + PLOT_H + 22}
              textAnchor="middle"
            >
              {w}
            </text>
          ))}
          <text
            className="axis-label"
            x={props.margin.left + PLOT_W / 2}
            y={props.height - 8}
            textAnchor="middle"
          >
            Week
          </text>
          <text
            className="axis-label"
            transform={`translate(${props.width - 14}, ${props.margin.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Rank
          </text>

          {inWindow(PLAYOFFS_WEEK) && (
            <g className="playoffs">
              <line
                x1={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan)}
                x2={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan)}
                y1={props.margin.top}
                y2={props.margin.top + PLOT_H}
              />
              <text
                x={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan) - 6}
                y={props.margin.top + 14}
                textAnchor="end"
              >
                Playoffs Begin
              </text>
            </g>
          )}

          <g clipPath="url(#plot-clip)">
            {props.teams.map((team) => {
              const active = activeSlug === team.teamId;
              const dim = activeSlug !== null && !active;
              // Start a new subpath after a missing week so the line doesn't bridge the gap
              const d = team.rankings
                .map((r, i) => {
                  const prev = team.rankings[i - 1];
                  const move = !prev || prev.week !== r.week - 1 ? "M" : "L";
                  return `${move}${x(r.week, effectiveStart, effectiveSpan)},${y(r.rank)}`;
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
                      togglePin(team.teamId);
                    }}
                  />
                  {active &&
                    team.rankings
                      .filter((r) => inWindow(r.week))
                      .map((r) => (
                        <circle
                          key={r.week}
                          cx={x(r.week, effectiveStart, effectiveSpan)}
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
            labelPositions={labelPositions}
            activeSlug={activeSlug}
            marginLeft={props.margin.left}
            onHover={(teamId) =>
              setHover((h) => ({
                teamId,
                week: h?.teamId === teamId ? h.week : undefined,
              }))
            }
            onClick={togglePin}
          />

          {(props.zoomedOut || start === maxStart) && (
            <g className="playoff-column">
              <text
                className="axis-label"
                x={PLAYOFF_X}
                y={props.margin.top - 8}
                textAnchor="middle"
              >
                Playoffs
              </text>
              {props.teams.map((team) => {
                const last = [...team.rankings]
                  .reverse()
                  .find((r) => inWindow(r.week));
                const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
                if (!last || !medal) return null;
                return (
                  <text
                    key={`${team.teamId}-playoff`}
                    className="playoff-medal"
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
        </Svg>

        {tooltipRanking && hoverTeam && (
          <Tooltip
            style={{
              left: `${(x(tooltipRanking.week, effectiveStart, effectiveSpan) / W) * 100}%`,
              top: `${(y(tooltipRanking.rank) / H) * 100}%`,
              transform:
                x(tooltipRanking.week, effectiveStart, effectiveSpan) > W * 0.6
                  ? "translate(calc(-100% - 14px), -50%)"
                  : "translate(14px, -50%)",
            }}
          >
            <strong>
              #{tooltipRanking.rank} {hoverTeam.name}
              {tooltipRanking.record && ` (${tooltipRanking.record})`}
            </strong>
            <p>{tooltipRanking.summary}</p>
            <small>Week {tooltipRanking.week}</small>
          </Tooltip>
        )}
      </Relative>
    </ChartWrap>
  );
}

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

  .grid {
    stroke: #333336;
    stroke-width: 1;
  }

  .tick {
    fill: #a1a1a6;
    font-size: 13px;
  }

  .axis-label {
    fill: #a1a1a6;
    font-size: 15px;
  }

  .playoffs line {
    stroke: #ff4d4f;
    stroke-width: 2;
    stroke-dasharray: 6 4;
  }

  .playoffs text {
    fill: #ff4d4f;
    font-size: 13px;
  }
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
