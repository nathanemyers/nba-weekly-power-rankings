import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { type Team } from "./teams";
import type { PlayoffStage, WeekRanking } from "./types";

export type TeamRankings = Team & {
  rankings: WeekRanking[];
  playoff?: PlayoffStage;
};

const PLAYOFF_MEDALS: Record<PlayoffStage, { icon: string; label: string }> = {
  "first-round": { icon: "🥉", label: "Lost in the first round" },
  semis: { icon: "🥈", label: "Lost in the second round" },
  "conf-finals": { icon: "🥇", label: "Lost in the conference finals" },
  finals: { icon: "🏆", label: "Runner-up in the Finals" },
  champion: { icon: "👑", label: "NBA champion" },
};

export const DEFAULT_WINDOW_WEEKS = 10;
const PLAYOFFS_WEEK = 24;

const W = 960;
const H = 600;
const M = { top: 30, right: 120, bottom: 60, left: 190 };
// Room around the plot so dots on rank 1 and rank 30 aren't clipped
const CLIP_PAD = 12;
// Playoff column sits between the rank numbers and the "Rank" axis label
const PLAYOFF_X = M.left + (W - M.left - M.right) + 60;
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const x = (week: number, start: number, span: number) =>
  M.left + ((week - start) / span) * PLOT_W;
const y = (rank: number) => M.top + ((rank - 1) / 29) * PLOT_H;

const RANK_TICKS = [1, 5, 10, 15, 20, 25, 30];

type Hover = { slug: string; week?: number };

export default function RankingsChart({
  teams,
  maxWeek,
  zoomedOut,
  onToggleZoom,
  windowWeeks = DEFAULT_WINDOW_WEEKS,
}: {
  teams: TeamRankings[];
  maxWeek: number;
  zoomedOut: boolean;
  onToggleZoom: () => void;
  windowWeeks?: number;
}) {
  const [start, setStart] = useState(1);
  const [pinned, setPinned] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  // Tracks the zoomedOut value as of the last render so we can clear a stale tooltip the
  // moment it changes, without a setState-in-effect cascading render (React's "adjusting state
  // when a prop changes during render" pattern).
  const [prevZoomedOut, setPrevZoomedOut] = useState(zoomedOut);
  if (prevZoomedOut !== zoomedOut) {
    setPrevZoomedOut(zoomedOut);
    setHover(null);
  }

  // Recomputed from props every render so it reflects a season's current week count live
  // (e.g. a future in-progress season growing week over week), never cached.
  const canZoomOut = maxWeek > windowWeeks;

  const maxStart = Math.max(1, maxWeek - windowWeeks);

  // Lookup of slug -> week -> ranking. Weeks can be missing for a team, so don't index by position
  const rankingsByWeek = useMemo(
    () =>
      new Map(
        teams.map((team) => [
          team.slug,
          new Map(team.rankings.map((r) => [r.week, r])),
        ]),
      ),
    [teams],
  );

  useEffect(() => {
    if (zoomedOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setStart((s) => Math.max(1, s - 1));
      if (e.key === "ArrowRight")
        setStart((s) => Math.min(maxStart, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxStart, zoomedOut]);

  // `start` itself is never mutated by zooming — only its effective value at render time —
  // so zooming back in restores exactly the windowed position the visitor left.
  const effectiveStart = zoomedOut ? 1 : start;
  const effectiveSpan = zoomedOut ? Math.max(1, maxWeek - 1) : windowWeeks;
  const effectiveEnd = zoomedOut ? maxWeek : start + windowWeeks;
  const weeks = zoomedOut
    ? Array.from({ length: maxWeek }, (_, i) => i + 1)
    : Array.from({ length: windowWeeks + 1 }, (_, i) => start + i);
  const inWindow = (week: number) => week >= effectiveStart && week <= effectiveEnd;

  const activeSlug = pinned ?? hover?.slug ?? null;
  const hoverTeam = hover && teams.find((t) => t.slug === hover.slug);
  const showTooltip =
    hoverTeam &&
    hover?.week !== undefined &&
    (pinned === null || pinned === hover.slug);
  const tooltipRanking = showTooltip
    ? rankingsByWeek.get(hoverTeam.slug)?.get(hover.week!)
    : undefined;

  const togglePin = (slug: string) =>
    setPinned((p) => (p === slug ? null : slug));

  return (
    <ChartWrap onClick={() => setPinned(null)}>
      <Controls>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setStart((s) => Math.max(1, s - 1));
          }}
          disabled={zoomedOut || start === 1}
        >
          ◀ Earlier
        </Button>
        <WeekRange>
          {zoomedOut
            ? `Full season (Weeks 1–${maxWeek})`
            : `Weeks ${start}–${Math.min(effectiveEnd, maxWeek)}`}
        </WeekRange>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setStart((s) => Math.min(maxStart, s + 1));
          }}
          disabled={zoomedOut || start >= maxStart}
        >
          Later ▶
        </Button>
      </Controls>

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
                x={M.left - CLIP_PAD}
                y={M.top - CLIP_PAD}
                width={PLOT_W + CLIP_PAD * 2}
                height={PLOT_H + CLIP_PAD * 2}
              />
            </clipPath>
          </defs>

          {RANK_TICKS.map((r) => (
            <g key={r}>
              <line
                className="grid"
                x1={M.left}
                x2={M.left + PLOT_W}
                y1={y(r)}
                y2={y(r)}
              />
              <text
                className="tick"
                x={M.left + PLOT_W + 10}
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
              y={M.top + PLOT_H + 22}
              textAnchor="middle"
            >
              {w}
            </text>
          ))}
          <text
            className="axis-label"
            x={M.left + PLOT_W / 2}
            y={H - 8}
            textAnchor="middle"
          >
            Week
          </text>
          <text
            className="axis-label"
            transform={`translate(${W - 14}, ${M.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            Rank
          </text>

          {inWindow(PLAYOFFS_WEEK) && (
            <g className="playoffs">
              <line
                x1={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan)}
                x2={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan)}
                y1={M.top}
                y2={M.top + PLOT_H}
              />
              <text
                x={x(PLAYOFFS_WEEK, effectiveStart, effectiveSpan) - 6}
                y={M.top + 14}
                textAnchor="end"
              >
                Playoffs Begin
              </text>
            </g>
          )}

          <g clipPath="url(#plot-clip)">
            {teams.map((team) => {
              const active = activeSlug === team.slug;
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
                <g key={team.slug}>
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
                        slug: team.slug,
                        week: h?.slug === team.slug ? h.week : undefined,
                      }))
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(team.slug);
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
                            setHover({ slug: team.slug, week: r.week })
                          }
                        />
                      ))}
                </g>
              );
            })}
          </g>

          {teams.map((team) => {
            // Label each team at its rank for the first visible week it was ranked
            const first = team.rankings.find((r) => inWindow(r.week));
            if (!first) return null;
            const active = activeSlug === team.slug;
            return (
              <text
                key={team.slug}
                className="team-label"
                x={M.left - 10}
                y={y(first.rank)}
                textAnchor="end"
                dominantBaseline="middle"
                fontWeight={active ? 700 : 400}
                fill={active ? "#f5f5f7" : activeSlug ? "#5c5c63" : "#d1d1d6"}
                onMouseEnter={() =>
                  setHover((h) => ({
                    slug: team.slug,
                    week: h?.slug === team.slug ? h.week : undefined,
                  }))
                }
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(team.slug);
                }}
              >
                {team.name}
              </text>
            );
          })}

          {teams.map((team) => {
            const first = team.rankings.find((r) => inWindow(r.week));
            const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
            if (!first || !medal) return null;
            return (
              <text
                key={`${team.slug}-medal`}
                className="playoff-medal"
                x={4}
                y={y(first.rank)}
                fontSize={14}
                dominantBaseline="middle"
              >
                <title>{medal.label}</title>
                {medal.icon}
              </text>
            );
          })}

          {(zoomedOut || start === maxStart) && (
            <g className="playoff-column">
              <text
                className="axis-label"
                x={PLAYOFF_X}
                y={M.top - 8}
                textAnchor="middle"
              >
                Playoffs
              </text>
              {teams.map((team) => {
                const last = [...team.rankings].reverse().find((r) => inWindow(r.week));
                const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
                if (!last || !medal) return null;
                return (
                  <text
                    key={`${team.slug}-playoff`}
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

      {canZoomOut && (
        <ZoomRow>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleZoom();
            }}
          >
            {zoomedOut ? "Zoom in" : "Zoom out"}
          </Button>
        </ZoomRow>
      )}
    </ChartWrap>
  );
}

const ChartWrap = styled.div`
  width: 100%;
  max-width: ${W}px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const Button = styled.button`
  background: #2c2c2e;
  color: #f5f5f7;
  border: 1px solid #3a3a3c;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #3a3a3c;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

const WeekRange = styled.span`
  color: #a1a1a6;
  font-size: 0.95rem;
`;

const ZoomRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
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

  .team-label {
    cursor: pointer;
    font-size: 13px;
    transition:
      fill 150ms,
      font-weight 150ms;
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
