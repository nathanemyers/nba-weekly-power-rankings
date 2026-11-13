import { describe, expect, it } from 'vitest'
import { seasonCard, teamCard } from './cards'
import { testSeason } from './testSeasons'
import { PlayoffStage, Team } from 'types'

describe('seasonCard', () => {
  it('features the champion of a completed season', () => {
    const season = testSeason('2007-08', [
      { team: Team.Boston, ranks: [3, 1], playoff: PlayoffStage.Champion },
      { team: Team.LALakers, ranks: [1, 2], playoff: PlayoffStage.Finals },
    ])
    expect(seasonCard(season)).toEqual({
      file: 'previews/season-2007-08.jpg',
      path: '/2007-08',
      heading: '2007-08',
      fact: 'Champions: Boston Celtics',
    })
  })

  it('features the latest #1 team of a season in progress', () => {
    const season = testSeason('2026-27', [
      { team: Team.Boston, ranks: [1, 2, 3] },
      { team: Team.Denver, ranks: [2, 1] },
      { team: Team.Miami, ranks: [3, 3, 1] },
    ])
    expect(seasonCard(season)).toEqual({
      file: 'previews/season-2026-27.jpg',
      path: '/2026-27',
      heading: '2026-27',
      fact: '#1 in week 3: Miami Heat',
    })
  })
})

describe('teamCard', () => {
  const seasons = [
    testSeason('2003-04', [
      { team: Team.Boston, ranks: [20], playoff: PlayoffStage.FirstRound },
      { team: Team.Denver, ranks: [9] },
      { team: Team.Miami, ranks: [12], playoff: PlayoffStage.SecondRound },
    ]),
    testSeason('2007-08', [
      { team: Team.Boston, ranks: [1], playoff: PlayoffStage.Champion },
      { team: Team.Denver, ranks: [4] },
      { team: Team.Miami, ranks: [8], playoff: PlayoffStage.ConferenceFinals },
    ]),
    testSeason('2008-09', [
      { team: Team.Boston, ranks: [2], playoff: PlayoffStage.SecondRound },
      { team: Team.Denver, ranks: [4] },
      { team: Team.Miami, ranks: [8], playoff: PlayoffStage.ConferenceFinals },
    ]),
    testSeason('2023-24', [
      { team: Team.Boston, ranks: [1], playoff: PlayoffStage.Champion },
      { team: Team.Denver, ranks: [6] },
    ]),
  ]

  it('counts several championships', () => {
    expect(teamCard(Team.Boston, seasons)).toEqual({
      file: 'previews/team-bos.jpg',
      path: '/teamHistory/bos',
      heading: 'Boston Celtics',
      fact: '2× champions since 2003-04',
    })
  })

  it('names the season of a single championship', () => {
    expect(teamCard(Team.Boston, seasons.slice(0, 2)).fact).toBe(
      'Champions in 2007-08'
    )
  })

  it('names the deepest playoff run and its earliest season', () => {
    expect(teamCard(Team.Miami, seasons).fact).toBe(
      'Best finish: Conference Finals (2007-08)'
    )
  })

  it('falls back to the best final-week rank', () => {
    expect(teamCard(Team.Denver, seasons).fact).toBe(
      'Best final rank: #4 (2007-08)'
    )
  })

  it('handles a team with no seasons', () => {
    expect(teamCard(Team.Utah, seasons).fact).toBe('Weekly power rankings')
  })
})
