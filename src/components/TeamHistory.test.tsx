import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from 'test/renderWithRouter'

vi.mock('data/seasons', async () => {
  const { buildRankings, PLAYOFFS, STORYLINES } = await import('test/fixtures')
  const { mockSeasonModule } = await import('test/mockSeasons')
  return mockSeasonModule({
    storied: {
      season: 'storied',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
      storylines: STORYLINES,
    },
    plain: {
      season: 'plain',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
    },
  })
})

afterEach(cleanup)

describe('TeamHistory', () => {
  it("lists each season's team storylines in date order", async () => {
    await renderWithRouter(['/teamHistory/mia'])
    const list = await screen.findByRole('list', {
      name: 'storied Miami Heat storylines',
    })
    expect(
      within(list)
        .getAllByRole('heading')
        .map((heading) => heading.textContent)
    ).toEqual(['miami-slump title', 'big-trade title'])
    expect(screen.queryByRole('list', { name: /^plain/ })).toBeNull()
  })

  it('opens an article without navigating to the season', async () => {
    const user = userEvent.setup()
    const { router } = await renderWithRouter(['/teamHistory/mia'])
    await user.click(
      await screen.findByRole('link', { name: 'miami-slump headline' })
    )
    expect(router.state.location.pathname).toBe('/teamHistory/mia')
  })
})
