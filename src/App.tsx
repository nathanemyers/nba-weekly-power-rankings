import { useEffect } from "react";
import RankingsChart from "components/Chart/Chart";
import GitHubBadge from "components/GitHubBadge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import RankSwings from "components/RankSwings/RankSwings";
import TeamSummary from "components/TeamSummary";
import type { Team } from "./types/nba";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { seasonSelected, selectSeason } from "@/store/slices/navigation/navigation";
import { selectSeasonOrder, selectSeasonView } from "./store/slices/seasons/seasons";
import {
  pageWindow,
  selectCanPageEarlier,
  selectCanPageLater,
  selectCanZoom,
  selectEndWeek,
  selectStartWeek,
  selectZoomedOut,
  zoomToggled,
} from "@/store/slices/chartView/chartView";
import {
  pinToggled,
  selectPinnedTeam,
  selectPinnedTeams,
} from "./store/slices/selection/selection";

const CHART_WIDTH = 960;
const CHART_HEIGHT = 600;
const CHART_MARGIN = { top: 30, right: 120, bottom: 60, left: 190 };

function App() {
  const dispatch = useAppDispatch();
  const seasons = useAppSelector(selectSeasonOrder);
  const season = useAppSelector(selectSeason);
  const data = useAppSelector(selectSeasonView);
  const zoomedOut = useAppSelector(selectZoomedOut);
  const startWeek = useAppSelector(selectStartWeek);
  const endWeek = useAppSelector(selectEndWeek);
  const canPageEarlier = useAppSelector(selectCanPageEarlier);
  const canPageLater = useAppSelector(selectCanPageLater);
  const canZoom = useAppSelector(selectCanZoom);
  const pinnedTeams = useAppSelector(selectPinnedTeams);
  const pinnedTeam = useAppSelector(selectPinnedTeam);

  const togglePin = (team?: Team) => dispatch(pinToggled(team));

  useEffect(() => {
    if (zoomedOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") dispatch(pageWindow(-1));
      if (e.key === "ArrowRight") dispatch(pageWindow(1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedOut, dispatch]);

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

      {data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-muted-foreground">
              Season
              <NativeSelect
                className="text-foreground"
                value={season}
                onChange={(e) => dispatch(seasonSelected(e.target.value))}
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
                onClick={() => dispatch(pageWindow(-1))}
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
                onClick={() => dispatch(pageWindow(1))}
                disabled={!canPageLater}
              >
                Later ▶
              </Button>
            </div>

            {canZoom && (
              <Button variant="outline" onClick={() => dispatch(zoomToggled())}>
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
        </>
      ) : (
        <p className="text-muted-foreground">No season data available</p>
      )}
    </main>
  );
}

export default App;
