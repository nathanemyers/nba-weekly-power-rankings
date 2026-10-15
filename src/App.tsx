import RankingsChart from 'components/Chart/Chart'
import GitHubBadge from 'components/GitHubBadge'
import SeasonSelect from 'components/SeasonSelect'
import RankSwings from 'components/RankSwings/RankSwings'
import TeamSummary from 'components/TeamSummary'
import type { Team } from './types/nba'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { getSelectedSeason } from '@/store/slices/UI/UI'
import {
  getEndWeek,
  getStartWeek,
  getPinnedTeams,
  setPinnedTeams,
} from '@/store/slices/chart/chart'
import ChartControls from './components/ChartControls'
import { useChartControls } from './components/Chart/useChartControls'

const CHART_WIDTH = 960
const CHART_HEIGHT = 600
const CHART_MARGIN = { top: 30, right: 120, bottom: 60, left: 190 }

function App() {
  const dispatch = useAppDispatch()
  const season = useAppSelector(getSelectedSeason)
  const data = useAppSelector(getSelectedSeason)
  const startWeek = useAppSelector(getStartWeek)
  const endWeek = useAppSelector(getEndWeek)
  const pinnedTeams = useAppSelector(getPinnedTeams)

  const togglePin = (team?: Team) => {
    if (!team) {
      dispatch(setPinnedTeams([]))
    } else {
      dispatch(setPinnedTeams([team]))
    }
  }

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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid-col-1 md:justify-items-start justify-items-center">
              <SeasonSelect />
            </div>
            <div className="grid-col-2 justify-items-center">
              <ChartControls />
            </div>
          </div>

          <div>
            <RankingsChart
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

            {pinnedTeams.length === 1 && (
              <TeamSummary team={pinnedTeams[0]} season={season.name} />
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
