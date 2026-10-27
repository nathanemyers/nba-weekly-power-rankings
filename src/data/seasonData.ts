import { z } from 'zod'
import { seasonIndex as rawIndex, seasonLoaders } from 'data/seasons'
import {
  SeasonDataSchema,
  SeasonIndexEntrySchema,
  type SeasonIndexEntry,
} from 'schemas/season'
import {
  PlayoffStage,
  Teams,
  type DataSource,
  type Team,
  type TeamRankings,
} from 'types'

export type Season = {
  name: string
  source: DataSource
  teams: TeamRankings[]
  maxWeek: number
  completed: boolean
  champion?: Team
}

function parseIndex(raw: unknown): SeasonIndexEntry[] {
  const entries = Array.isArray(raw) ? raw : []
  const valid: SeasonIndexEntry[] = []
  for (const entry of entries) {
    const result = SeasonIndexEntrySchema.safeParse(entry)
    if (result.success) valid.push(result.data)
    else
      console.error(
        `Season index entry failed validation:\n${z.prettifyError(result.error)}`
      )
  }
  return valid
}

export const seasonIndex = parseIndex(rawIndex)
export const latestSeason: string | undefined = seasonIndex[0]?.name

export const isSeasonName = (name: string | undefined) =>
  seasonIndex.some((entry) => entry.name === name)

export function parseSeason(name: string, raw: unknown): Season {
  const result = SeasonDataSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(
      `Season ${name} failed validation:\n${z.prettifyError(result.error)}`
    )
  }
  const data = result.data
  const teams: TeamRankings[] = Teams.map((team) => ({
    ...team,
    rankings: data.rankings[team.teamId] ?? [],
    playoff: data.playoffs?.[team.teamId],
    playoffSeries: data.playoffSeries?.[team.teamId],
    aiSummary: data.summaries?.[team.teamId],
    roster: data.rosters?.[team.teamId],
    coaches: data.coaches?.[team.teamId],
  })).filter((team) => team.rankings.length > 0)
  const champion = teams.find(
    (team) => team.playoff === PlayoffStage.Champion
  )?.teamId
  return {
    name,
    source: data.source,
    teams,
    maxWeek: data.maxWeek,
    completed: champion !== undefined,
    champion,
  }
}

// One promise per season for the whole visit, so each season downloads and validates once
const cache: Record<string, Promise<Season>> = {}

export function loadSeason(name: string): Promise<Season> {
  if (name in cache) return cache[name]
  const loader = seasonLoaders[name]
  if (!loader) return Promise.reject(new Error(`Unknown season ${name}`))
  const promise = loader()
    .then((mod) => parseSeason(name, mod.default))
    .catch((error: unknown) => {
      delete cache[name]
      throw error
    })
  cache[name] = promise
  return promise
}

export async function loadAllSeasons(): Promise<Season[]> {
  const results = await Promise.allSettled(
    seasonIndex.map((entry) => loadSeason(entry.name))
  )
  const seasons: Season[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') seasons.push(result.value)
    else console.error(result.reason)
  }
  return seasons
}

export const getTeamRankings = (season: Season, team: Team | undefined) =>
  team ? season.teams.find((t) => t.teamId === team) : undefined

export const getAISummary = (season: Season, team: Team | undefined) =>
  getTeamRankings(season, team)?.aiSummary
