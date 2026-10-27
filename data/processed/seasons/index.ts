export const seasonIndex: unknown = [
  {
    "name": "2025-26",
    "source": "nba",
    "champion": "nyk"
  },
  {
    "name": "2024-25",
    "source": "nba",
    "champion": "okc"
  },
  {
    "name": "2023-24",
    "source": "nba",
    "champion": "bos"
  },
  {
    "name": "2022-23",
    "source": "nba",
    "champion": "den"
  },
  {
    "name": "2021-22",
    "source": "nba",
    "champion": "gsw"
  },
  {
    "name": "2020-21",
    "source": "nba",
    "champion": "mil"
  },
  {
    "name": "2019-20",
    "source": "nba",
    "champion": "lal"
  },
  {
    "name": "2018-19",
    "source": "nba",
    "champion": "tor"
  },
  {
    "name": "2017-18",
    "source": "nba",
    "champion": "gsw"
  },
  {
    "name": "2015-16",
    "source": "espn",
    "champion": "cle"
  },
  {
    "name": "2014-15",
    "source": "espn",
    "champion": "gsw"
  },
  {
    "name": "2013-14",
    "source": "espn",
    "champion": "sas"
  },
  {
    "name": "2012-13",
    "source": "espn",
    "champion": "mia"
  },
  {
    "name": "2011-12",
    "source": "espn",
    "champion": "mia"
  },
  {
    "name": "2010-11",
    "source": "espn",
    "champion": "dal"
  },
  {
    "name": "2009-10",
    "source": "espn",
    "champion": "lal"
  },
  {
    "name": "2008-09",
    "source": "espn",
    "champion": "lal"
  },
  {
    "name": "2007-08",
    "source": "espn",
    "champion": "bos"
  },
  {
    "name": "2006-07",
    "source": "espn",
    "champion": "sas"
  },
  {
    "name": "2005-06",
    "source": "espn",
    "champion": "mia"
  },
  {
    "name": "2004-05",
    "source": "espn",
    "champion": "sas"
  },
  {
    "name": "2003-04",
    "source": "espn",
    "champion": "det"
  }
];

export const seasonLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  "2025-26": () => import("./2025-26.json"),
  "2024-25": () => import("./2024-25.json"),
  "2023-24": () => import("./2023-24.json"),
  "2022-23": () => import("./2022-23.json"),
  "2021-22": () => import("./2021-22.json"),
  "2020-21": () => import("./2020-21.json"),
  "2019-20": () => import("./2019-20.json"),
  "2018-19": () => import("./2018-19.json"),
  "2017-18": () => import("./2017-18.json"),
  "2015-16": () => import("./2015-16.json"),
  "2014-15": () => import("./2014-15.json"),
  "2013-14": () => import("./2013-14.json"),
  "2012-13": () => import("./2012-13.json"),
  "2011-12": () => import("./2011-12.json"),
  "2010-11": () => import("./2010-11.json"),
  "2009-10": () => import("./2009-10.json"),
  "2008-09": () => import("./2008-09.json"),
  "2007-08": () => import("./2007-08.json"),
  "2006-07": () => import("./2006-07.json"),
  "2005-06": () => import("./2005-06.json"),
  "2004-05": () => import("./2004-05.json"),
  "2003-04": () => import("./2003-04.json"),
};
