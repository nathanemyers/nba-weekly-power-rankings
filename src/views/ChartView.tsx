import RankingsChart from 'components/Chart/Chart'
import GitHubBadge from 'components/GitHubBadge'
import SeasonSelect from 'components/SeasonSelect'
import DataSourceBadge from 'components/DataSourceBadge'
import RankSwings from '@/components/RankSwings'
import TeamSeasonSummary from '@/components/TeamSeasonSummary'
import type { Team } from 'types'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { getSelectedSeason } from '@/store/slices/UI/UI'
import {
  getEndWeek,
  getStartWeek,
  getPinnedTeams,
  setPinnedTeams,
  getSinglePinnedTeam,
} from '@/store/slices/chart/chart'
import ChartControls from 'components/ChartControls'
import { useChartControls } from 'components/Chart/useChartControls'
import ChartFilter from 'components/ChartFilter'
import ChartFilterClearButton from 'components/ChartFilterClearButton'
import TeamHistoryButton from 'components/TeamHistoryButton'
import PlayoffSeriesBadges from 'components/PlayoffSeriesBadges'
import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH } from '@/constants'
import { ButtonGroup } from '@/components/ui/button-group'

export default function ChartView() {
  const dispatch = useAppDispatch()
  const data = useAppSelector(getSelectedSeason)
  const startWeek = useAppSelector(getStartWeek)
  const endWeek = useAppSelector(getEndWeek)
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)

  const pinnedSeries = data?.teams.find(
    (team) => team.teamId === singlePinnedTeam
  )?.playoffSeries

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
          <div className="grid md:grid-cols-3 gap-4 mt-5">
            <div className="grid-col-1 md:justify-self-start justify-self-center flex flex-row items-center gap-3">
              <SeasonSelect />
              <DataSourceBadge source={data.source} season={data.name} />
            </div>
            <div className="grid-col-2 justify-self-center flex flex-row flex-wrap items-center justify-center gap-3">
              {singlePinnedTeam && <TeamHistoryButton />}
              {singlePinnedTeam && (
                <PlayoffSeriesBadges
                  series={pinnedSeries}
                  onTeamClick={(team) => dispatch(setPinnedTeams([team]))}
                />
              )}
            </div>
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
            <div className="flex flex-row place-content-center justify-between">
              {data.completed && (
                <ButtonGroup>
                  <TeamSeasonSummary />
                  <RankSwings />
                </ButtonGroup>
              )}
              <ChartControls />
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No season data available</p>
      )}
    </div>
  )
}
