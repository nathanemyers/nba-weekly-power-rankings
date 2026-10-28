import RankingsChart from 'components/Chart/Chart'
import GitHubBadge from '@/components/Badges/GitHubBadge'
import SeasonSelect from 'components/SeasonSelect'
import DataSourceBadge from '@/components/Badges/DataSourceBadge'
import type { Team } from 'types'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { useSeason } from '@/hooks/useSeason'
import { Suspense } from 'react'
import { useParams } from 'react-router'
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
import PlayoffSeriesBadges from '@/components/Badges/PlayoffSeriesBadges'
import DetailTabs from 'components/DetailTabs'
import {
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_WIDTH,
  COMPACT_CHART_HEIGHT,
  COMPACT_CHART_MARGIN,
  COMPACT_CHART_WIDTH,
} from '@/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function ChartBody() {
  const dispatch = useAppDispatch()
  const data = useSeason()
  const startWeek = useAppSelector((s) => getStartWeek(s, data.maxWeek))
  const endWeek = useAppSelector((s) => getEndWeek(s, data.maxWeek))
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const singlePinnedTeam = useAppSelector(getSinglePinnedTeam)
  const wide = useMediaQuery('(min-width: 640px)')

  const pinnedSeries = data.teams.find(
    (team) => team.teamId === singlePinnedTeam
  )?.playoffSeries

  const togglePin = (team?: Team) =>
    dispatch(setPinnedTeams(team && !pinnedTeams.includes(team) ? [team] : []))

  useChartControls(data.maxWeek)

  return (
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <SeasonSelect />
          <DataSourceBadge source={data.source} season={data.name} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {singlePinnedTeam && (
            <PlayoffSeriesBadges
              series={pinnedSeries}
              onTeamClick={(team) => dispatch(setPinnedTeams([team]))}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
          {singlePinnedTeam && <TeamHistoryButton team={singlePinnedTeam} />}
          {pinnedTeams.length > 0 && <ChartFilterClearButton />}
          <ChartFilter />
        </div>
      </div>

      <div>
        <RankingsChart
          startWeek={startWeek}
          endWeek={endWeek}
          teams={data.teams}
          width={wide ? CHART_WIDTH : COMPACT_CHART_WIDTH}
          height={wide ? CHART_HEIGHT : COMPACT_CHART_HEIGHT}
          margin={wide ? CHART_MARGIN : COMPACT_CHART_MARGIN}
          compact={!wide}
          pinnedTeams={pinnedTeams}
          onClick={togglePin}
        />
        <div className="flex justify-center">
          <ChartControls />
        </div>
        <div className="mt-6">
          <DetailTabs />
        </div>
      </div>
    </>
  )
}

export default function ChartView() {
  const { season } = useParams()

  return (
    <div>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-bold sm:text-4xl">
            NBA Weekly Power Rankings
          </h1>
          <p className="mt-1 text-muted-foreground sm:text-lg">
            <span className="sm:hidden">Tap a team to pin it</span>
            <span className="hidden sm:inline">
              Hover a line or dot, click a team to pin it, use arrow keys to pan
            </span>
          </p>
        </div>
        <GitHubBadge className="mt-1" />
      </header>

      <Suspense
        key={season}
        fallback={
          <p
            className="mt-5 flex items-center justify-center text-muted-foreground"
            style={{ height: CHART_HEIGHT }}
          >
            Loading season…
          </p>
        }
      >
        <ChartBody />
      </Suspense>
    </div>
  )
}
