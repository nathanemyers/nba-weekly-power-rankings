import type { Season } from '@/data/seasonData'
import { getTeamName, PlayoffStage, Teams, type Team } from 'types'

export type PreviewCard = {
  file: string
  heading: string
  fact: string
  accentColor: string
  logo: Team | null
}

export const NEUTRAL_ACCENT = '#a1a1aa'

const STAGE_ORDER = [
  PlayoffStage.FirstRound,
  PlayoffStage.SecondRound,
  PlayoffStage.ConferenceFinals,
  PlayoffStage.Finals,
  PlayoffStage.Champion,
]

const STAGE_LABELS: Record<PlayoffStage, string> = {
  [PlayoffStage.FirstRound]: 'First Round',
  [PlayoffStage.SecondRound]: 'Conference Semifinals',
  [PlayoffStage.ConferenceFinals]: 'Conference Finals',
  [PlayoffStage.Finals]: 'NBA Finals',
  [PlayoffStage.Champion]: 'Champions',
}

const teamColor = (team: Team) =>
  Teams.find((t) => t.teamId === team)?.color ?? NEUTRAL_ACCENT

export function seasonCard(season: Season): PreviewCard {
  const base = {
    file: `previews/season-${season.name}.png`,
    heading: season.name,
  }
  if (season.champion) {
    return {
      ...base,
      fact: `Champions: ${getTeamName(season.champion)}`,
      accentColor: teamColor(season.champion),
      logo: season.champion,
    }
  }
  const leader = season.teams.find((team) =>
    team.rankings.some(
      (ranking) => ranking.week === season.maxWeek && ranking.rank === 1
    )
  )
  return {
    ...base,
    fact: leader
      ? `#1 in week ${season.maxWeek}: ${leader.name}`
      : 'Weekly power rankings',
    accentColor: NEUTRAL_ACCENT,
    logo: leader?.teamId ?? null,
  }
}

type Finish = { season: string; stage?: PlayoffStage; finalRank?: number }

function teamFinishes(team: Team, seasons: Season[]): Finish[] {
  return seasons
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .flatMap((season) => {
      const entry = season.teams.find((t) => t.teamId === team)
      if (!entry) return []
      return [
        {
          season: season.name,
          stage: entry.playoff,
          finalRank: entry.rankings.at(-1)?.rank,
        },
      ]
    })
}

function teamFact(team: Team, seasons: Season[]): string {
  const finishes = teamFinishes(team, seasons)
  const titles = finishes.filter((f) => f.stage === PlayoffStage.Champion)
  if (titles.length === 1) return `Champions in ${titles[0].season}`
  if (titles.length > 1) {
    const firstSeason = seasons
      .map((season) => season.name)
      .toSorted((a, b) => a.localeCompare(b))[0]
    return `${titles.length}× champions since ${firstSeason}`
  }
  const deepest = finishes.reduce<Finish | undefined>((best, f) => {
    if (!f.stage) return best
    if (!best?.stage) return f
    return STAGE_ORDER.indexOf(f.stage) > STAGE_ORDER.indexOf(best.stage)
      ? f
      : best
  }, undefined)
  if (deepest?.stage)
    return `Best finish: ${STAGE_LABELS[deepest.stage]} (${deepest.season})`
  const bestRank = finishes.reduce<Finish | undefined>((best, f) => {
    if (f.finalRank === undefined) return best
    if (best?.finalRank === undefined || f.finalRank < best.finalRank) return f
    return best
  }, undefined)
  if (bestRank?.finalRank !== undefined)
    return `Best final rank: #${bestRank.finalRank} (${bestRank.season})`
  return 'Weekly power rankings'
}

export function teamCard(team: Team, seasons: Season[]): PreviewCard {
  return {
    file: `previews/team-${team}.png`,
    heading: getTeamName(team),
    fact: teamFact(team, seasons),
    accentColor: teamColor(team),
    logo: team,
  }
}
