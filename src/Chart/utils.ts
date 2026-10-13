import { type Margin, PlayoffStage, Teams, type WeekRanking } from "../types";

export const PLAYOFF_MEDALS: Record<
  PlayoffStage,
  { icon: string; label: string }
> = {
  [PlayoffStage.FirstRound]: { icon: "🥉", label: "Lost in the first round" },
  [PlayoffStage.SecondRound]: { icon: "🥈", label: "Lost in the second round" },
  [PlayoffStage.ConferenceFinals]: {
    icon: "🥇",
    label: "Lost in the conference finals",
  },
  [PlayoffStage.Finals]: { icon: "🏆", label: "Runner-up in the Finals" },
  [PlayoffStage.Champion]: { icon: "👑", label: "NBA champion" },
};

export function getYforRank(
  rank: number,
  height: number,
  margin: Margin,
): number {
  const PLOT_H = height - margin.top - margin.bottom;

  const numTeams = Teams.length;
  return margin.top + ((rank - 1) / (numTeams - 1)) * PLOT_H;
}

// Weeks can be missing for a team, so search by week number rather than array position
export function firstRankingInRange(
  rankings: WeekRanking[],
  start: number,
  end: number,
): WeekRanking | undefined {
  return rankings.find((r) => r.week >= start && r.week <= end);
}
