import type { Season } from './seasonData'
import type { PlayoffStage, RosterEntry, Team } from 'types'

export type PlayerStint = {
  season: string
  team: Team
  player: RosterEntry
  playoff?: PlayoffStage
}

// Orders one season's stints by following each move, then lists the latest team first
function chainStints(stints: PlayerStint[]): PlayerStint[] {
  const ordered: PlayerStint[] = []
  let next = stints.find((stint) => !stint.player.joinedFrom)
  while (next && !ordered.includes(next)) {
    ordered.push(next)
    const leftFor = next.player.leftFor
    next = leftFor ? stints.find((stint) => stint.team === leftFor) : undefined
  }
  return [
    ...ordered,
    ...stints.filter((stint) => !ordered.includes(stint)),
  ].reverse()
}

export function getPlayerHistory(
  seasons: Season[],
  playerId: string
): PlayerStint[] {
  return seasons.flatMap((season) => {
    const stints: PlayerStint[] = []
    for (const team of season.teams) {
      const player = team.roster?.find((entry) => entry.id === playerId)
      if (!player) continue
      // A player who left mid-season wasn't with the team for its playoff run
      const playoff = player.leftFor ? undefined : team.playoff
      stints.push({ season: season.name, team: team.teamId, player, playoff })
    }
    return chainStints(stints)
  })
}

export type PlayerSummary = {
  id: string
  name: string
  firstSeason: string
  lastSeason: string
}

export function getAllPlayers(seasons: Season[]): PlayerSummary[] {
  const players: Record<string, PlayerSummary> = {}
  for (const season of seasons) {
    for (const team of season.teams) {
      for (const entry of team.roster ?? []) {
        const known = players[entry.id]
        if (known) known.firstSeason = season.name
        else
          players[entry.id] = {
            id: entry.id,
            name: entry.name,
            firstSeason: season.name,
            lastSeason: season.name,
          }
      }
    }
  }
  return Object.values(players).sort((a, b) => a.name.localeCompare(b.name))
}

const searchable = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Matches players whose name has a word starting with each word of the query
export function searchPlayers(
  players: PlayerSummary[],
  query: string,
  limit: number
): PlayerSummary[] {
  const terms = searchable(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return players
    .filter((player) => {
      const words = searchable(player.name).split(/[\s.'-]+/)
      return terms.every((term) => words.some((word) => word.startsWith(term)))
    })
    .slice(0, limit)
}
