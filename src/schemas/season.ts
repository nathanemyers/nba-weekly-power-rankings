import { z } from 'zod'
import { PlayoffStage, Team } from '../types/nba'

export const WeekRankingSchema = z.object({
  week: z.int().min(1),
  rank: z.int().min(1).max(30),
  record: z.string().optional(),
  summary: z.string(),
})

// Output of scripts/build-rankings.mjs, one file per season
export const SeasonDataSchema = z.object({
  season: z.string().min(1),
  maxWeek: z.int().min(1),
  rankings: z.partialRecord(z.enum(Team), z.array(WeekRankingSchema)),
  playoffs: z.partialRecord(z.enum(Team), z.enum(PlayoffStage)).optional(),
  summaries: z.partialRecord(z.enum(Team), z.string()).optional(),
})

export type WeekRanking = z.infer<typeof WeekRankingSchema>
export type SeasonData = z.infer<typeof SeasonDataSchema>
