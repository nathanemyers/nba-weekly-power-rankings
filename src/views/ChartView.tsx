import RankingsChart from 'components/Chart/Chart'
import GitHubBadge from 'components/GitHubBadge'
import SeasonSelect from 'components/SeasonSelect'
import RankSwings from 'components/RankSwings/RankSwings'
import TeamSeasonSummary from '@/components/TeamSeasonSummary'
import type { Team } from 'types'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { getSelectedSeason } from '@/store/slices/UI/UI'
import {
  getEndWeek,
  getStartWeek,
  getPinnedTeams,
  setPinnedTeams,
} from '@/store/slices/chart/chart'
import ChartControls from 'components/ChartControls'
import { useChartControls } from 'components/Chart/useChartControls'
import ChartFilter from 'components/ChartFilter'
import ChartFilterClearButton from 'components/ChartFilterClearButton'
import TeamHistoryButton from 'components/TeamHistoryButton'
import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH } from '@/constants'

export default function ChartView() {
  const dispatch = useAppDispatch()
  const season = useAppSelector(getSelectedSeason)
  const data = useAppSelector(getSelectedSeason)
  const startWeek = useAppSelector(getStartWeek)
  const endWeek = useAppSelector(getEndWeek)
  const pinnedTeams = useAppSelector(getPinnedTeams)

  const togglePin = (team?: Team) =>
    dispatch(setPinnedTeams(team && !pinnedTeams.includes(team) ? [team] : []))

  useChartControls()

  return (
    <div>
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
            <div className="grid-col-1 md:justify-self-start justify-self-center">
              <SeasonSelect />
            </div>
            {pinnedTeams.length === 1 && (
              <div className="grid-col-2 justify-self-center">
                <TeamHistoryButton />
              </div>
            )}
            <div className="grid-col-3 md:justify-self-end justify-self-center align-items-center gap-2 flex flex-row">
              {pinnedTeams.length > 0 && <ChartFilterClearButton />}
              <ChartFilter />
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
            <ChartControls />

            {data.completed && (
              <RankSwings
                teams={data.teams}
                maxWeek={data.maxWeek}
                pinnedTeams={pinnedTeams}
                onClick={togglePin}
              />
            )}

            {pinnedTeams.length === 1 && (
              <TeamSeasonSummary team={pinnedTeams[0]} season={season.name} />
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No season data available</p>
      )}
    </div>
  )
}
