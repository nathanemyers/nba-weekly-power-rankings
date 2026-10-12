import { useState } from "react";
import styled from "styled-components";
import RankingsChart from "./Chart/Chart";
import { seasonData, seasons } from "./data/seasons";
import { Team, Teams, type TeamRankings } from "./types";

function loadSeason(season: string) {
  const data = seasonData[season];
  const teams: TeamRankings[] = Teams.map((team) => ({
    ...team,
    rankings: data.rankings[team.teamId] ?? [],
    playoff: data.playoffs?.[team.teamId],
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

const Button = styled.button`
  background: #2c2c2e;
  color: #f5f5f7;
  border: 1px solid #3a3a3c;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #3a3a3c;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

function App() {
  const [season, setSeason] = useState(seasons[0]);
  const [zoomedOut, setZoomedOut] = useState(false);
  const [zoomedInstartWeek, setZoomedInstartWeek] = useState(1);
  const [zoomedInendWeek, setZoomedInendWeek] = useState(10);
  const [pinnedTeams, setPinnedTeams] = useState<Team[]>([]);
  const data = loadSeason(season);

  const startWeek = zoomedOut ? 1 : zoomedInstartWeek;
  const endWeek = zoomedOut ? data.maxWeek : zoomedInendWeek;

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

      <RankingsChart
        key={season}
        startWeek={startWeek}
        endWeek={endWeek}
        teams={data.teams}
        width={960}
        height={600}
        margin={{ top: 30, right: 120, bottom: 60, left: 190 }}
        pinnedTeams={pinnedTeams}
        onClick={(team?: Team) => {
          if (team) {
            setPinnedTeams([team]);
          } else {
            setPinnedTeams([]);
          }
        }}
      />

      <Button onClick={() => setZoomedOut(!zoomedOut)}>
        {zoomedOut ? "Zoom in" : "Zoom out"}
      </Button>
      <Button
        onClick={() => {
          if (!zoomedOut) {
            setZoomedInstartWeek((s) => Math.max(1, s - 1));
            setZoomedInendWeek((e) => Math.max(1, e - 1));
          }
        }}
        disabled={zoomedOut || zoomedInstartWeek <= 1}
      >
        Prev Week
      </Button>

      <Button
        onClick={() => {
          if (!zoomedOut) {
            setZoomedInstartWeek((s) => Math.min(data.maxWeek, s + 1));
            setZoomedInendWeek((e) => Math.min(data.maxWeek, e + 1));
          }
        }}
        disabled={zoomedOut || zoomedInendWeek >= data.maxWeek}
      >
        Next Week
      </Button>
    </Container>
  );
}

export default App;
