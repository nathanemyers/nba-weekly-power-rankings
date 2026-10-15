import { z } from 'zod'
import { SeasonDataSchema } from 'schemas/season'
import { PlayoffStage, Teams, type TeamRankings } from 'types'
import type { SeasonsState } from './seasons'

export function loadSeasons(
  order: string[],
  raw: Record<string, unknown>
): SeasonsState {
  const state: SeasonsState = { order: [], seasons: {}, invalidSeasons: [] }
  for (const season of order) {
    const result = SeasonDataSchema.safeParse(raw[season])
    if (!result.success) {
      const message = z.prettifyError(result.error)
      console.error(`Season ${season} failed validation:\n${message}`)
      state.invalidSeasons.push({ season, message })
      continue
    }
    const data = result.data
    const teams: TeamRankings[] = Teams.map((team) => ({
      ...team,
      rankings: data.rankings[team.teamId] ?? [],
      playoff: data.playoffs?.[team.teamId],
      aiSummary: data.summaries?.[team.teamId],
    })).filter((team) => team.rankings.length > 0)
    const champion = teams.find(
      (team) => team.playoff === PlayoffStage.Champion
    )?.teamId
    state.order.push(season)
    state.seasons[season] = {
      teams,
      maxWeek: data.maxWeek,
      completed: champion !== undefined,
      champion,
    }
  }
  return state
}
