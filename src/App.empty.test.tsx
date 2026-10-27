import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from 'test/renderWithRouter'

// The only index entry lacks a source, so no season passes validation
vi.mock('data/seasons', () => ({
  seasonIndex: [{ name: 'bad' }],
  seasonLoaders: {
    bad: () => Promise.resolve({ default: { season: 'bad', rankings: {} } }),
  },
}))

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  errorSpy.mockRestore()
})

it('shows a message when no season passes validation', async () => {
  await renderWithRouter()
  expect(screen.getByText('No season data available')).toBeInTheDocument()
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})
