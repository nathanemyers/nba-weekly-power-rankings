import { describe, expect, it } from 'vitest'
import { parseCoachesTable, parseStatsTable, slugForAbbr, teamCoaches, teamRosters } from './rosters.mjs'

// One player row the way Basketball-Reference prints it: rank in a <th>, every other stat in a <td>
function playerRow(id, name, cells) {
  const stats = Object.entries(cells)
    .map(([stat, value]) => `<td class="right " data-stat="${stat}" >${value}</td>`)
    .join(' ')
  return (
    `<tr ><th scope="row" class="right " data-stat="ranker" csk="1" >1</th> ` +
    `<td class="left " data-append-csv="${id}" data-stat="name_display" csk="x" ><a href="/players/x/${id}.html">${name}</a></td> ${stats}</tr>`
  )
}

const HEADER = '<tr><th aria-label="Rk" data-stat="ranker" scope="col">Rk</th><th data-stat="name_display" scope="col">Player</th></tr>'
const AVERAGE = '<tr class="norank" ><th scope="row" data-stat="ranker" ></th><td data-stat="name_display" >League Average</td><td data-stat="fg_pct" >.461</td></tr>'

function statsPage(id, rows, postRows = []) {
  return (
    `<div id="all_${id}"><table class="stats_table" id="${id}"><thead>${HEADER}</thead><tbody>${rows.join('\n')}${HEADER}${AVERAGE}</tbody></table></div>` +
    `<div id="all_${id}_post"><table class="stats_table" id="${id}_post"><tbody>${postRows.join('\n')}</tbody></table></div>`
  )
}

const GASOL_TOR = playerRow('gasolma01', 'Marc Gasol', {
  age: 34, team_name_abbr: '<a href="/teams/TOR/2019.html">TOR</a>', pos: 'C', games: 26, games_started: 19,
  mp_per_g: '24.9', fg_pct: '.465', pts_per_g: '9.1', awards: '',
})

describe('slugForAbbr', () => {
  it('maps current and historic abbreviations to app slugs', () => {
    const cases = {
      NJN: 'bkn', BRK: 'bkn', CHA: 'cha', CHO: 'cha', NOH: 'nop', NOK: 'nop', NOP: 'nop',
      SEA: 'okc', OKC: 'okc', PHO: 'phx', TOR: 'tor', GSW: 'gsw',
    }
    for (const [abbr, slug] of Object.entries(cases)) expect(slugForAbbr(abbr)).toBe(slug)
  })

  it('throws on an unknown abbreviation', () => {
    expect(() => slugForAbbr('XYZ')).toThrow(/Unknown team abbreviation.*XYZ/)
  })
})

describe('parseStatsTable', () => {
  it('reads each player row with every stat keyed by data-stat', () => {
    const [row] = parseStatsTable(statsPage('per_game_stats', [GASOL_TOR]), 'per_game_stats')
    expect(row).toEqual({
      playerId: 'gasolma01', ranker: 1, name_display: 'Marc Gasol', age: 34, team_name_abbr: 'TOR', pos: 'C',
      games: 26, games_started: 19, mp_per_g: 24.9, fg_pct: 0.465, pts_per_g: 9.1, awards: null,
    })
  })

  it('skips header and league average rows and ignores the playoff table', () => {
    const playoffRow = playerRow('gasolma01', 'Marc Gasol', { team_name_abbr: 'TOR', games: 24 })
    const rows = parseStatsTable(statsPage('per_game_stats', [GASOL_TOR], [playoffRow]), 'per_game_stats')
    expect(rows).toHaveLength(1)
    expect(rows[0].games).toBe(26)
  })

  it('stores blank cells as null and keeps negative numbers', () => {
    const row = playerRow('smithjo01', 'Joe Smith', { team_name_abbr: 'DET', games: 1, per: '', bpm: '-12.3' })
    const [parsed] = parseStatsTable(statsPage('advanced', [row]), 'advanced')
    expect(parsed.per).toBeNull()
    expect(parsed.bpm).toBe(-12.3)
  })

  it('finds a table hidden in an HTML comment', () => {
    const html = `<div id="all_advanced"><!--\n${statsPage('advanced', [GASOL_TOR])}\n--></div>`
    expect(parseStatsTable(html, 'advanced')).toHaveLength(1)
  })

  it('decodes HTML entities in names', () => {
    const row = playerRow('foxde01', 'De&#x27;Aaron Fox &amp; Co', { team_name_abbr: 'SAC', games: 1 })
    expect(parseStatsTable(statsPage('per_game_stats', [row]), 'per_game_stats')[0].name_display).toBe("De'Aaron Fox & Co")
  })

  it('throws when the table is missing or has no player rows', () => {
    expect(() => parseStatsTable('<html></html>', 'advanced')).toThrow(/advanced/)
    expect(() => parseStatsTable(statsPage('advanced', []), 'advanced')).toThrow(/advanced/)
  })
})

function coachRow(id, name, abbr, g, w, l) {
  return (
    `<tr ><td class="left " data-stat="coach" csk="x" ><a href='/coaches/${id}.html'>${name}</a></td>` +
    `<td class="left " data-stat="team" ><a href='/teams/${abbr}/2019.html'>${abbr}</a></td>` +
    `<td class="right " data-stat="seas_franch" >1</td>` +
    `<td class="right " data-stat="cur_g" >${g}</td><td class="right " data-stat="cur_w" >${w}</td><td class="right " data-stat="cur_l" >${l}</td>` +
    `<td class="right " data-stat="cur_g_p" ></td></tr>`
  )
}

function coachesPage(rows) {
  const header = '<tr><th data-stat="coach" scope="col">Coach</th><th data-stat="team" scope="col">Tm</th></tr>'
  return `<table class="stats_table" id="NBA_coaches"><thead>${header}</thead><tbody>${rows.join('\n')}</tbody></table>`
}

describe('parseCoachesTable', () => {
  it('reads coach rows in page order with ids, team and record', () => {
    const rows = parseCoachesTable(
      coachesPage([coachRow('hoibefr99c', 'Fred Hoiberg', 'CHI', 24, 5, 19), coachRow('boyleji02c', 'Jim Boylen', 'CHI', 58, 17, 41)]),
    )
    expect(rows).toEqual([
      { coachId: 'hoibefr99c', coach: 'Fred Hoiberg', team: 'CHI', seas_franch: 1, cur_g: 24, cur_w: 5, cur_l: 19, cur_g_p: null },
      { coachId: 'boyleji02c', coach: 'Jim Boylen', team: 'CHI', seas_franch: 1, cur_g: 58, cur_w: 17, cur_l: 41, cur_g_p: null },
    ])
  })

  it('throws when there are no coach rows', () => {
    expect(() => parseCoachesTable(coachesPage([]))).toThrow(/NBA_coaches/)
  })
})

// Raw rows as parseStatsTable returns them, with only the stats teamRosters reads
function perGameRow(playerId, name, abbr, games, extra = {}) {
  return {
    playerId, name_display: name, team_name_abbr: abbr, pos: 'SG', age: 25, games, games_started: 0, mp_per_g: 20.4,
    pts_per_g: 10.1, trb_per_g: 3.2, ast_per_g: 2.5, stl_per_g: 0.8, blk_per_g: 0.3, tov_per_g: 1.2, ...extra,
  }
}

const advancedRow = (playerId, abbr, games, mp, per = 15.1) => ({ playerId, team_name_abbr: abbr, games, mp, per })

function rawSeason(players) {
  return {
    perGame: players.map(([id, name, abbr, games, extra]) => perGameRow(id, name, abbr, games, extra)),
    advanced: players.map(([id, , abbr, games, extra]) => advancedRow(id, abbr, games, extra?.mp ?? games * 20, extra?.per)),
  }
}

describe('teamRosters', () => {
  it("builds each team's roster with the per-game stats and PER", () => {
    const rosters = teamRosters(rawSeason([['curryst01', 'Stephen Curry', 'GSW', 79, { pos: 'PG', age: 27, games_started: 79, per: 31.5 }]]), '2015-16')
    expect(rosters).toEqual({
      gsw: [
        {
          id: 'curryst01', name: 'Stephen Curry', pos: 'PG', age: 27, g: 79, gs: 79, mpg: 20.4,
          pts: 10.1, trb: 3.2, ast: 2.5, stl: 0.8, blk: 0.3, tov: 1.2, per: 31.5,
        },
      ],
    })
  })

  it('sorts by minutes per game, then games, then name', () => {
    const rosters = teamRosters(
      rawSeason([
        ['c', 'Cee', 'BOS', 10, { mp_per_g: 10 }],
        ['a', 'Ay', 'BOS', 50, { mp_per_g: 18 }],
        ['e', 'Eee', 'BOS', 30, { mp_per_g: 10 }],
        ['d', 'Dee', 'BOS', 5, { mp_per_g: 32.5 }],
        ['b', 'Bee', 'BOS', 10, { mp_per_g: 10 }],
      ]),
      '2010-11',
    )
    expect(rosters.bos.map((p) => p.name)).toEqual(['Dee', 'Ay', 'Eee', 'Bee', 'Cee'])
  })

  it('leaves summary rows for multi-team players out of every roster', () => {
    const raw = rawSeason([['gasolma01', 'Marc Gasol', 'MEM', 53], ['gasolma01', 'Marc Gasol', 'TOR', 26]])
    raw.perGame.unshift(perGameRow('gasolma01', 'Marc Gasol', '2TM', 79))
    raw.advanced.unshift(advancedRow('gasolma01', '2TM', 79, 1968))
    const rosters = teamRosters(raw, '2018-19')
    expect(Object.keys(rosters).sort()).toEqual(['mem', 'tor'])
    expect(rosters.tor[0].g).toBe(26)
  })

  it('keeps a blank PER as null', () => {
    const raw = rawSeason([['smithjo01', 'Joe Smith', 'DET', 1]])
    raw.advanced[0].per = null
    expect(teamRosters(raw, '2003-04').det[0].per).toBeNull()
  })

  it('allows a negative PER', () => {
    expect(teamRosters(rawSeason([['x', 'Ex', 'DET', 1, { per: -4.2 }]]), '2003-04').det[0].per).toBe(-4.2)
  })

  it('rejects a stint with no advanced row', () => {
    const raw = rawSeason([['x', 'Ex', 'DET', 3]])
    raw.advanced = []
    expect(() => teamRosters(raw, '2003-04')).toThrow(/2003-04 det Ex \(x\).*advanced/)
  })

  it('rejects a player with no games', () => {
    expect(() => teamRosters(rawSeason([['x', 'Ex', 'DET', 0]]), '2003-04')).toThrow(/2003-04 det Ex/)
  })

  it('rejects more starts than games', () => {
    expect(() => teamRosters(rawSeason([['x', 'Ex', 'DET', 2, { games_started: 3 }]]), '2003-04')).toThrow(/2003-04 det Ex/)
  })

  it('rejects a negative per-game value', () => {
    expect(() => teamRosters(rawSeason([['x', 'Ex', 'DET', 2, { pts_per_g: -1 }]]), '2003-04')).toThrow(/2003-04 det Ex.*pts/)
  })
})

// A multi-team player's rows: the summary row first, then each team in the order played
function tradedPlayer(id, name, stints) {
  const total = stints.reduce((sum, [, games]) => sum + games, 0)
  const summary = `${stints.length}TM`
  return {
    perGame: [perGameRow(id, name, summary, total), ...stints.map(([abbr, games]) => perGameRow(id, name, abbr, games))],
    advanced: [advancedRow(id, summary, total, total * 20), ...stints.map(([abbr, games]) => advancedRow(id, abbr, games, games * 20))],
  }
}

function merge(...raws) {
  return { perGame: raws.flatMap((r) => r.perGame), advanced: raws.flatMap((r) => r.advanced) }
}

const stint = (rosters, slug, id) => rosters[slug].find((p) => p.id === id)

describe('teamRosters mid-season moves', () => {
  it('marks a two-team player as leaving one team and joining the other', () => {
    const rosters = teamRosters(tradedPlayer('gasolma01', 'Marc Gasol', [['MEM', 53], ['TOR', 26]]), '2018-19')
    expect(stint(rosters, 'mem', 'gasolma01')).toMatchObject({ leftFor: 'tor' })
    expect(stint(rosters, 'mem', 'gasolma01').joinedFrom).toBeUndefined()
    expect(stint(rosters, 'tor', 'gasolma01')).toMatchObject({ joinedFrom: 'mem' })
    expect(stint(rosters, 'tor', 'gasolma01').leftFor).toBeUndefined()
  })

  it('follows page order rather than alphabetical order', () => {
    const rosters = teamRosters(tradedPlayer('valanjo01', 'Jonas Valančiūnas', [['TOR', 30], ['MEM', 19]]), '2018-19')
    expect(stint(rosters, 'tor', 'valanjo01')).toMatchObject({ leftFor: 'mem' })
    expect(stint(rosters, 'mem', 'valanjo01')).toMatchObject({ joinedFrom: 'tor' })
  })

  it('marks both moves on the middle stint of a three-team player', () => {
    const rosters = teamRosters(tradedPlayer('wallara01', 'Rasheed Wallace', [['POR', 45], ['ATL', 1], ['DET', 22]]), '2003-04')
    expect(stint(rosters, 'por', 'wallara01')).toMatchObject({ leftFor: 'atl' })
    expect(stint(rosters, 'atl', 'wallara01')).toMatchObject({ joinedFrom: 'por', leftFor: 'det' })
    expect(stint(rosters, 'det', 'wallara01')).toMatchObject({ joinedFrom: 'atl' })
  })

  it('leaves single-team players unmarked', () => {
    const rosters = teamRosters(merge(rawSeason([['lowryky01', 'Kyle Lowry', 'TOR', 65]]), tradedPlayer('gasolma01', 'Marc Gasol', [['MEM', 53], ['TOR', 26]])), '2018-19')
    expect(Object.keys(stint(rosters, 'tor', 'lowryky01'))).not.toContain('joinedFrom')
    expect(Object.keys(stint(rosters, 'tor', 'lowryky01'))).not.toContain('leftFor')
  })

  it("rejects stints whose games don't add up to the summary row", () => {
    const raw = tradedPlayer('gasolma01', 'Marc Gasol', [['MEM', 53], ['TOR', 26]])
    raw.perGame[0].games = 80
    expect(() => teamRosters(raw, '2018-19')).toThrow(/2018-19 Marc Gasol \(gasolma01\).*80/)
  })
})

const coach = (coachId, name, team, g, w, l) => ({ coachId, coach: name, team, cur_g: g, cur_w: w, cur_l: l, car_g: 500 })

describe('teamCoaches', () => {
  it("lists each team's head coaches in the order they coached", () => {
    const coaches = teamCoaches(
      { coaches: [coach('hoibefr99c', 'Fred Hoiberg', 'CHI', 24, 5, 19), coach('nurseni01c', 'Nick Nurse', 'TOR', 82, 58, 24), coach('boyleji02c', 'Jim Boylen', 'CHI', 58, 17, 41)] },
      '2018-19',
    )
    expect(coaches).toEqual({
      chi: [
        { id: 'hoibefr99c', name: 'Fred Hoiberg', g: 24, w: 5, l: 19 },
        { id: 'boyleji02c', name: 'Jim Boylen', g: 58, w: 17, l: 41 },
      ],
      tor: [{ id: 'nurseni01c', name: 'Nick Nurse', g: 82, w: 58, l: 24 }],
    })
  })

  it('maps historic team abbreviations', () => {
    expect(Object.keys(teamCoaches({ coaches: [coach('mcmilna01c', 'Nate McMillan', 'SEA', 82, 37, 45)] }, '2004-05'))).toEqual(['okc'])
  })

  it('rejects a coach with no games', () => {
    expect(() => teamCoaches({ coaches: [coach('x', 'Ex', 'CHI', 0, 0, 0)] }, '2018-19')).toThrow(/2018-19 chi Ex/)
  })

  it("rejects a record that doesn't add up to the games coached", () => {
    expect(() => teamCoaches({ coaches: [coach('x', 'Ex', 'CHI', 24, 5, 18)] }, '2018-19')).toThrow(/2018-19 chi Ex.*5-18/)
  })

  it('rejects a team whose coaches add up to more than 82 games', () => {
    const raw = { coaches: [coach('a', 'Ay', 'CHI', 50, 25, 25), coach('b', 'Bee', 'CHI', 40, 20, 20)] }
    expect(() => teamCoaches(raw, '2018-19')).toThrow(/2018-19 chi.*90 games/)
  })
})

describe('teamRosters awards', () => {
  it("keeps a player's season awards in Basketball-Reference order", () => {
    const rosters = teamRosters(rawSeason([['curryst01', 'Stephen Curry', 'GSW', 79, { awards: 'MVP-1,AS,NBA1' }]]), '2015-16')
    expect(rosters.gsw[0].awards).toEqual(['MVP-1', 'AS', 'NBA1'])
  })

  it('leaves awards off a player who earned none', () => {
    expect(Object.keys(teamRosters(rawSeason([['x', 'Ex', 'DET', 3]]), '2003-04').det[0])).not.toContain('awards')
  })

  it("puts a traded player's awards from the summary row on the team they finished with", () => {
    const raw = tradedPlayer('wallara01', 'Rasheed Wallace', [['POR', 45], ['ATL', 1], ['DET', 22]])
    raw.perGame[0].awards = 'AS'
    const rosters = teamRosters(raw, '2003-04')
    expect(stint(rosters, 'det', 'wallara01').awards).toEqual(['AS'])
    expect(stint(rosters, 'por', 'wallara01').awards).toBeUndefined()
    expect(stint(rosters, 'atl', 'wallara01').awards).toBeUndefined()
  })

  it('rejects an unknown award code', () => {
    expect(() => teamRosters(rawSeason([['x', 'Ex', 'DET', 3, { awards: 'AS,XYZ' }]]), '2003-04')).toThrow(/2003-04 det Ex.*XYZ/)
  })
})
