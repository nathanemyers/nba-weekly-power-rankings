// Usage: node scripts/storylines/section.mjs <season> <team|season>
// Prints what the skill needs to find more storylines for one section, without reading whole files
import { readFileSync } from 'node:fs'
import { loadSeason, seasonPaths } from './context.mjs'
import { seasonWindow } from './rules.mjs'

const [season, section] = process.argv.slice(2)
if (!season || !section) {
  console.error('Usage: node scripts/storylines/section.mjs <season> <team|season>')
  process.exit(1)
}

const loaded = loadSeason(season)
if (loaded.failures) {
  for (const failure of loaded.failures) console.error(failure)
  process.exit(1)
}
const { raw, ctx } = loaded
if (section !== 'season' && !ctx.teams.includes(section)) {
  console.error(`Unknown section ${section}; use a team code or "season"`)
  process.exit(1)
}

const seasonData = JSON.parse(readFileSync(seasonPaths(season).seasonFile, 'utf8'))
const window = seasonWindow(season, ctx.draftDates)
const inSection = (teams, featured) => (section === 'season' ? featured || !teams.length : teams.includes(section))

console.log(`# ${season} · ${section}`)
console.log(`Window: ${window?.start} .. ${window?.end}`)
console.log(`Approved domains: ${ctx.sources.publishers.flatMap((p) => p.domains).join(', ')}`)

console.log('\n## Existing candidates (any status; do not re-add these stories or URLs)')
for (const c of raw.candidates)
  if (inSection(c.teams, c.featured || c.kind === 'season'))
    console.log(`- [${c.status}] ${c.eventDate} ${c.id}: ${c.title} | ${c.article.url}`)

console.log('\n## Existing guidance topics')
for (const g of raw.guidance)
  if (inSection(g.teams, g.origin === 'retrospective' || g.origin === 'theme'))
    console.log(`- ${g.id} (${g.origin}): ${g.summary}`)

if (section === 'season') {
  console.log('\n## Playoff results')
  for (const [team, stage] of Object.entries(seasonData.playoffs ?? {})) console.log(`- ${team}: ${stage}`)
} else {
  console.log(`\n## Playoffs: ${seasonData.playoffs?.[section] ?? 'did not make the playoffs'}`)
  for (const s of seasonData.playoffSeries?.[section] ?? [])
    console.log(`- ${s.round} vs ${s.opponent}: ${s.wins}-${s.losses}`)
  console.log('\n## Awards (codes ending -1 are winners)')
  for (const player of seasonData.rosters?.[section] ?? [])
    if (player.awards?.length) console.log(`- ${player.name}: ${player.awards.join(', ')}`)
  console.log('\n## Weekly blurbs')
  for (const week of seasonData.rankings[section])
    console.log(`- W${week.week} (#${week.rank}): ${week.summary ?? ''}`)
}
