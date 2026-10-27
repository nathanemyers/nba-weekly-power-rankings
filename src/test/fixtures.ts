import {
  PlayoffStage,
  Team,
  type CoachStint,
  type RosterEntry,
  type SeriesResult,
  type TeamRankings,
  type WeekRanking,
} from 'types'

export function weeklyRankings(maxWeek: number, rank: number): WeekRanking[] {
  return Array.from({ length: maxWeek }, (_, i) => ({
    week: i + 1,
    rank,
    record: `${i}-0`,
    summary: `Week ${i + 1} summary`,
  }))
}

// Boston is the champion, the Lakers miss week 10, Detroit changes rank after week 1
export function buildRankings(maxWeek: number): Record<string, WeekRanking[]> {
  return {
    [Team.Boston]: weeklyRankings(maxWeek, 1),
    [Team.LALakers]: weeklyRankings(maxWeek, 5).filter((r) => r.week !== 10),
    [Team.Miami]: weeklyRankings(maxWeek, 10),
    [Team.Detroit]: weeklyRankings(maxWeek, 20).map((r) =>
      r.week === 1 ? { ...r, rank: 15 } : r
    ),
  }
}

// After week 2 (week 1 is preseason) Indiana rises 17 places, Miami rises 10 and Memphis falls 13
export function buildSwingRankings(
  maxWeek: number
): Record<string, WeekRanking[]> {
  return {
    [Team.Boston]: weeklyRankings(maxWeek, 1),
    [Team.Indiana]: weeklyRankings(maxWeek, 9).map((r) =>
      r.week <= 2 ? { ...r, rank: 26 } : r
    ),
    [Team.Miami]: weeklyRankings(maxWeek, 10).map((r) =>
      r.week <= 2 ? { ...r, rank: 20 } : r
    ),
    [Team.Memphis]: weeklyRankings(maxWeek, 29).map((r) =>
      r.week <= 2 ? { ...r, rank: 16 } : r
    ),
  }
}

export const PLAYOFFS = {
  [Team.Boston]: PlayoffStage.Champion,
  [Team.Miami]: PlayoffStage.SecondRound,
}

// Boston's title run and Miami's second-round exit, consistent with PLAYOFFS
export const PLAYOFF_SERIES: Partial<Record<Team, SeriesResult[]>> = {
  [Team.Boston]: [
    { round: PlayoffStage.FirstRound, opponent: Team.Detroit, wins: 4, losses: 0 },
    { round: PlayoffStage.SecondRound, opponent: Team.Miami, wins: 4, losses: 2 },
    { round: PlayoffStage.ConferenceFinals, opponent: Team.Toronto, wins: 4, losses: 3 },
    { round: PlayoffStage.Finals, opponent: Team.LALakers, wins: 4, losses: 1 },
  ],
  [Team.Miami]: [
    { round: PlayoffStage.FirstRound, opponent: Team.Orlando, wins: 4, losses: 3 },
    { round: PlayoffStage.SecondRound, opponent: Team.Boston, wins: 2, losses: 4 },
  ],
}

const player = (id: string, name: string, g: number, extra: Partial<RosterEntry> = {}): RosterEntry => ({
  id, name, pos: 'SF', age: 27, g, gs: 0, mpg: 20, pts: 10, trb: 4, ast: 2, stl: 1, blk: 0.5, tov: 1.5, per: 15, ...extra,
})

// Boston's roster, already in games-played order the way the build writes it
export const ROSTERS: Partial<Record<Team, RosterEntry[]>> = {
  [Team.Boston]: [
    player('piercpa01', 'Paul Pierce', 80, { pos: 'SF', age: 30, gs: 80, mpg: 35.9, pts: 19.6, trb: 5.1, ast: 4.5, stl: 1.3, tov: 2.9, per: 19.8, awards: ['MVP-3', 'AS', 'NBA2'] }),
    player('garneke01', 'Kevin Garnett', 71, { pos: 'PF', age: 31, gs: 71, pts: 18.8, trb: 9.2, per: 25.3, joinedFrom: Team.Minnesota, awards: ['MVP-1', 'DPOY-1', 'NBA1', 'DEF1', 'AS'] }),
    player('movesjo01', 'Joe Moves', 20, { joinedFrom: Team.Detroit, leftFor: Team.Miami }),
    player('scrubjo01', 'Joe Scrub', 3, { pos: 'C', per: null, leftFor: Team.Toronto }),
  ],
  [Team.Detroit]: [player('billuch01', 'Chauncey Billups', 78, { pos: 'PG' })],
}

// Boston changed coaches mid-season; Detroit kept one coach all season
export const COACHES: Partial<Record<Team, CoachStint[]>> = {
  [Team.Boston]: [
    { id: 'riverdo01c', name: 'Doc Rivers', g: 20, w: 12, l: 8 },
    { id: 'stevebr99c', name: 'Brad Stevens', g: 62, w: 50, l: 12 },
  ],
  [Team.Detroit]: [{ id: 'flipsa01c', name: 'Flip Saunders', g: 82, w: 59, l: 23 }],
}

const DISPLAY = [
  { teamId: Team.Boston, name: 'Boston Celtics', color: '#2EAD61' },
  { teamId: Team.LALakers, name: 'Los Angeles Lakers', color: '#B388FF' },
  { teamId: Team.Miami, name: 'Miami Heat', color: '#E0115F' },
  { teamId: Team.Detroit, name: 'Detroit Pistons', color: '#E83E8C' },
]

export function buildTeams(maxWeek = 25): TeamRankings[] {
  const rankings = buildRankings(maxWeek)
  const playoffs: Record<string, PlayoffStage> = PLAYOFFS
  return DISPLAY.map((team) => ({
    ...team,
    rankings: rankings[team.teamId],
    playoff: playoffs[team.teamId],
    playoffSeries: PLAYOFF_SERIES[team.teamId],
  }))
}

export function mockReducedMotion(reduce: boolean) {
  const original = window.matchMedia
  window.matchMedia = (query: string) =>
    ({
      matches: reduce,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
  return () => {
    window.matchMedia = original
  }
}
