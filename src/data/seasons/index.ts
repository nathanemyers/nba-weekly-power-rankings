import type { SeasonData } from '../../Chart/types';
import season_2025_26 from './2025-26';
import season_2024_25 from './2024-25';
import season_2023_24 from './2023-24';
import season_2022_23 from './2022-23';
import season_2021_22 from './2021-22';
import season_2020_21 from './2020-21';
import season_2019_20 from './2019-20';
import season_2018_19 from './2018-19';
import season_2017_18 from './2017-18';

export const seasonData: Record<string, SeasonData> = {
  '2025-26': season_2025_26,
  '2024-25': season_2024_25,
  '2023-24': season_2023_24,
  '2022-23': season_2022_23,
  '2021-22': season_2021_22,
  '2020-21': season_2020_21,
  '2019-20': season_2019_20,
  '2018-19': season_2018_19,
  '2017-18': season_2017_18,
};

export const seasons: string[] = Object.keys(seasonData).sort().reverse();
