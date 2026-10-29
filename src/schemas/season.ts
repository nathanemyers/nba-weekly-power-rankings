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

// One player's regular season with one team, as written by scripts/lib/rosters.mjs teamRosters
export const RosterEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pos: z.string(),
  age: z.int().min(15).max(50),
  g: z.int().min(1),
  gs: z.int().min(0),
  mpg: z.number().min(0),
  pts: z.number().min(0),
  trb: z.number().min(0),
  ast: z.number().min(0),
  stl: z.number().min(0),
  blk: z.number().min(0),
  tov: z.number().min(0),
  per: z.number().nullable(),
  joinedFrom: z.enum(Team).optional(),
  leftFor: z.enum(Team).optional(),
  awards: z
    .array(
      z
        .string()
        .regex(/^((MVP|DPOY|ROY|6MOY|MIP|CPOY)-\d+|AS|NBA[123]|DEF[12])$/)
    )
    .default([]),
})

// One head coach's time with one team in a season, as written by scripts/lib/rosters.mjs teamCoaches
export const CoachStintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  g: z.int().min(1),
  w: z.int().min(0),
  l: z.int().min(0),
})

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// One curated storyline, as written by scripts/storylines/validate.mjs --finalize
export const StorylineSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string().min(1),
    eventDate: IsoDateSchema,
    teams: z.array(z.enum(Team)),
    featured: z.boolean(),
    article: z.object({
      headline: z.string().min(1),
      publisher: z.string().min(1),
      url: z.url({ protocol: /^https$/ }),
      publishedAt: IsoDateSchema,
    }),
  })
  .refine((storyline) => storyline.teams.length > 0 || storyline.featured, {
    message:
      'Every storyline must have at least one team or be a season storyline',
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
  rosters: z.partialRecord(z.enum(Team), z.array(RosterEntrySchema)).optional(),
  coaches: z.partialRecord(z.enum(Team), z.array(CoachStintSchema)).optional(),
  // Bad storyline data drops the storylines rather than failing the whole season
  storylines: z.array(StorylineSchema).optional().catch(undefined),
})

// One entry of the generated season list in data/processed/seasons/index.ts
export const SeasonIndexEntrySchema = z.object({
  name: z.string().min(1),
  source: z.enum(DataSource),
  champion: z.enum(Team).optional(),
})

export type WeekRanking = z.infer<typeof WeekRankingSchema>
export type SeasonData = z.infer<typeof SeasonDataSchema>
export type SeriesResult = z.infer<typeof SeriesResultSchema>
export type RosterEntry = z.infer<typeof RosterEntrySchema>
export type CoachStint = z.infer<typeof CoachStintSchema>
export type Storyline = z.infer<typeof StorylineSchema>
export type SeasonIndexEntry = z.infer<typeof SeasonIndexEntrySchema>
