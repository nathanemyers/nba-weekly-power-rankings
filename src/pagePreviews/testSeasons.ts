import type { Season } from '@/data/seasonData'
import {
  DataSource,
  PlayoffStage,
  Teams,
  type RosterEntry,
  type Team,
} from 'types'

type TeamSpec = {
  team: Team
  ranks: number[]
  playoff?: PlayoffStage
  players?: string[]
}

const rosterEntry = (id: string): RosterEntry => ({
  id,
  name: id,
  pos: 'G',
  age: 25,
  g: 10,
  gs: 10,
  mpg: 30,
  pts: 10,
  trb: 5,
  ast: 5,
  stl: 1,
  blk: 1,
  tov: 1,
  per: 15,
  awards: [],
})

// Builds a minimal Season for page-preview tests.
export function testSeason(name: string, specs: TeamSpec[]): Season {
  const teams = specs.map((spec) => ({
    ...Teams.find((t) => t.teamId === spec.team)!,
    rankings: spec.ranks.map((rank, i) => ({
      week: i + 1,
      rank,
      summary: '',
    })),
    playoff: spec.playoff,
    roster: spec.players?.map(rosterEntry),
  }))
  const champion = specs.find(
    (spec) => spec.playoff === PlayoffStage.Champion
  )?.team
  return {
    name,
    source: DataSource.NBA,
    teams,
    maxWeek: Math.max(...specs.map((spec) => spec.ranks.length)),
    completed: champion !== undefined,
    champion,
    storylines: [],
  }
}
