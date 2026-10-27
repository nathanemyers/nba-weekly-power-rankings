import type { Season } from './seasonData'
import type { Team } from 'types'

export type AwardKind = 'won' | 'selection' | 'vote'

export type Award = {
  code: string
  label: string
  title: string
  kind: AwardKind
}

const VOTED_AWARDS: Record<string, { short: string; name: string }> = {
  MVP: { short: 'MVP', name: 'Most Valuable Player' },
  DPOY: { short: 'DPOY', name: 'Defensive Player of the Year' },
  ROY: { short: 'ROY', name: 'Rookie of the Year' },
  '6MOY': { short: '6MOY', name: 'Sixth Man of the Year' },
  MIP: { short: 'MIP', name: 'Most Improved Player' },
  CPOY: { short: 'CPOY', name: 'Clutch Player of the Year' },
}

const SELECTIONS: Record<string, { label: string; title: string }> = {
  NBA1: { label: 'All-NBA 1st', title: 'All-NBA First Team' },
  NBA2: { label: 'All-NBA 2nd', title: 'All-NBA Second Team' },
  NBA3: { label: 'All-NBA 3rd', title: 'All-NBA Third Team' },
  DEF1: { label: 'All-Defensive 1st', title: 'All-Defensive First Team' },
  DEF2: { label: 'All-Defensive 2nd', title: 'All-Defensive Second Team' },
  AS: { label: 'All-Star', title: 'All-Star' },
}

const SELECTION_ORDER = Object.keys(SELECTIONS)

function ordinal(place: number) {
  const tens = place % 100
  if (tens >= 11 && tens <= 13) return `${place}th`
  return `${place}${['th', 'st', 'nd', 'rd'][place % 10] ?? 'th'}`
}

function parseAward(code: string): Award | undefined {
  const selection = SELECTIONS[code]
  if (selection) return { code, ...selection, kind: 'selection' }
  const [key, place] = code.split('-')
  const award = VOTED_AWARDS[key]
  if (!award || !place) return undefined
  if (place === '1')
    return { code, label: award.short, title: award.name, kind: 'won' }
  return {
    code,
    label: `${award.short} ${ordinal(Number(place))}`,
    title: `${ordinal(Number(place))} in ${award.name} voting`,
    kind: 'vote',
  }
}

const rank = (award: Award) => {
  if (award.kind === 'won') return 0
  if (award.kind === 'selection')
    return 1 + SELECTION_ORDER.indexOf(award.code) / 10
  return 2 + Number(award.code.split('-')[1]) / 100
}

// Awards won first, then team selections, then voting finishes from best to worst
export function seasonAwards(codes: string[] | undefined): Award[] {
  return (codes ?? [])
    .map(parseAward)
    .filter((award) => award !== undefined)
    .sort((a, b) => rank(a) - rank(b))
}

export type AwardWinner = { id: string; name: string; team: Team }

export type SeasonAwardGroup = {
  code: string
  title: string
  players: AwardWinner[]
}

const GROUP_ORDER = [
  ...Object.keys(VOTED_AWARDS).map((key) => `${key}-1`),
  ...SELECTION_ORDER,
]

// Every award won and team selection in a season, with the players who earned each
export function getSeasonAwardGroups(season: Season): SeasonAwardGroup[] {
  const groups: Record<string, SeasonAwardGroup> = {}
  for (const team of season.teams) {
    for (const player of team.roster ?? []) {
      for (const award of seasonAwards(player.awards)) {
        if (award.kind === 'vote') continue
        groups[award.code] ??= {
          code: award.code,
          title: award.title,
          players: [],
        }
        groups[award.code].players.push({
          id: player.id,
          name: player.name,
          team: team.teamId,
        })
      }
    }
  }
  return GROUP_ORDER.filter((code) => groups[code]).map((code) => ({
    ...groups[code],
    players: groups[code].players.sort((a, b) => a.name.localeCompare(b.name)),
  }))
}
