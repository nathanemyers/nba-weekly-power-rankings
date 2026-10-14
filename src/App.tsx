import { useEffect, useState } from "react";
import { clamp } from "lodash";
import RankingsChart, { DEFAULT_WINDOW_WEEKS } from "components/Chart/Chart";
import { seasonData, seasons } from "./data/seasons";
import GitHubBadge from "components/GitHubBadge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import RankSwings from "components/RankSwings/RankSwings";
import TeamSummary from "components/TeamSummary";
import { PlayoffStage, Team, Teams, type TeamRankings } from "./types/nba";

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
    <main
      className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-8"
      style={{ maxWidth: CHART_WIDTH + 32 }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-tight font-bold sm:text-4xl">
            NBA Weekly Power Rankings
          </h1>
          <p className="mt-1 text-muted-foreground sm:text-lg">
            Hover a line or dot, click a team to pin it, use arrow keys to pan
          </p>
        </div>
        <GitHubBadge className="mt-1" />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-muted-foreground">
          Season
          <NativeSelect
            className="text-foreground"
            value={season}
            onChange={(e) => {
              setSeason(e.target.value);
              setPinnedTeams([]);
            }}
          >
            {seasons.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => page(-1)}
            disabled={!canPageEarlier}
          >
            ◀ Earlier
          </Button>
          <span className="text-[0.95rem] text-muted-foreground">
            {zoomedOut
              ? `Full season (Weeks 1–${data.maxWeek})`
              : `Weeks ${startWeek}–${endWeek}`}
          </span>
          <Button
            variant="outline"
            onClick={() => page(1)}
            disabled={!canPageLater}
          >
            Later ▶
          </Button>
        </div>

        {canZoom && (
          <Button variant="outline" onClick={() => setZoomedOut(!zoomedOut)}>
            {zoomedOut ? "Zoom in" : "Zoom out"}
          </Button>
        )}
      </div>

      <div>
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
      </div>
    </main>
  );
}

export default App;
