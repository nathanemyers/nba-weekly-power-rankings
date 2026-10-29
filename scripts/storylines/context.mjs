// Loads the files the storyline checks need for one season
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const root = join(here, '..', '..')
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

export const seasonPaths = (season) => ({
  rawFile: join(root, 'data', 'raw', 'storylines', `${season}.json`),
  seasonFile: join(root, 'data', 'processed', 'seasons', `${season}.json`),
  processedFile: join(root, 'data', 'processed', 'storylines', `${season}.json`),
})

// Returns { failures } when a required file is missing, otherwise { raw, ctx, playoffs }
export function loadSeason(season) {
  const { rawFile, seasonFile } = seasonPaths(season)
  if (!existsSync(rawFile)) return { failures: [`No candidates file at ${rawFile}`] }
  if (!existsSync(seasonFile)) return { failures: [`No season file at ${seasonFile}; run npm run build:rankings`] }
  const seasonData = readJson(seasonFile)
  const playoffs = seasonData.playoffs ?? {}
  return {
    raw: readJson(rawFile),
    playoffs,
    ctx: {
      season,
      sources: readJson(join(here, 'sources.json')),
      draftDates: readJson(join(here, 'draft-dates.json')),
      teams: Object.keys(seasonData.rankings),
      playoffTeams: Object.keys(playoffs),
      completed: Object.values(playoffs).includes('champion'),
    },
  }
}
