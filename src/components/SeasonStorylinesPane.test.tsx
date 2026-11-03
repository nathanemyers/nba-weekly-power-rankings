import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { renderInSeason } from 'test/renderWithRouter'
import SeasonStorylinesPane from './SeasonStorylinesPane'

vi.mock('data/seasons', async () => {
  const { buildRankings, PLAYOFFS, STORYLINES } = await import('test/fixtures')
  const { mockSeasonModule } = await import('test/mockSeasons')
  return mockSeasonModule({
    long: {
      season: 'long',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
      storylines: STORYLINES,
    },
    short: {
      season: 'short',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
    },
  })
})

afterEach(cleanup)

describe('SeasonStorylinesPane', () => {
  it('lists featured storylines in date order with their articles', async () => {
    await renderInSeason(<SeasonStorylinesPane />, 'long')
    const items = within(
      await screen.findByRole('list', { name: 'long storylines' })
    ).getAllByRole('listitem')
    expect(
      items.map((item) => within(item).getByRole('heading').textContent)
    ).toEqual(['big-trade title', 'league-record title', 'title-run title'])
    const link = within(items[0]).getByRole('link', {
      name: 'big-trade headline',
    })
    expect(link).toHaveAttribute(
      'href',
      'https://www.espn.com/nba/story/big-trade'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(items[0]).toHaveTextContent('ESPN')
    expect(items[0]).toHaveTextContent('Feb 1, 2008')
  })

  it('renders nothing for a season without storylines', async () => {
    await renderInSeason(<SeasonStorylinesPane />, 'short')
    expect(screen.queryByRole('list')).toBeNull()
  })
})
