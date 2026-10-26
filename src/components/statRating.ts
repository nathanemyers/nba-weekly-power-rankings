import type { RosterEntry } from 'types'

export type StatRating = 'good' | 'fair' | 'poor'

export type RatedStat = 'pts' | 'trb' | 'ast' | 'stl' | 'tov' | 'per'

type Breakpoints = { low: number; high: number; lowerIsBetter?: boolean }

// 25th and 75th percentiles of 2003-04 to 2025-26 player-team seasons with 10+ games and 10+ minutes per game
export const STAT_BREAKPOINTS: Record<RatedStat, Breakpoints> = {
  pts: { low: 6, high: 13.5 },
  trb: { low: 2.5, high: 5.5 },
  ast: { low: 1, high: 3 },
  stl: { low: 0.5, high: 1 },
  tov: { low: 0.9, high: 1.8, lowerIsBetter: true },
  per: { low: 11, high: 17 },
}

export const MIN_RATED_GAMES = 10
export const MIN_RATED_MINUTES = 10

/** Rates a player's stat against the breakpoints, or returns undefined for small samples the breakpoints weren't drawn from. */
export function statRating(
  player: RosterEntry,
  stat: RatedStat
): StatRating | undefined {
  const value = player[stat]
  if (
    value === null ||
    player.g < MIN_RATED_GAMES ||
    player.mpg < MIN_RATED_MINUTES
  ) {
    return undefined
  }
  const { low, high, lowerIsBetter } = STAT_BREAKPOINTS[stat]
  if (value < low) return lowerIsBetter ? 'good' : 'poor'
  if (value < high) return 'fair'
  return lowerIsBetter ? 'poor' : 'good'
}
