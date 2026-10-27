import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from 'test/renderWithRouter'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { Team } from 'types'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

const path = (router: { state: { location: { pathname: string } } }) =>
  router.state.location.pathname
// Waits for any route or season loading state to finish
const settle = () =>
  waitFor(() => expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument())
const bodyRows = () =>
  within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')
const ratings = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.getAttribute('data-rating'))

afterEach(cleanup)

describe('Player history', () => {
  it('opens from a player name in the roster pane', async () => {
    const user = userEvent.setup()
    const { router, store } = await renderWithRouter(['/long'])
    await settle()
    act(() => {
      store.dispatch(setPinnedTeams([Team.Boston]))
    })
    const rosterRatings = ratings(
      screen.getByRole('link', { name: 'Paul Pierce' }).closest('tr')!
    ).slice(1)

    await user.click(screen.getByRole('link', { name: 'Paul Pierce' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Paul Pierce' })
    ).toBeInTheDocument()
    expect(path(router)).toBe('/playerHistory/piercpa01')
    expect(
      bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)
    ).toEqual(['short', 'long'])
    expect(
      within(bodyRows()[0]).getByText('Detroit Pistons')
    ).toBeInTheDocument()
    expect(ratings(bodyRows()[1]).slice(2)).toEqual(rosterRatings)
  })

  it('opens a row as its season with only its team pinned', async () => {
    const user = userEvent.setup()
    const { router, store } = await renderWithRouter([
      '/playerHistory/piercpa01',
    ])
    await settle()
    await user.click(
      await screen.findByRole('row', { name: 'Detroit Pistons short season' })
    )
    await waitFor(() => expect(path(router)).toBe('/short'))
    expect(getPinnedTeams(store.getState())).toEqual([Team.Detroit])

    await act(() => router.navigate(-1))
    await waitFor(() => expect(path(router)).toBe('/playerHistory/piercpa01'))
  })

  it('opens a focused row with Enter', async () => {
    const user = userEvent.setup()
    const { router, store } = await renderWithRouter([
      '/playerHistory/piercpa01',
    ])
    await settle()
    const row = await screen.findByRole('row', {
      name: 'Boston Celtics long season',
    })
    row.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(path(router)).toBe('/long'))
    expect(getPinnedTeams(store.getState())).toEqual([Team.Boston])
  })

  it('shows player not found for an unknown player', async () => {
    await renderWithRouter(['/playerHistory/zzzzzz99'])
    await settle()
    expect(await screen.findByText('Player not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to the rankings chart/i })
    ).toBeInTheDocument()
  })

  it('shows player not found for a malformed player id', async () => {
    await renderWithRouter(['/playerHistory/Curry'])
    expect(await screen.findByText('Player not found')).toBeInTheDocument()
  })
})
