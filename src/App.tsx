import RankingsChart from 'components/Chart/Chart'
import GitHubBadge from 'components/GitHubBadge'
import SeasonSelect from 'components/SeasonSelect'
import RankSwings from 'components/RankSwings/RankSwings'
import TeamSummary from 'components/TeamSummary'
import type { Team } from './types/nba'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { selectSeason } from 'store/slices/navigation/navigation'
import { selectSeasonView } from 'store/slices/seasons/seasons'
import {
  selectEndWeek,
  selectStartWeek,
} from 'store/slices/chartView/chartView'
import {
  pinToggled,
  selectPinnedTeam,
  selectPinnedTeams,
} from 'store/slices/selection/selection'
import ChartControls from './components/ChartControls'
import { useChartControls } from './components/Chart/useChartControls'

const CHART_WIDTH = 960
const CHART_HEIGHT = 600
const CHART_MARGIN = { top: 30, right: 120, bottom: 60, left: 190 }

function App() {
  const dispatch = useAppDispatch()
  const season = useAppSelector(selectSeason)
  const data = useAppSelector(selectSeasonView)
  const startWeek = useAppSelector(selectStartWeek)
  const endWeek = useAppSelector(selectEndWeek)
  const pinnedTeams = useAppSelector(selectPinnedTeams)
  const pinnedTeam = useAppSelector(selectPinnedTeam)

  const togglePin = (team?: Team) => dispatch(pinToggled(team))

  useChartControls()

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
            <SeasonSelect />
            <ChartControls />
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
  )
}

export default App
