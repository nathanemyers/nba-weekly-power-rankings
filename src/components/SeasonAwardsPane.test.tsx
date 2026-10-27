import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from 'test/renderWithRouter'
import { setPinnedTeams } from '@/store/slices/chart'
import { Team } from 'types'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const pane = () => screen.getByRole('region', { name: 'long awards' })

afterEach(cleanup)

describe('SeasonAwardsPane', () => {
  it("lists the season's award winners and team selections", async () => {
    await renderWithRouter(['/long'])
    await screen.findByRole('heading', { name: 'long awards' })
    expect(
      within(pane())
        .getAllByRole('list')
        .map((list) => [
          list.getAttribute('aria-label'),
          within(list)
            .getAllByRole('link')
            .map((link) => link.textContent),
        ])
    ).toEqual([
      ['Most Valuable Player', ['Kevin Garnett']],
      ['Defensive Player of the Year', ['Kevin Garnett']],
      ['All-Defensive First Team', ['Kevin Garnett']],
      ['All-NBA First Team', ['Kevin Garnett']],
      ['All-NBA Second Team', ['Paul Pierce']],
      ['All-Star', ['Kevin Garnett', 'Paul Pierce']],
    ])
  })

  it("opens a player's history when their name is clicked", async () => {
    const user = userEvent.setup()
    const { router } = await renderWithRouter(['/long'])
    await screen.findByRole('heading', { name: 'long awards' })
    await user.click(
      within(
        within(pane()).getByRole('list', { name: 'All-NBA Second Team' })
      ).getByRole('link', { name: 'Paul Pierce' })
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Paul Pierce' })
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/playerHistory/piercpa01')
  })

  it('is absent for a season without awards', async () => {
    await renderWithRouter(['/short'])
    await screen.findByRole('combobox')
    expect(screen.queryByRole('heading', { name: /awards/ })).toBeNull()
  })

  it('hides while any team is selected and returns when the selection clears', async () => {
    const { store } = await renderWithRouter(['/long'])
    await screen.findByRole('heading', { name: 'long awards' })
    act(() => {
      store.dispatch(setPinnedTeams([Team.Boston]))
    })
    expect(screen.queryByRole('heading', { name: 'long awards' })).toBeNull()
    act(() => {
      store.dispatch(setPinnedTeams([]))
    })
    expect(
      screen.getByRole('heading', { name: 'long awards' })
    ).toBeInTheDocument()
  })
})
