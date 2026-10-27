import type { Season } from './seasonData'
import type { RosterEntry, Team } from 'types'

export type PlayerStint = { season: string; team: Team; player: RosterEntry }

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
      if (player)
        stints.push({ season: season.name, team: team.teamId, player })
    }
    return chainStints(stints)
  })
}
