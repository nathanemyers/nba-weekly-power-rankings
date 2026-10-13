import { useEffect, useState } from "react";
import styled from "styled-components";
import { clamp } from "lodash";
import RankingsChart, { DEFAULT_WINDOW_WEEKS } from "./Chart/Chart";
import { seasonData, seasons } from "./data/seasons";
import RankSwings from "./RankSwings/RankSwings";
import TeamSummary from "./TeamSummary";
import { PlayoffStage, Team, Teams, type TeamRankings } from "./types";

const CHART_WIDTH = 960;
const CHART_HEIGHT = 600;
const CHART_MARGIN = { top: 30, right: 120, bottom: 60, left: 190 };

function loadSeason(season: string) {
  const data = seasonData[season];
  const teams: TeamRankings[] = Teams.map((team) => ({
    ...team,
    rankings: data.rankings[team.teamId] ?? [],
    playoff: data.playoffs?.[team.teamId],
    aiSummary: data.summaries?.[team.teamId],
  })).filter((team) => team.rankings.length > 0);
  const completed = Object.values(data.playoffs ?? {}).includes(
    PlayoffStage.Champion,
  );
  return { teams, maxWeek: data.maxWeek, completed };
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

const ChartColumn = styled.div`
  width: 100%;
  max-width: ${CHART_WIDTH}px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const WeekRange = styled.span`
  color: #a1a1a6;
  font-size: 0.95rem;
`;

const ZoomRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
`;

function App() {
  const [season, setSeason] = useState(seasons[0]);
  const [zoomedOut, setZoomedOut] = useState(true);
  const [zoomedInStartWeek, setZoomedInStartWeek] = useState(1);
  const [zoomedInEndWeek, setZoomedInEndWeek] = useState(
    1 + DEFAULT_WINDOW_WEEKS,
  );
  const [pinnedTeams, setPinnedTeams] = useState<Team[]>([]);
  const data = loadSeason(season);

  // Slid back inside the season on read, so a shorter season can't leave the window past its end
  const windowEnd = Math.min(zoomedInEndWeek, data.maxWeek);
  const windowStart = Math.max(
    1,
    windowEnd - (zoomedInEndWeek - zoomedInStartWeek),
  );
  const startWeek = zoomedOut ? 1 : windowStart;
  const endWeek = zoomedOut ? data.maxWeek : windowEnd;
  const canPageEarlier = !zoomedOut && windowStart > 1;
  const canPageLater = !zoomedOut && windowEnd < data.maxWeek;
  const pinnedTeam =
    pinnedTeams.length === 1
      ? data.teams.find((team) => team.teamId === pinnedTeams[0])
      : undefined;
  const canZoom = windowStart > 1 || windowEnd < data.maxWeek;

  const togglePin = (team?: Team) =>
    setPinnedTeams(team && !pinnedTeams.includes(team) ? [team] : []);

  const page = (delta: number) => {
    const weeks = clamp(delta, 1 - windowStart, data.maxWeek - windowEnd);
    if (weeks === 0) return;
    setZoomedInStartWeek(windowStart + weeks);
    setZoomedInEndWeek(windowEnd + weeks);
  };

  useEffect(() => {
    if (zoomedOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") page(-1);
      if (e.key === "ArrowRight") page(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Container>
      <Title>NBA Weekly Power Rankings</Title>
      <Subtitle>
        Hover a line or dot, click a team to pin it, use arrow keys to pan
      </Subtitle>
      <SeasonRow>
        Season
        <Select
          value={season}
          onChange={(e) => {
            setSeason(e.target.value);
            setPinnedTeams([]);
          }}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </SeasonRow>

      <ChartColumn>
        <Controls>
          <Button onClick={() => page(-1)} disabled={!canPageEarlier}>
            ◀ Earlier
          </Button>
          <WeekRange>
            {zoomedOut
              ? `Full season (Weeks 1–${data.maxWeek})`
              : `Weeks ${startWeek}–${endWeek}`}
          </WeekRange>
          <Button onClick={() => page(1)} disabled={!canPageLater}>
            Later ▶
          </Button>
        </Controls>

        <RankingsChart
          key={season}
          startWeek={startWeek}
          endWeek={endWeek}
          teams={data.teams}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          margin={CHART_MARGIN}
          pinnedTeams={pinnedTeams}
          onClick={togglePin}
        />

        {canZoom && (
          <ZoomRow>
            <Button onClick={() => setZoomedOut(!zoomedOut)}>
              {zoomedOut ? "Zoom in" : "Zoom out"}
            </Button>
          </ZoomRow>
        )}

        {data.completed && (
          <RankSwings
            teams={data.teams}
            maxWeek={data.maxWeek}
            pinnedTeams={pinnedTeams}
            onClick={togglePin}
          />
        )}

        {pinnedTeam?.aiSummary && (
          <TeamSummary
            teamName={pinnedTeam.name}
            summary={pinnedTeam.aiSummary}
          />
        )}
      </ChartColumn>
    </Container>
  );
}

export default App;
