import type { TeamRankings } from 'types'

export type RankSwing = {
  team: TeamRankings
  startRank: number
  endRank: number
  change: number
}

// Uses the team's own first and last recorded weeks, which can differ from the season's
export function getRankSwing(team: TeamRankings): RankSwing | undefined {
  if (team.rankings.length < 2) return undefined
  const startRank = team.rankings[0].rank
  const endRank = team.rankings[team.rankings.length - 1].rank
  return { team, startRank, endRank, change: startRank - endRank }
}

// Keeps every swing tied with the last one that makes the cut
function largest(swings: RankSwing[], count: number): RankSwing[] {
  const sorted = [...swings].sort(
    (a, b) => Math.abs(b.change) - Math.abs(a.change)
  )
  if (sorted.length <= count) return sorted
  const cutoff = Math.abs(sorted[count - 1].change)
  return sorted.filter((swing) => Math.abs(swing.change) >= cutoff)
}

export function biggestSwings(
  teams: TeamRankings[],
  count = 3
): { risers: RankSwing[]; fallers: RankSwing[] } {
  const swings = teams.map(getRankSwing).filter((swing) => swing !== undefined)
  return {
    risers: largest(
      swings.filter((swing) => swing.change > 0),
      count
    ),
    fallers: largest(
      swings.filter((swing) => swing.change < 0),
      count
    ),
  }
}
