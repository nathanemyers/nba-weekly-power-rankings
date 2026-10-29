// Usage: node scripts/storylines/add.mjs <season>
// Appends data/raw/storylines/<season>.additions.json ({ guidance, candidates }) to the raw file as pending
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { loadSeason, seasonPaths } from './context.mjs'
import { checkCandidate } from './rules.mjs'

const season = process.argv[2]
function exitWith(failures) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}
if (!season) exitWith(['Usage: node scripts/storylines/add.mjs <season>'])

const { rawFile } = seasonPaths(season)
const additionsFile = rawFile.replace(/\.json$/, '.additions.json')
if (!existsSync(additionsFile)) exitWith([`No additions file at ${additionsFile}`])
const loaded = loadSeason(season)
if (loaded.failures) exitWith(loaded.failures)
const { raw, ctx } = loaded

const additions = JSON.parse(readFileSync(additionsFile, 'utf8'))
const guidance = additions.guidance ?? []
const candidates = (additions.candidates ?? []).map((c) => ({ ...c, status: 'pending' }))
const failures = []
const guidanceIds = raw.guidance.map((g) => g.id)
for (const topic of guidance) {
  if (guidanceIds.includes(topic.id)) failures.push(`guidance ${topic.id}: id already exists`)
  if (!topic.summary || !topic.origin || !Array.isArray(topic.teams)) failures.push(`guidance ${topic.id}: needs summary, origin, teams`)
  guidanceIds.push(topic.id)
}
const ids = raw.candidates.map((c) => c.id)
const urls = raw.candidates.map((c) => c.article.url)
for (const candidate of candidates) {
  failures.push(...checkCandidate(candidate, { ...ctx, guidanceIds }))
  if (ids.includes(candidate.id)) failures.push(`${candidate.id}: id already exists`)
  if (urls.includes(candidate.article?.url)) failures.push(`${candidate.id}: url already in the raw file`)
  ids.push(candidate.id)
  urls.push(candidate.article?.url)
}
if (failures.length) exitWith([...failures, 'Nothing was added; fix the additions file and run again'])

raw.guidance.push(...guidance)
raw.candidates = [...raw.candidates, ...candidates].toSorted((a, b) => a.eventDate.localeCompare(b.eventDate))
raw.updatedAt = new Date().toISOString().slice(0, 10)
writeFileSync(rawFile, `${JSON.stringify(raw, null, 2)}\n`)
rmSync(additionsFile)
console.log(`Added ${guidance.length} guidance topics and ${candidates.length} pending candidates to ${rawFile}`)
for (const c of candidates) console.log(`- ${c.id}: ${c.title} (${c.article.publisher})`)
