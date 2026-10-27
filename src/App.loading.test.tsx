import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockReducedMotion } from 'test/fixtures'
import { renderWithRouter } from 'test/renderWithRouter'

// 'mid' resolves only when a test says so; 'broken' always fails to download
const pending = vi.hoisted(() => ({ resolveMid: () => {} }))

vi.mock('data/seasons', async () => {
  const { buildRankings } = await import('./test/fixtures')
  const season = (name: string, maxWeek: number) => ({
    season: name,
    source: 'nba',
    maxWeek,
    rankings: buildRankings(maxWeek),
  })
  return {
    seasonIndex: [
      { name: 'long', source: 'nba' },
      { name: 'mid', source: 'nba' },
      { name: 'broken', source: 'nba' },
    ],
    seasonLoaders: {
      long: () => Promise.resolve({ default: season('long', 26) }),
      mid: () =>
        new Promise((resolve) => {
          pending.resolveMid = () => resolve({ default: season('mid', 21) })
        }),
      broken: () => Promise.reject(new Error('offline')),
    },
  }
})

const chooseSeason = async (
  user: ReturnType<typeof userEvent.setup>,
  season: string
) => {
  await user.click(screen.getByRole('combobox'))
  await user.click(
    screen.getByRole('option', { name: new RegExp(`^${season}`) })
  )
}

let restoreMotion: () => void
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  restoreMotion = mockReducedMotion(true)
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  restoreMotion()
  errorSpy.mockRestore()
})

it('shows a loading state until a new season arrives', async () => {
  const user = userEvent.setup()
  await renderWithRouter(['/long'])

  await chooseSeason(user, 'mid')
  expect(await screen.findByText('Loading season…')).toBeInTheDocument()

  await act(async () => pending.resolveMid())
  await waitFor(() =>
    expect(screen.getByRole('combobox')).toHaveTextContent('mid Season')
  )
  expect(screen.queryByText('Loading season…')).not.toBeInTheDocument()
})

it('shows an error with a season picker when a season fails, and recovers', async () => {
  const user = userEvent.setup()
  const { router } = await renderWithRouter(['/broken'])

  expect(
    await screen.findByText("Couldn't load the broken season")
  ).toBeInTheDocument()

  await chooseSeason(user, 'long')
  await waitFor(() =>
    expect(screen.getByRole('combobox')).toHaveTextContent('long Season')
  )
  expect(router.state.location.pathname).toBe('/long')
  expect(screen.getByRole('img', { name: /line chart/i })).toBeInTheDocument()
})
