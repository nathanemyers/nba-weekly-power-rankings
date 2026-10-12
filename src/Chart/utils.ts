import { type Margin, Teams } from "../types";

export function getYforRank(
  rank: number,
  height: number,
  margin: Margin,
): number {
  const PLOT_H = height - margin.top - margin.bottom;

  const numTeams = Teams.length;
  return margin.top + ((rank - 1) / (numTeams - 1)) * PLOT_H;
}
