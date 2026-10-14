import { z } from "zod";
import { SeasonDataSchema } from "../schemas/season";
import { PlayoffStage, Teams, type TeamRankings } from "types";

export type SeasonView = {
  teams: TeamRankings[];
  maxWeek: number;
  completed: boolean;
};

export type InvalidSeason = { season: string; message: string };

export type SeasonsState = {
  order: string[];
  bySeason: Record<string, SeasonView>;
  invalid: InvalidSeason[];
};

export function loadSeasons(
  order: string[],
  raw: Record<string, unknown>,
): SeasonsState {
  const state: SeasonsState = { order: [], bySeason: {}, invalid: [] };
  for (const season of order) {
    const result = SeasonDataSchema.safeParse(raw[season]);
    if (!result.success) {
      const message = z.prettifyError(result.error);
      console.error(`Season ${season} failed validation:\n${message}`);
      state.invalid.push({ season, message });
      continue;
    }
    const data = result.data;
    const teams: TeamRankings[] = Teams.map((team) => ({
      ...team,
      rankings: data.rankings[team.teamId] ?? [],
      playoff: data.playoffs?.[team.teamId],
      aiSummary: data.summaries?.[team.teamId],
    })).filter((team) => team.rankings.length > 0);
    const completed = Object.values(data.playoffs ?? {}).includes(
      PlayoffStage.Champion,
    );
    state.order.push(season);
    state.bySeason[season] = { teams, maxWeek: data.maxWeek, completed };
  }
  return state;
}
