// API for the storyline review tool: GET /__storylines lists seasons, GET and PUT /__storylines/<season>
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { loadSeason, seasonPaths } from '../../scripts/storylines/context.mjs'
import { checkFinalize, checkRaw } from '../../scripts/storylines/rules.mjs'

const ROUTE = /^\/__storylines(?:\/(\d{4}-\d{2}))?$/

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
    },
  }
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
          if (req.method === 'PUT') {
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
