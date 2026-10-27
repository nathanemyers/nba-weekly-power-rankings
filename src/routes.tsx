import {
  data,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router'
import { z } from 'zod'
import Root, { RootFallback } from './Root'
import ChartView from './views/ChartView'
import TeamHistoryView from './views/TeamHistoryView'
import RouteError from './views/RouteError'
import NoSeasons from './views/NoSeasons'
import {
  isSeasonName,
  latestSeason,
  loadAllSeasons,
  loadSeason,
} from '@/data/seasonData'
import { Team } from 'types'

function seasonLoader({ params }: LoaderFunctionArgs) {
  if (!isSeasonName(params.season)) {
    if (!latestSeason) throw data(null, { status: 404 })
    throw redirect('/' + latestSeason)
  }
  return { season: loadSeason(params.season!) }
}

function teamHistoryLoader({ params }: LoaderFunctionArgs) {
  const team = z.enum(Team).safeParse(params.team?.toLowerCase())
  if (!team.success)
    throw data(null, { status: 404, statusText: 'Team not found' })
  return { team: team.data, seasons: loadAllSeasons() }
}

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Root,
    HydrateFallback: RootFallback,
    children: [
      {
        index: true,
        Component: NoSeasons,
        loader: () => {
          if (latestSeason) throw redirect('/' + latestSeason)
          return null
        },
      },
      {
        id: 'teamHistory',
        path: 'teamHistory/:team',
        Component: TeamHistoryView,
        ErrorBoundary: RouteError,
        loader: teamHistoryLoader,
      },
      {
        id: 'season',
        path: ':season',
        Component: ChartView,
        ErrorBoundary: RouteError,
        loader: seasonLoader,
      },
      {
        path: '*',
        Component: NoSeasons,
        ErrorBoundary: RouteError,
        loader: () => {
          throw data(null, { status: 404 })
        },
      },
    ],
  },
]
