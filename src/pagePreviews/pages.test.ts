import { describe, expect, it } from 'vitest'
import { buildPages } from './pages'
import { testSeason } from './testSeasons'
import { PlayoffStage, Team, Teams } from 'types'

const origin = 'https://example.github.io'
const base = '/nba-weekly-power-rankings/'
const site = 'https://example.github.io/nba-weekly-power-rankings/'

const seasons = [
  testSeason('2024-25', [
    {
      team: Team.Boston,
      ranks: [2],
      playoff: PlayoffStage.SecondRound,
      players: ['tatumja01', 'whitede01'],
    },
    {
      team: Team.OklahomaCity,
      ranks: [1],
      playoff: PlayoffStage.Champion,
      players: ['gilgesh01', 'Bad Id'],
    },
  ]),
  testSeason('2023-24', [
    {
      team: Team.Boston,
      ranks: [1],
      playoff: PlayoffStage.Champion,
      players: ['tatumja01'],
    },
  ]),
]

const { pages, cards } = buildPages(seasons, origin, base)
const ofKind = (kind: string) => pages.filter((page) => page.kind === kind)

describe('buildPages', () => {
  it('writes one entry file per season', () => {
    expect(ofKind('season').map((page) => [page.path, page.file])).toEqual([
      ['/2024-25', '2024-25.html'],
      ['/2023-24', '2023-24.html'],
    ])
  })

  it('writes one entry file per team', () => {
    const teams = ofKind('team')
    expect(teams).toHaveLength(Teams.length)
    expect(teams.find((page) => page.path === '/teamHistory/bos')?.file).toBe(
      'teamHistory/bos.html'
    )
  })

  it('writes one entry file per valid player id, without a page preview', () => {
    expect(ofKind('player')).toEqual([
      {
        kind: 'player',
        path: '/playerHistory/gilgesh01',
        file: 'playerHistory/gilgesh01.html',
        head: null,
      },
      {
        kind: 'player',
        path: '/playerHistory/tatumja01',
        file: 'playerHistory/tatumja01.html',
        head: null,
      },
      {
        kind: 'player',
        path: '/playerHistory/whitede01',
        file: 'playerHistory/whitede01.html',
        head: null,
      },
    ])
  })

  it('gives each path exactly one entry', () => {
    const paths = pages.map((page) => page.path)
    expect(paths.filter((path, i) => paths.indexOf(path) !== i)).toEqual([])
  })

  it('builds the season preview with absolute URLs', () => {
    expect(ofKind('season')[0].head).toEqual({
      title: '2024-25 · NBA Weekly Power Rankings',
      description:
        'Week-by-week power rankings for the 2024-25 NBA season. Champions: Oklahoma City Thunder.',
      canonicalUrl: site + '2024-25',
      imageUrl: site + 'previews/season-2024-25.jpg',
    })
  })

  it('builds the team preview with absolute URLs', () => {
    expect(
      pages.find((page) => page.path === '/teamHistory/bos')?.head
    ).toEqual({
      title: 'Boston Celtics · NBA Weekly Power Rankings',
      description:
        "Boston Celtics' weekly power rankings and playoff results, season by season. Champions in 2023-24.",
      canonicalUrl: site + 'teamHistory/bos',
      imageUrl: site + 'previews/team-bos.jpg',
    })
  })

  it('makes one preview image per season and per team', () => {
    expect(cards).toHaveLength(seasons.length + Teams.length)
    expect(cards.map((card) => card.file)).toContain(
      'previews/team-okc.jpg'
    )
  })

  it('adds a missing trailing slash to the base', () => {
    const { pages } = buildPages(seasons, origin, '/nba-weekly-power-rankings')
    expect(pages[0].head?.canonicalUrl).toBe(site + '2024-25')
  })
})
