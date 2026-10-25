import season_2025_26 from "./2025-26.json";
import season_2024_25 from "./2024-25.json";
import season_2023_24 from "./2023-24.json";
import season_2022_23 from "./2022-23.json";
import season_2021_22 from "./2021-22.json";
import season_2020_21 from "./2020-21.json";
import season_2019_20 from "./2019-20.json";
import season_2018_19 from "./2018-19.json";
import season_2017_18 from "./2017-18.json";
import season_2015_16 from "./2015-16.json";
import season_2014_15 from "./2014-15.json";
import season_2013_14 from "./2013-14.json";
import season_2012_13 from "./2012-13.json";
import season_2011_12 from "./2011-12.json";
import season_2010_11 from "./2010-11.json";
import season_2009_10 from "./2009-10.json";
import season_2008_09 from "./2008-09.json";
import season_2007_08 from "./2007-08.json";
import season_2006_07 from "./2006-07.json";
import season_2005_06 from "./2005-06.json";
import season_2004_05 from "./2004-05.json";
import season_2003_04 from "./2003-04.json";

export const seasonData: Record<string, unknown> = {
  "2025-26": season_2025_26,
  "2024-25": season_2024_25,
  "2023-24": season_2023_24,
  "2022-23": season_2022_23,
  "2021-22": season_2021_22,
  "2020-21": season_2020_21,
  "2019-20": season_2019_20,
  "2018-19": season_2018_19,
  "2017-18": season_2017_18,
  "2015-16": season_2015_16,
  "2014-15": season_2014_15,
  "2013-14": season_2013_14,
  "2012-13": season_2012_13,
  "2011-12": season_2011_12,
  "2010-11": season_2010_11,
  "2009-10": season_2009_10,
  "2008-09": season_2008_09,
  "2007-08": season_2007_08,
  "2006-07": season_2006_07,
  "2005-06": season_2005_06,
  "2004-05": season_2004_05,
  "2003-04": season_2003_04,
};

export const seasons: string[] = Object.keys(seasonData).sort().reverse();
