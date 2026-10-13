import type { SeasonData } from "../../types";
import season_2025_26 from "./2025-26.json";
import season_2024_25 from "./2024-25.json";
import season_2023_24 from "./2023-24.json";
import season_2022_23 from "./2022-23.json";
import season_2021_22 from "./2021-22.json";
import season_2020_21 from "./2020-21.json";
import season_2019_20 from "./2019-20.json";
import season_2018_19 from "./2018-19.json";
import season_2017_18 from "./2017-18.json";

export const seasonData: Record<string, SeasonData> = {
  "2025-26": season_2025_26 as SeasonData,
  "2024-25": season_2024_25 as SeasonData,
  "2023-24": season_2023_24 as SeasonData,
  "2022-23": season_2022_23 as SeasonData,
  "2021-22": season_2021_22 as SeasonData,
  "2020-21": season_2020_21 as SeasonData,
  "2019-20": season_2019_20 as SeasonData,
  "2018-19": season_2018_19 as SeasonData,
  "2017-18": season_2017_18 as SeasonData,
};

export const seasons: string[] = Object.keys(seasonData).sort().reverse();
