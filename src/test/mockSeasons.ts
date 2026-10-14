import { buildRankings, PLAYOFFS } from "./fixtures";

// Two fixture seasons for store tests: a 26-week season and one shorter than the zoom window
export const mockSeasons = {
  seasons: ["long", "short"],
  seasonData: {
    long: {
      season: "long",
      maxWeek: 26,
      rankings: buildRankings(26),
      playoffs: PLAYOFFS,
      summaries: { bos: "Boston led from the first week." },
    },
    short: { season: "short", maxWeek: 8, rankings: buildRankings(8) },
  },
};
