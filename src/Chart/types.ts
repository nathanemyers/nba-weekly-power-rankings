export type WeekRanking = {
  week: number;
  rank: number;
  record?: string;
  summary: string;
};

export enum PlayoffStage {
  FirstRound = "first-round",
  SecondRound = "second-round",
  ConferenceFinals = "conf-finals",
  Finals = "finals",
  Champion = "champ",
}

// Output of scripts/build-rankings.mjs, one file per season
export type SeasonData = {
  season: string;
  maxWeek: number;
  rankings: Record<string, WeekRanking[]>;
  playoffs?: Record<string, PlayoffStage>;
};
