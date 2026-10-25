// Generates one AI summary per team per season into /data/processed/summaries from the scraped weekly write-ups.
// Run with `npm run build:summaries` after a weekly scrape, then `npm run build:rankings`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { loadSeasonEntries } from './lib/articles.mjs'
import { buildPromptInput, decide, hashInput } from './lib/summary-plan.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = join(root, 'data', 'raw')
const outDir = join(root, 'data', 'processed', 'summaries')

const MODEL = process.env.SUMMARY_MODEL || 'claude-haiku-5-5'
const MAX_SUMMARY_LENGTH = 1200
// Models that accept the server-side refusal fallback; others are sent without it
const FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']

const SYSTEM_PROMPT = [
  'You write short season recaps for a basketball power-rankings chart.',
  'You are given one NBA team\'s weekly power-rankings write-ups for one season, in order.',
  'Write a single paragraph of 80 to 120 words that tells the story of that team\'s season as those write-ups describe it: where it started, how its ranking and form moved, and where it stood at the end of the write-ups.',
  'Use only what the write-ups say. Do not add results, awards, trades, injuries or playoff outcomes that are not in them.',
  'Write in a neutral, factual tone in the tense the user message asks for.',
  'Reply with the paragraph only: no heading, no preamble, no bullet points, no line breaks.',
].join(' ')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const onlySeasons = args.flatMap((arg, i) => (arg === '--season' && args[i + 1] ? [args[i + 1]] : []))

const playoffs = JSON.parse(readFileSync(join(rawDir, 'playoffs.json'), 'utf8'))
const seasons = loadSeasonEntries(rawDir)
const unknown = onlySeasons.filter((s) => !seasons[s])
if (unknown.length) {
  console.error(`Unknown season(s): ${unknown.join(', ')}. Known: ${Object.keys(seasons).sort().join(', ')}`)
  process.exit(1)
}

class SummaryRejected extends Error {}

async function generate(client, { season, complete, entries }) {
  const input = buildPromptInput(entries)
  const tense = complete
    ? 'This season is over; write in the past tense.'
    : 'This season is still in progress; write in the present tense about where the team stands now.'
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    ...(FALLBACK_MODELS.includes(MODEL) && {
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    }),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Team: ${entries[0].teamName}\nSeason: ${season}\n${tense}\n\n${input}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal') throw new SummaryRejected('model declined the request')
  if (response.stop_reason === 'max_tokens') throw new SummaryRejected('response was cut off')
  const summary = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
  if (!summary) throw new SummaryRejected('empty summary')
  if (summary.includes('\n')) throw new SummaryRejected('summary is not a single paragraph')
  if (summary.length > MAX_SUMMARY_LENGTH)
    throw new SummaryRejected(`summary is ${summary.length} characters, over the ${MAX_SUMMARY_LENGTH} limit`)

  return {
    summary,
    sourceHash: hashInput(input),
    weeks: entries.length,
    model: response.model,
    generatedAt: new Date().toISOString(),
  }
}

function writeSeason(file, stored) {
  const sorted = Object.fromEntries(Object.keys(stored).sort().map((slug) => [slug, stored[slug]]))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`)
}

let client
let failed = 0

for (const season of Object.keys(seasons).sort()) {
  if (onlySeasons.length && !onlySeasons.includes(season)) continue

  const file = join(outDir, `${season}.json`)
  const stored = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
  const complete = Boolean(playoffs[season]?.champion)
  const counts = { generate: 0, 'skip-locked': 0, 'skip-unchanged': 0, 'skip-no-data': 0, failed: 0 }

  for (const slug of Object.keys(seasons[season].teams).sort()) {
    const entries = seasons[season].teams[slug]
    const action = decide({ entries, stored: stored[slug], complete })
    if (action !== 'generate' || dryRun) {
      counts[action] += 1
      continue
    }

    try {
      client ??= new Anthropic({ maxRetries: 4 })
      stored[slug] = await generate(client, { season, complete, entries })
      // Written after every team so an interrupted run resumes where it stopped
      writeSeason(file, stored)
      counts.generate += 1
    } catch (error) {
      const unauthorized =
        error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError
      // Anything that is neither an API response nor a rejected summary is a setup problem, e.g. no credentials
      if (unauthorized || !(error instanceof Anthropic.APIError || error instanceof SummaryRejected)) {
        console.error(`Cannot call the Anthropic API: ${error.message}`)
        console.error('Set ANTHROPIC_API_KEY and re-run. Nothing already stored was changed.')
        process.exit(1)
      } else if (error instanceof Anthropic.RateLimitError) {
        console.error(`${season} ${slug}: rate limited after retries; re-run later to pick it up`)
      } else if (error instanceof Anthropic.APIError) {
        console.error(`${season} ${slug}: API error ${error.status}: ${error.message}`)
      } else {
        console.error(`${season} ${slug}: ${error.message}`)
      }
      counts.failed += 1
      failed += 1
    }
  }

  const verb = dryRun ? 'would generate' : 'generated'
  console.log(
    `${season} (${complete ? 'complete' : 'active'}): ${verb} ${counts.generate}, ` +
      `skipped ${counts['skip-locked']} locked, ${counts['skip-unchanged']} unchanged, ` +
      `${counts['skip-no-data']} without data, failed ${counts.failed}`,
  )
}

process.exit(failed ? 1 : 0)
