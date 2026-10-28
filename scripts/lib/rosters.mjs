// Parses Basketball-Reference league per-game, advanced and coaches pages into data/raw/basketball-reference/rosters/, and turns that raw data into app rosters.
// Basketball-Reference team abbreviations, including relocated and renamed franchises, mapped to the slugs in src/types/nba.ts
export const SLUG_BY_ABBR = {
  ATL: 'atl', BOS: 'bos', BRK: 'bkn', NJN: 'bkn', CHA: 'cha', CHO: 'cha', CHH: 'cha', CHI: 'chi',
  CLE: 'cle', DAL: 'dal', DEN: 'den', DET: 'det', GSW: 'gsw', HOU: 'hou', IND: 'ind', LAC: 'lac',
  LAL: 'lal', MEM: 'mem', MIA: 'mia', MIL: 'mil', MIN: 'min', NOP: 'nop', NOH: 'nop', NOK: 'nop',
  NYK: 'nyk', OKC: 'okc', SEA: 'okc', ORL: 'orl', PHI: 'phi', PHO: 'phx', POR: 'por', SAC: 'sac',
  SAS: 'sas', TOR: 'tor', UTA: 'uta', WAS: 'was',
}

export function slugForAbbr(abbr) {
  const slug = SLUG_BY_ABBR[abbr]
  if (!slug) throw new Error(`Unknown team abbreviation on Basketball-Reference: "${abbr}"`)
  return slug
}

const TEXT_STATS = ['name_display', 'pos', 'team_name_abbr', 'awards', 'coach', 'team']

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function cellValue(stat, inner) {
  const text = decodeEntities(inner.replace(/<[^>]*>/g, '')).trim()
  if (text === '') return null
  if (!TEXT_STATS.includes(stat) && /^-?(\d+\.?\d*|\.\d+)$/.test(text)) return Number(text)
  return text
}

// Rows of one table, cut at its own </table> so the playoff table that follows is never read
function tableRows(html, tableId) {
  const uncommented = html.replace(/<!--|-->/g, '')
  const start = uncommented.indexOf(`id="${tableId}"`)
  if (start === -1) throw new Error(`No table "${tableId}" on page`)
  const table = uncommented.slice(start, uncommented.indexOf('</table>', start))
  return [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1])
}

function rowCells(row) {
  const cells = {}
  for (const [, , attrs, inner] of row.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const stat = attrs.match(/data-stat="([^"]+)"/)?.[1]
    if (stat) cells[stat] = cellValue(stat, inner)
  }
  return cells
}

/** Reads every player row of a stats table, keyed by data-stat, with the player's id. */
export function parseStatsTable(html, tableId) {
  const rows = []
  for (const row of tableRows(html, tableId)) {
    const playerId = row.match(/data-append-csv="([^"]+)"/)?.[1]
    if (playerId) rows.push({ playerId, ...rowCells(row) })
  }
  if (rows.length === 0) throw new Error(`No player rows in table "${tableId}"`)
  return rows
}

/** Reads every coach-team row of the league coaches table in page order, which is the order they coached each team. */
export function parseCoachesTable(html) {
  const rows = []
  for (const row of tableRows(html, 'NBA_coaches')) {
    const coachId = row.match(/href=['"]\/coaches\/([^'".]+)\.html/)?.[1]
    if (!coachId) continue
    const team = row.match(/href=['"]\/teams\/([A-Z0-9]+)\//)?.[1]
    rows.push({ coachId, ...rowCells(row), team })
  }
  if (rows.length === 0) throw new Error('No coach rows in table "NBA_coaches"')
  return rows
}

const isSummaryRow = (abbr) => /^(\dTM|TOT)$/.test(abbr)

const PER_GAME_FIELDS = {
  mpg: 'mp_per_g', pts: 'pts_per_g', trb: 'trb_per_g', ast: 'ast_per_g', stl: 'stl_per_g', blk: 'blk_per_g', tov: 'tov_per_g',
}

// Basketball-Reference award codes: a voting finish such as MVP-1, or a selection such as AS or NBA1
const AWARD_PATTERN = /^((MVP|DPOY|ROY|6MOY|MIP|CPOY)-\d+|AS|NBA[123]|DEF[12])$/

function seasonAwards(text, name) {
  if (!text) return []
  const awards = text.split(',').map((award) => award.trim())
  for (const award of awards) {
    if (!AWARD_PATTERN.test(award)) throw new Error(`${name}: unknown award "${award}"`)
  }
  return awards
}

/** Turns a raw season into each team's roster for the app, sorted by minutes per game, then games, then name, and checks every entry. */
export function teamRosters(raw, season) {
  const advancedByStint = {}
  for (const row of raw.advanced) {
    if (!isSummaryRow(row.team_name_abbr)) advancedByStint[`${row.playerId}|${row.team_name_abbr}`] = row
  }

  // Each player's team rows in page order, which is the order they played for them
  const stintsByPlayer = {}
  const summaryGames = {}
  // A multi-team player's awards are only on their summary row
  const summaryAwards = {}
  for (const row of raw.perGame) {
    if (isSummaryRow(row.team_name_abbr)) {
      summaryGames[row.playerId] = row.games
      summaryAwards[row.playerId] = row.awards
    } else (stintsByPlayer[row.playerId] ??= []).push(row.team_name_abbr)
  }
  for (const [playerId, games] of Object.entries(summaryGames)) {
    const rows = raw.perGame.filter((row) => row.playerId === playerId && !isSummaryRow(row.team_name_abbr))
    const total = rows.reduce((sum, row) => sum + row.games, 0)
    if (total !== games) throw new Error(`${season} ${rows[0]?.name_display} (${playerId}): team stints add up to ${total} games, not ${games}`)
  }

  const rosters = {}
  for (const row of raw.perGame) {
    if (isSummaryRow(row.team_name_abbr)) continue
    const slug = slugForAbbr(row.team_name_abbr)
    const name = `${season} ${slug} ${row.name_display} (${row.playerId})`
    const advanced = advancedByStint[`${row.playerId}|${row.team_name_abbr}`]
    if (!advanced) throw new Error(`${name}: no advanced stats row`)
    if (!(row.games >= 1)) throw new Error(`${name}: ${row.games} games`)
    if (!(row.games_started >= 0 && row.games_started <= row.games)) {
      throw new Error(`${name}: ${row.games_started} starts in ${row.games} games`)
    }

    const entry = {
      id: row.playerId, name: row.name_display, pos: row.pos ?? '', age: row.age, g: row.games, gs: row.games_started,
    }
    for (const [field, stat] of Object.entries(PER_GAME_FIELDS)) {
      const value = row[stat] ?? 0
      if (value < 0) throw new Error(`${name}: negative ${field} ${value}`)
      entry[field] = value
    }
    entry.per = advanced.per ?? null
    const stints = stintsByPlayer[row.playerId]
    const index = stints.indexOf(row.team_name_abbr)
    if (stints.lastIndexOf(row.team_name_abbr) !== index) throw new Error(`${name}: two rows for one team`)
    if (index > 0) entry.joinedFrom = slugForAbbr(stints[index - 1])
    if (index < stints.length - 1) entry.leftFor = slugForAbbr(stints[index + 1])
    // Season awards go on the team the player finished the season with
    else {
      const awards = seasonAwards(row.playerId in summaryAwards ? summaryAwards[row.playerId] : row.awards, name)
      if (awards.length) entry.awards = awards
    }
    ;(rosters[slug] ??= []).push(entry)
  }

  for (const slug of Object.keys(rosters)) {
    rosters[slug].sort((a, b) => b.mpg - a.mpg || b.g - a.g || a.name.localeCompare(b.name))
  }
  return rosters
}

/** Turns a raw season's coach rows into each team's head coaches in the order they coached, with their record for that team, and checks them. */
export function teamCoaches(raw, season) {
  const coaches = {}
  for (const row of raw.coaches) {
    const slug = slugForAbbr(row.team)
    const name = `${season} ${slug} ${row.coach} (${row.coachId})`
    if (!(row.cur_g >= 1)) throw new Error(`${name}: ${row.cur_g} games`)
    if (row.cur_w + row.cur_l !== row.cur_g) throw new Error(`${name}: ${row.cur_w}-${row.cur_l} in ${row.cur_g} games`)
    ;(coaches[slug] ??= []).push({ id: row.coachId, name: row.coach, g: row.cur_g, w: row.cur_w, l: row.cur_l })
  }
  for (const [slug, stints] of Object.entries(coaches)) {
    const games = stints.reduce((sum, stint) => sum + stint.g, 0)
    if (games > 82) throw new Error(`${season} ${slug}: head coaches add up to ${games} games`)
  }
  return coaches
}
