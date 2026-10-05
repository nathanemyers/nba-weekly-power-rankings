export type WeekRanking = {
  week: number;
  rank: number;
  record?: string;
  summary: string;
};

// Furthest postseason stage a team reached
export type PlayoffStage =
  | "first-round"
  | "semis"
  | "conf-finals"
  | "finals"
  | "champion";

// Output of scripts/build-rankings.mjs, one file per season
export type SeasonData = {
  season: string;
  maxWeek: number;
  rankings: Record<string, WeekRanking[]>;
  playoffs?: Record<string, PlayoffStage>;
};
