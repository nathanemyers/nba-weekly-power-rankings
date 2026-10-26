import { z } from 'zod'
import { DataSource, PlayoffStage, Team } from '../types/nba'

export const WeekRankingSchema = z.object({
  week: z.int().min(1),
  rank: z.int().min(1).max(30),
  record: z.string().optional(),
  summary: z.string(),
})

// One playoff series from a team's side, as written by scripts/lib/playoffs.mjs teamPlayoffRuns
export const SeriesResultSchema = z.object({
  round: z.enum([
    PlayoffStage.FirstRound,
    PlayoffStage.SecondRound,
    PlayoffStage.ConferenceFinals,
    PlayoffStage.Finals,
  ]),
  opponent: z.enum(Team),
  wins: z.int().min(0).max(4),
  losses: z.int().min(0).max(4),
})

// Output of scripts/build-rankings.mjs, one file per season
export const SeasonDataSchema = z.object({
  season: z.string().min(1),
  source: z.enum(DataSource),
  maxWeek: z.int().min(1),
  rankings: z.partialRecord(z.enum(Team), z.array(WeekRankingSchema)),
  playoffs: z.partialRecord(z.enum(Team), z.enum(PlayoffStage)).optional(),
  summaries: z.partialRecord(z.enum(Team), z.string()).optional(),
  playoffSeries: z
    .partialRecord(z.enum(Team), z.array(SeriesResultSchema))
    .optional(),
})

export type WeekRanking = z.infer<typeof WeekRankingSchema>
export type SeasonData = z.infer<typeof SeasonDataSchema>
export type SeriesResult = z.infer<typeof SeriesResultSchema>
