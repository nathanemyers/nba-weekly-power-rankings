// API for the storyline review tool: GET /__storylines lists seasons, GET and PUT /__storylines/<season>,
// POST /__storylines/<season>/more runs the skill's `more` phase for one section
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { loadSeason, root, seasonPaths } from '../../scripts/storylines/context.mjs'
import { checkFinalize, checkRaw } from '../../scripts/storylines/rules.mjs'

const ROUTE = /^\/__storylines(?:\/(\d{4}-\d{2})(\/more)?)?$/
const MAX_BUDGET_USD = '3'
const TIMEOUT_MS = 20 * 60 * 1000
const ADDITIONS = './data/raw/storylines/*.additions.json'
const ALLOWED_TOOLS = [
  'Skill', 'Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
  `Write(${ADDITIONS})`, `Edit(${ADDITIONS})`,
  'Bash(node scripts/storylines/section.mjs:*)',
  'Bash(node scripts/storylines/add.mjs:*)',
  'Bash(npm run check:storylines:*)',
]

// Seasons with a `more` run in progress, so saves cannot overwrite the agent's edits
const running = {}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function reviewState(season) {
  const loaded = loadSeason(season)
  if (loaded.failures) return { status: 404, payload: { failures: loaded.failures } }
  const { raw, ctx } = loaded
  return {
    status: 200,
    payload: {
      raw,
      teams: ctx.teams,
      playoffs: loaded.playoffs,
      finalized: existsSync(seasonPaths(season).processedFile),
      failures: checkRaw(raw, ctx),
      finalizeFailures: checkFinalize(raw, ctx),
      running: running[season] ?? null,
    },
  }
}

// Runs headless Claude Code on the skill and resolves with its JSON result
function runMore(season, section) {
  const args = [
    '-p', `/season-storylines ${season} more ${section}`,
    '--output-format', 'json',
    '--max-budget-usd', MAX_BUDGET_USD,
    '--no-session-persistence',
    '--allowedTools', ...ALLOWED_TOOLS,
  ]
  return new Promise((resolve) => {
    const child = spawn('claude', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS)
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('error', (error) => resolve({ error: `Could not start claude: ${error.message}` }))
    child.on('close', (code) => {
      clearTimeout(timer)
      try {
        const result = JSON.parse(stdout)
        resolve({ summary: result.result ?? '', costUsd: result.total_cost_usd, error: result.is_error ? result.result : undefined })
      } catch {
        resolve({ error: `claude exited with ${code}: ${(stderr || stdout).slice(-2000)}` })
      }
    })
  })
}

async function handleMore(req, res, season) {
  const { section } = JSON.parse(await readBody(req))
  const before = reviewState(season)
  if (before.status !== 200) return sendJson(res, before.status, before.payload)
  if (section !== 'season' && !before.payload.teams.includes(section))
    return sendJson(res, 400, { failures: [`Unknown section ${section}`] })
  if (running[season]) return sendJson(res, 409, { failures: [`Already finding more for ${running[season]}`] })
  const oldIds = before.payload.raw.candidates.map((c) => c.id)
  running[season] = section
  let outcome
  try {
    outcome = await runMore(season, section)
  } finally {
    delete running[season]
  }
  const after = reviewState(season)
  if (after.status !== 200) return sendJson(res, after.status, after.payload)
  const added = after.payload.raw.candidates.map((c) => c.id).filter((id) => !oldIds.includes(id))
  sendJson(res, 200, { ...after.payload, more: { section, added, ...outcome } })
}

export default function storylineReview() {
  return {
    name: 'storyline-review',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = ROUTE.exec((req.url ?? '').split('?')[0])
        if (!match) return next()
        const season = match[1]
        try {
          if (!season) {
            const files = readdirSync(dirname(seasonPaths('0000-00').rawFile))
            const seasons = files.filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, -5))
            return sendJson(res, 200, { seasons: seasons.sort() })
          }
          if (match[2]) {
            if (req.method !== 'POST') return sendJson(res, 405, { failures: ['POST only'] })
            return await handleMore(req, res, season)
          }
          if (req.method === 'PUT') {
            if (running[season])
              return sendJson(res, 409, { failures: [`Wait for the search for ${running[season]} to finish before saving`] })
            const raw = JSON.parse(await readBody(req))
            if (raw.season !== season || !Array.isArray(raw.candidates) || !Array.isArray(raw.guidance))
              return sendJson(res, 400, { failures: [`Body is not a ${season} candidates file`] })
            if (!existsSync(seasonPaths(season).rawFile))
              return sendJson(res, 404, { failures: [`No candidates file for ${season}`] })
            raw.updatedAt = new Date().toISOString().slice(0, 10)
            writeFileSync(seasonPaths(season).rawFile, `${JSON.stringify(raw, null, 2)}\n`)
          } else if (req.method !== 'GET') return sendJson(res, 405, { failures: ['GET or PUT only'] })
          const { status, payload } = reviewState(season)
          sendJson(res, status, payload)
        } catch (error) {
          sendJson(res, 500, { failures: [String(error)] })
        }
      })
    },
  }
}
