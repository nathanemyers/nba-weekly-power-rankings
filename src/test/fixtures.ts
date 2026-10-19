import { PlayoffStage, Team, type TeamRankings, type WeekRanking } from 'types'

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
