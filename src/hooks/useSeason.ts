import { use } from 'react'
import { useRouteLoaderData } from 'react-router'
import type { Season } from '@/data/seasonData'

export type SeasonLoaderData = { season: Promise<Season> }

export function useSeason(): Season {
  const data = useRouteLoaderData('season') as SeasonLoaderData
  return use(data.season)
}
