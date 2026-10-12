import { type Margin, Teams } from "../types";

export function getYforRank(
  rank: number,
  height: number,
  margin: Margin,
): number {
  const numTeams = Teams.length;
  const plotHeight = height - margin.top - margin.bottom;
  const perTeamHeight = plotHeight / numTeams;
  return rank * perTeamHeight + margin.top + perTeamHeight / 2;
}
