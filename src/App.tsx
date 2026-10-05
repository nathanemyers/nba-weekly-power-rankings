import { useEffect, useState } from "react";
import styled from "styled-components";
import RankingsChart, { type TeamRankings } from "./Chart/Chart";
import { TEAMS } from "./Chart/teams";
import type { SeasonData } from "./Chart/types";

// Each season file is code-split and only fetched when that season is selected
const seasonLoaders = import.meta.glob<{ default: SeasonData }>(
  "./data/seasons/*.json",
);

const seasons = Object.keys(seasonLoaders)
  .map((path) => path.match(/(\d{4}-\d{2})\.json$/)![1])
  .sort()
  .reverse();

async function loadSeason(season: string) {
  const { default: data } = await seasonLoaders[
    `./data/seasons/${season}.json`
  ]();
  const teams: TeamRankings[] = TEAMS.map((team) => ({
    ...team,
    rankings: data.rankings[team.slug] ?? [],
  })).filter((team) => team.rankings.length > 0);
  return { teams, maxWeek: data.maxWeek };
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  box-sizing: border-box;
  margin: 0;
  padding: 2rem 16px;
  font-family: system-ui, sans-serif;
  background: #1d1d1f;
  color: #f5f5f7;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #a1a1a6;
  margin: 0 0 1.5rem;
  text-align: center;
`;

const SeasonRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  color: #a1a1a6;
`;

const Select = styled.select`
  background: #2c2c2e;
  color: #f5f5f7;
  border: 1px solid #3a3a3c;
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  font: inherit;
  cursor: pointer;
`;

const Status = styled.p`
  color: #a1a1a6;
  margin: 3rem 0;
`;

function App() {
  const [season, setSeason] = useState(seasons[0]);
  // Tagged with its season so a stale load can't show under the newly selected year
  const [loaded, setLoaded] = useState<{
    season: string;
    data: Awaited<ReturnType<typeof loadSeason>>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSeason(season).then((data) => {
      if (!cancelled) setLoaded({ season, data });
    });
    return () => {
      cancelled = true;
    };
  }, [season]);

  const data = loaded?.season === season ? loaded.data : null;

  return (
    <Container>
      <Title>NBA Weekly Power Rankings</Title>
      <Subtitle>
        Hover a line or dot, click a team to pin it, use arrow keys to pan
      </Subtitle>
      <SeasonRow>
        Season
        <Select value={season} onChange={(e) => setSeason(e.target.value)}>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </SeasonRow>
      {data ? (
        <RankingsChart
          key={season}
          teams={data.teams}
          maxWeek={data.maxWeek}
        />
      ) : (
        <Status>Loading {season}…</Status>
      )}
    </Container>
  );
}

export default App;
