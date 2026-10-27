import type { RosterEntry } from 'types'

export type StatRating = 'elite' | 'good' | 'fair' | 'poor'

export type RatedStat = 'pts' | 'trb' | 'ast' | 'stl' | 'blk' | 'per'

type Breakpoints = {
  low: number
  high: number
  elite: number
}

// 25th, 75th and 90th percentiles of 2003-04 to 2025-26 player-team seasons with 10+ games and 10+ minutes per game
export const STAT_BREAKPOINTS: Record<RatedStat, Breakpoints> = {
  pts: { low: 6, high: 13.5, elite: 19 },
  trb: { low: 2.5, high: 5.5, elite: 7.5 },
  ast: { low: 1, high: 3, elite: 5 },
  stl: { low: 0.5, high: 1, elite: 1.4 },
  blk: { low: 0.2, high: 0.6, elite: 1.0 },
  per: { low: 11, high: 17, elite: 20 },
}

// Share of qualified player-seasons in each rating, lowest first; update alongside STAT_BREAKPOINTS

export const MIN_RATED_GAMES = 10
export const MIN_RATED_MINUTES = 10

/** Whether a player's line is large enough to be rated against the breakpoints. */
export function isRatable(player: RosterEntry): boolean {
  return player.g >= MIN_RATED_GAMES && player.mpg >= MIN_RATED_MINUTES
}

/** Rates a player's stat against the breakpoints, or returns undefined for small samples the breakpoints weren't drawn from. */
export function statRating(
  player: RosterEntry,
  stat: RatedStat
): StatRating | undefined {
  const value = player[stat]
  if (value === null || !isRatable(player)) return undefined
  const { low, high, elite } = STAT_BREAKPOINTS[stat]
  if (value >= elite) return 'elite'
  if (value >= high) return 'good'
  return value >= low ? 'fair' : 'poor'
}
