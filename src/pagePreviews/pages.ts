import type { Season } from '@/data/seasonData'
import { pageTitle } from '@/constants'
import { Teams } from 'types'
import { seasonCard, teamCard, type PreviewCard } from './cards'
import type { PageHead } from './head'

export type PageEntry = {
  kind: 'season' | 'team' | 'player'
  path: string
  file: string
  head: PageHead | null
}

const PLAYER_ID = /^[a-z]+\d{2}$/

const possessive = (name: string) =>
  name.endsWith('s') ? `${name}'` : `${name}'s`

function playerIds(seasons: Season[]): string[] {
  const ids = seasons.flatMap((season) =>
    season.teams.flatMap((team) => (team.roster ?? []).map((p) => p.id))
  )
  return ids
    .filter((id, i) => PLAYER_ID.test(id) && ids.indexOf(id) === i)
    .toSorted((a, b) => a.localeCompare(b))
}

// Lists every page address with its entry file, preview tags, and preview card.
export function buildPages(
  seasons: Season[],
  origin: string,
  base: string
): { pages: PageEntry[]; cards: PreviewCard[] } {
  const siteUrl = origin + (base.endsWith('/') ? base : base + '/')
  const head = (path: string, card: PreviewCard, description: string) => ({
    title: pageTitle(card.heading),
    description: `${description} ${card.fact}.`,
    canonicalUrl: siteUrl + path.slice(1),
    imageUrl: siteUrl + card.file,
  })

  const seasonCards = seasons.map(seasonCard)
  const seasonPages: PageEntry[] = seasons.map((season, i) => ({
    kind: 'season',
    path: '/' + season.name,
    file: season.name + '.html',
    head: head(
      '/' + season.name,
      seasonCards[i],
      `Week-by-week power rankings for the ${season.name} NBA season.`
    ),
  }))

  const teamCards = Teams.map((team) => teamCard(team.teamId, seasons))
  const teamPages: PageEntry[] = Teams.map((team, i) => ({
    kind: 'team',
    path: '/teamHistory/' + team.teamId,
    file: `teamHistory/${team.teamId}.html`,
    head: head(
      '/teamHistory/' + team.teamId,
      teamCards[i],
      `${possessive(team.name)} weekly power rankings and playoff results, season by season.`
    ),
  }))

  const playerPages: PageEntry[] = playerIds(seasons).map((id) => ({
    kind: 'player',
    path: '/playerHistory/' + id,
    file: `playerHistory/${id}.html`,
    head: null,
  }))

  return {
    pages: [...seasonPages, ...teamPages, ...playerPages],
    cards: [...seasonCards, ...teamCards],
  }
}
