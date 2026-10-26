import type { RosterEntry } from 'types'

export type StatRating = 'elite' | 'good' | 'fair' | 'poor'

export type RatedStat = 'pts' | 'trb' | 'ast' | 'stl' | 'tov' | 'per'

type Breakpoints = {
  low: number
  high: number
  elite: number
  lowerIsBetter?: boolean
}

// 25th, 75th and 90th percentiles of 2003-04 to 2025-26 player-team seasons with 10+ games and 10+ minutes per game
export const STAT_BREAKPOINTS: Record<RatedStat, Breakpoints> = {
  pts: { low: 6, high: 13.5, elite: 19 },
  trb: { low: 2.5, high: 5.5, elite: 7.5 },
  ast: { low: 1, high: 3, elite: 5 },
  stl: { low: 0.5, high: 1, elite: 1.4 },
  tov: { low: 0.9, high: 1.8, elite: 0.6, lowerIsBetter: true },
  per: { low: 11, high: 17, elite: 20 },
}

// Share of qualified player-seasons in each rating, lowest first; update alongside STAT_BREAKPOINTS
export const RATING_BANDS: { rating: StatRating; percent: number }[] = [
  { rating: 'poor', percent: 25 },
  { rating: 'fair', percent: 50 },
  { rating: 'good', percent: 15 },
  { rating: 'elite', percent: 10 },
]

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
  const { low, high, elite, lowerIsBetter } = STAT_BREAKPOINTS[stat]
  if (lowerIsBetter) {
    if (value < elite) return 'elite'
    if (value < low) return 'good'
    return value < high ? 'fair' : 'poor'
  }
  if (value >= elite) return 'elite'
  if (value >= high) return 'good'
  return value >= low ? 'fair' : 'poor'
}
