#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { scrape } from './scrape.mjs'
import { FIRST_SEASON, LAST_SEASON, parseSeasonRange } from './seasonRange.mjs'

function parseArgs(argv) {
  const args = { from: FIRST_SEASON, to: LAST_SEASON, outDir: '', delayMs: 1000, force: false }

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--from':
        args.from = argv[++i]
        break
      case '--to':
        args.to = argv[++i]
        break
      case '--out':
        args.outDir = argv[++i]
        break
      case '--delay-ms':
        args.delayMs = Number(argv[++i])
        break
      case '--force':
        args.force = true
        break
      case '--help':
        printHelp()
        process.exit(0)
        break
      default:
        console.error(`Unknown argument: ${argv[i]}`)
        printHelp()
        process.exit(1)
    }
  }

  return args
}

function printHelp() {
  console.log(`Usage: node scripts/espn-power-rankings-scraper/cli.mjs [options]

Options:
  --from <season>   First season to scrape (default: ${FIRST_SEASON})
  --to <season>     Last season to scrape (default: ${LAST_SEASON})
  --out <dir>       Output directory (default: data/raw/espn)
  --delay-ms <n>    Delay between requests to ESPN, in ms (default: 1000)
  --force           Re-fetch editions even if already saved
  --help            Show this help`)
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

async function main() {
  const args = parseArgs(process.argv.slice(2))

  let range
  try {
    range = parseSeasonRange(args.from, args.to)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  await scrape({
    ...range,
    outDir: args.outDir || path.join(root, 'data', 'raw', 'espn'),
    delayMs: args.delayMs,
    force: args.force,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
