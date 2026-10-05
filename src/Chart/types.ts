export type WeekRanking = {
  week: number;
  rank: number;
  record?: string;
  summary: string;
};

// Output of scripts/build-rankings.mjs, one file per season
export type SeasonData = {
  season: string;
  maxWeek: number;
  rankings: Record<string, WeekRanking[]>;
};
