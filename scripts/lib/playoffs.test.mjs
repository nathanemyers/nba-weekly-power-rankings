import { describe, expect, it } from 'vitest'
import { hasSeriesScores, parseSeason, parseSeriesScores, teamPlayoffRuns } from './playoffs.mjs'

const NAMES = {
  was: 'Washington Wizards', cle: 'Cleveland Cavaliers', det: 'Detroit Pistons', mia: 'Miami Heat',
  mem: 'Memphis Grizzlies', dal: 'Dallas Mavericks', sas: 'San Antonio Spurs', phx: 'Phoenix Suns',
}

// One series per bracket header, written loser-first the way the bracket menu lists them
const BRACKET = [
  ['East Conf 1st Round', 'Eastern Conference First Round', 'was', 'cle', '4-2'],
  ['West Conf 1st Round', 'Western Conference First Round', 'mem', 'dal', '4-0'],
  ['East Conf Semis', 'Eastern Conference Semifinals', 'cle', 'det', '4-3'],
  ['West Conf Semis', 'Western Conference Semifinals', 'sas', 'dal', '4-3'],
  ['East Conf Finals', 'Eastern Conference Finals', 'det', 'mia', '4-2'],
  ['West Conf Finals', 'Western Conference Finals', 'phx', 'dal', '4-2'],
  ['Finals', 'Finals', 'dal', 'mia', '4-2'],
]

function page({ scores = BRACKET, champion = 'mia' } = {}) {
  const menu = BRACKET.map(
    ([header, , a, b]) =>
      `<p class="listhead"><strong>${header}</strong></p>\n<ul class="">\n<li><a href="/" ><a href="/playoffs/x.html">${NAMES[a]} vs. ${NAMES[b]}</a>\n</a></li>\n</ul>\n`,
  ).join('')
  const rows = scores
    .map(
      ([, label, loser, winner, score]) =>
        `<tr><td><span class='tooltip opener'><strong>${label}</strong></span></td>` +
        `<td><a href='/teams/X/2006.html'>${NAMES[winner]}</a> over <a href='/teams/Y/2006.html'>${NAMES[loser]}</a> &nbsp;(${score}) </td>` +
        `<td><a href='/x.html'>Series Stats</a></td></tr>\n<tr><td>Game 1</td><td>${NAMES[winner]}</td><td>99</td></tr>\n`,
    )
    .join('')
  return (
    `<html><div>${menu}<p>Player Stats</p></div>` +
    `<p><strong>League Champion</strong>: <a href="/teams/MIA/2006.html">${NAMES[champion]}</a></p>` +
    `<div id="all_all_playoffs"><table>${rows}</table></div><div id="all_advanced_team"></div></html>`
  )
}

describe('parseSeriesScores', () => {
  it('reads every series row with its stage and score', () => {
    const scores = parseSeriesScores(page())
    expect(scores).toHaveLength(7)
    expect(scores[0]).toEqual({ stage: 'first-round', winner: 'cle', loser: 'was', winnerWins: 4, loserWins: 2 })
    expect(scores.map((s) => s.stage)).toEqual([
      'first-round', 'first-round', 'semis', 'semis', 'conf-finals', 'conf-finals', 'finals',
    ])
    expect(scores[6]).toMatchObject({ winner: 'mia', loser: 'dal', winnerWins: 4, loserWins: 2 })
  })
})

describe('parseSeason', () => {
  it('adds each series score to the bracket', () => {
    const season = parseSeason(page())
    expect(season.champion).toBe('mia')
    expect(season.rounds[0].series[0]).toEqual({ teams: ['was', 'cle'], winner: 'cle', winnerWins: 4, loserWins: 2 })
    expect(season.rounds.every((r) => r.series.every((s) => s.winnerWins === 4))).toBe(true)
  })

  it('throws when a bracket series has no score', () => {
    expect(() => parseSeason(page({ scores: BRACKET.slice(1) }))).toThrow(/was vs cle/)
  })

  it('throws when the score table disagrees with the bracket winner', () => {
    const flipped = BRACKET.map((row, i) => (i === 0 ? [row[0], row[1], 'cle', 'was', '4-2'] : row))
    expect(() => parseSeason(page({ scores: flipped }))).toThrow(/winner mismatch/)
  })
})

describe('hasSeriesScores', () => {
  it('is true only when every series has both scores', () => {
    const scored = { rounds: [{ round: 'finals', series: [{ teams: ['a', 'b'], winner: 'a', winnerWins: 4, loserWins: 1 }] }] }
    const unscored = { rounds: [{ round: 'finals', series: [{ teams: ['a', 'b'], winner: 'a' }] }] }
    expect(hasSeriesScores(scored)).toBe(true)
    expect(hasSeriesScores(unscored)).toBe(false)
  })
})

// A complete 15-series bracket where the first team listed in each pair wins
function completeBracket() {
  const series = (pairs, loserWins = 1) => pairs.map(([a, b]) => ({ teams: [a, b], winner: a, winnerWins: 4, loserWins }))
  return {
    champion: 'bos',
    runnerUp: 'lal',
    rounds: [
      { round: 'first-round', series: series([['bos', 'atl'], ['cle', 'bkn'], ['det', 'cha'], ['mia', 'chi']], 0) },
      { round: 'first-round', series: series([['lal', 'dal'], ['sas', 'den'], ['phx', 'gsw'], ['okc', 'hou']], 3) },
      { round: 'semis', series: series([['bos', 'cle'], ['det', 'mia']], 2) },
      { round: 'semis', series: series([['lal', 'sas'], ['phx', 'okc']], 2) },
      { round: 'conf-finals', series: series([['bos', 'det']], 3) },
      { round: 'conf-finals', series: series([['lal', 'phx']], 1) },
      { round: 'finals', series: series([['bos', 'lal']], 2) },
    ],
  }
}

describe('teamPlayoffRuns', () => {
  it("lists each team's series in round order from its point of view", () => {
    const runs = teamPlayoffRuns(completeBracket(), '2007-08')
    expect(Object.keys(runs)).toHaveLength(16)
    expect(runs.bos).toEqual([
      { round: 'first-round', opponent: 'atl', wins: 4, losses: 0 },
      { round: 'semis', opponent: 'cle', wins: 4, losses: 2 },
      { round: 'conf-finals', opponent: 'det', wins: 4, losses: 3 },
      { round: 'finals', opponent: 'lal', wins: 4, losses: 2 },
    ])
    expect(runs.lal.at(-1)).toEqual({ round: 'finals', opponent: 'bos', wins: 2, losses: 4 })
    expect(runs.dal).toEqual([{ round: 'first-round', opponent: 'lal', wins: 3, losses: 4 }])
  })

  it('rejects a series whose winner did not win four games', () => {
    const bracket = completeBracket()
    bracket.rounds[0].series[0].winnerWins = 3
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*bos vs atl/)
  })

  it('rejects a loser with four or more wins', () => {
    const bracket = completeBracket()
    bracket.rounds[0].series[0].loserWins = 4
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*bos vs atl/)
  })

  it('rejects a winner that is not in the series', () => {
    const bracket = completeBracket()
    bracket.rounds[0].series[0].winner = 'nyk'
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*bos vs atl/)
  })

  it('rejects a completed season without 15 series', () => {
    const bracket = completeBracket()
    bracket.rounds[0].series.pop()
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*15 series/)
  })

  it('rejects a team that keeps playing after losing a series', () => {
    const bracket = completeBracket()
    bracket.rounds[2].series[0].teams = ['bos', 'atl']
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*atl/)
  })

  it('rejects a Finals winner that is not the champion', () => {
    const bracket = completeBracket()
    bracket.champion = 'lal'
    expect(() => teamPlayoffRuns(bracket, '2007-08')).toThrow(/2007-08.*champion/)
  })
})
