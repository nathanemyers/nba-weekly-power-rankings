// Parses Basketball-Reference playoff pages into the bracket format stored in data/raw/basketball-reference/playoffs.json.
// Team names as they appear on Basketball-Reference, including relocated and renamed franchises, mapped to the slugs in src/types/nba.ts
export const SLUG_BY_NAME = {
  'Atlanta Hawks': 'atl', 'Boston Celtics': 'bos', 'Brooklyn Nets': 'bkn', 'New Jersey Nets': 'bkn',
  'Charlotte Hornets': 'cha', 'Charlotte Bobcats': 'cha', 'Chicago Bulls': 'chi',
  'Cleveland Cavaliers': 'cle', 'Dallas Mavericks': 'dal', 'Denver Nuggets': 'den',
  'Detroit Pistons': 'det', 'Golden State Warriors': 'gsw', 'Houston Rockets': 'hou',
  'Indiana Pacers': 'ind', 'Los Angeles Clippers': 'lac', 'Los Angeles Lakers': 'lal',
  'Memphis Grizzlies': 'mem', 'Miami Heat': 'mia', 'Milwaukee Bucks': 'mil',
  'Minnesota Timberwolves': 'min', 'New Orleans Pelicans': 'nop', 'New Orleans Hornets': 'nop',
  'New Orleans/Oklahoma City Hornets': 'nop', 'New York Knicks': 'nyk',
  'Oklahoma City Thunder': 'okc', 'Seattle SuperSonics': 'okc', 'Orlando Magic': 'orl',
  'Philadelphia 76ers': 'phi', 'Phoenix Suns': 'phx', 'Portland Trail Blazers': 'por',
  'Sacramento Kings': 'sac', 'San Antonio Spurs': 'sas', 'Toronto Raptors': 'tor',
  'Utah Jazz': 'uta', 'Washington Wizards': 'was',
}

export const ROUND_BY_HEADER = {
  'East Conf 1st Round': 'first-round',
  'West Conf 1st Round': 'first-round',
  'East Conf Semis': 'semis',
  'West Conf Semis': 'semis',
  'East Conf Finals': 'conf-finals',
  'West Conf Finals': 'conf-finals',
  Finals: 'finals',
}

export function slugFor(name) {
  const slug = SLUG_BY_NAME[name.trim()]
  if (!slug) throw new Error(`Unknown team name on Basketball-Reference: "${name}"`)
  return slug
}

export function parseSeason(html) {
  // The bracket is printed twice (desktop and mobile); the first copy is enough
  const bracketStart = html.indexOf('listhead"><strong>East Conf 1st Round')
  const bracketEnd = html.indexOf('Player Stats', bracketStart)
  const bracket = html.slice(bracketStart, bracketEnd)

  const rounds = []
  for (const [, header, list] of bracket.matchAll(/listhead"><strong>([^<]+)<\/strong><\/p>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)) {
    const stage = ROUND_BY_HEADER[header.trim()]
    if (!stage) continue
    const series = [...list.matchAll(/<a href="\/playoffs\/[^"]*">([^<]+?) vs\. ([^<]+?)<\/a>/g)].map(
      ([, a, b]) => [slugFor(a), slugFor(b)],
    )
    rounds.push({ stage, series })
  }

  const championName = html.match(/League Champion<\/strong>: <a[^>]*>([^<]+)<\/a>/)?.[1]
  if (!championName) throw new Error('No league champion found on page')
  const champion = slugFor(championName)

  // A team advanced if it shows up in the next stage (both conferences). The Finals winner comes from the champion line
  const NEXT_STAGE = { 'first-round': 'semis', semis: 'conf-finals', 'conf-finals': 'finals' }
  const scores = parseSeriesScores(html)
  const resultRounds = rounds.map((round) => {
    const nextStage = NEXT_STAGE[round.stage]
    const advanced = {}
    for (const slug of rounds.filter((r) => r.stage === nextStage).flatMap((r) => r.series.flat())) advanced[slug] = true
    return {
      round: round.stage,
      series: round.series.map(([a, b]) => {
        const winner = round.stage === 'finals' ? champion : advanced[a] ? a : b
        const score = scores.find((s) => s.stage === round.stage && [s.winner, s.loser].sort().join() === [a, b].sort().join())
        if (!score) throw new Error(`No series score for ${a} vs ${b} in ${round.stage}`)
        if (score.winner !== winner) throw new Error(`Series winner mismatch for ${a} vs ${b}`)
        return { teams: [a, b], winner, winnerWins: score.winnerWins, loserWins: score.loserWins }
      }),
    }
  })

  const finals = resultRounds.find((r) => r.round === 'finals')?.series[0]
  const runnerUp = finals?.teams.find((slug) => slug !== champion)
  return { champion, runnerUp, rounds: resultRounds }
}

const STAGE_BY_LABEL = {
  'Eastern Conference First Round': 'first-round',
  'Western Conference First Round': 'first-round',
  'Eastern Conference Semifinals': 'semis',
  'Western Conference Semifinals': 'semis',
  'Eastern Conference Finals': 'conf-finals',
  'Western Conference Finals': 'conf-finals',
  Finals: 'finals',
}

/** Reads "Winner over Loser (4-2)" rows from the page's series table. */
export function parseSeriesScores(html) {
  const start = html.indexOf('id="all_all_playoffs"')
  if (start === -1) return []
  const end = html.indexOf('id="all_advanced_team"', start)
  const table = html.slice(start, end === -1 ? undefined : end)

  const scores = []
  for (const [, row] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    if (!/<\/a>\s*over\s*<a/.test(row)) continue
    const stage = STAGE_BY_LABEL[row.match(/<strong>([^<]+)<\/strong>/)?.[1].trim()]
    const teams = [...row.matchAll(/<a [^>]*>([^<]+)<\/a>\s*(?:over|&nbsp;)/g)].map((m) => m[1])
    const score = row.match(/\((\d)-(\d)\)/)
    if (!stage || teams.length < 2 || !score) continue
    scores.push({
      stage,
      winner: slugFor(teams[0]),
      loser: slugFor(teams[1]),
      winnerWins: Number(score[1]),
      loserWins: Number(score[2]),
    })
  }
  return scores
}

export function hasSeriesScores(season) {
  return season.rounds.every((r) =>
    r.series.every((s) => Number.isInteger(s.winnerWins) && Number.isInteger(s.loserWins))
  )
}

const ROUND_ORDER = ['first-round', 'semis', 'conf-finals', 'finals']
const SERIES_PER_ROUND = { 'first-round': 8, semis: 4, 'conf-finals': 2, finals: 1 }

/** Turns a season's bracket into each team's series in round order, from that team's side, and checks it is a valid run. */
export function teamPlayoffRuns(bracket, season) {
  const runs = {}
  const counts = {}
  for (const round of bracket.rounds) {
    for (const series of round.series) {
      const [a, b] = series.teams
      const name = `${season} ${round.round} ${a} vs ${b}`
      if (!series.teams.includes(series.winner)) throw new Error(`${name}: winner ${series.winner} is not in the series`)
      if (series.winnerWins !== 4 || !(series.loserWins >= 0 && series.loserWins <= 3)) {
        throw new Error(`${name}: impossible score ${series.winnerWins}-${series.loserWins}`)
      }
      counts[round.round] = (counts[round.round] ?? 0) + 1
      for (const team of series.teams) {
        const won = team === series.winner
        ;(runs[team] ??= []).push({
          round: round.round,
          opponent: team === a ? b : a,
          wins: won ? series.winnerWins : series.loserWins,
          losses: won ? series.loserWins : series.winnerWins,
        })
      }
    }
  }

  if (bracket.champion) {
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
    const shapeOk = ROUND_ORDER.every((round) => counts[round] === SERIES_PER_ROUND[round])
    if (total !== 15 || !shapeOk) throw new Error(`${season}: a completed season needs 15 series (8/4/2/1), found ${total}`)
  }

  for (const team of Object.keys(runs).sort()) {
    const run = runs[team].sort((x, y) => ROUND_ORDER.indexOf(x.round) - ROUND_ORDER.indexOf(y.round))
    run.forEach((entry, i) => {
      const last = i === run.length - 1
      if (i > 0 && ROUND_ORDER.indexOf(entry.round) <= ROUND_ORDER.indexOf(run[i - 1].round)) {
        throw new Error(`${season} ${team}: two series in ${entry.round}`)
      }
      if (!last && entry.wins !== 4) throw new Error(`${season} ${team}: keeps playing after losing in ${entry.round}`)
      if (last && entry.wins === 4 && entry.round !== 'finals' && bracket.champion) {
        throw new Error(`${season} ${team}: won ${entry.round} but has no next series`)
      }
    })
    const wonFinals = run.at(-1).round === 'finals' && run.at(-1).wins === 4
    if (bracket.champion && wonFinals !== (team === bracket.champion)) {
      throw new Error(`${season} ${team}: Finals result disagrees with champion ${bracket.champion}`)
    }
  }
  return runs
}
