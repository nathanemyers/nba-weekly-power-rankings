import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from 'test/renderWithRouter'
import { mockMediaQueries } from 'test/fixtures'

vi.mock('data/seasons', async () => {
  const { buildRankings, PLAYOFFS, PLAYOFF_SERIES, ROSTERS, STORYLINES } =
    await import('test/fixtures')
  const { mockSeasonModule } = await import('test/mockSeasons')
  return mockSeasonModule({
    storied: {
      season: 'storied',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
      playoffSeries: PLAYOFF_SERIES,
      rosters: ROSTERS,
      storylines: STORYLINES,
      summaries: { mia: 'Miami summary text', bos: 'Boston summary text' },
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

const seasonButton = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Seasons' })).getByRole(
    'button',
    { name }
  )

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

  it('does not show AI summaries', async () => {
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    expect(screen.queryByText('Boston summary text')).toBeNull()
    expect(screen.queryByText(/AI-generated summary/)).toBeNull()
  })

  it('notes a season without storylines', async () => {
    await renderWithRouter(['/teamHistory/bos'])
    expect(
      await screen.findByText('No storylines for this season')
    ).toBeInTheDocument()
  })
})

describe('two-column layout', () => {
  it('lists seasons in the same order in both columns', async () => {
    await renderWithRouter(['/teamHistory/bos'])
    const nav = await screen.findByRole('navigation', { name: 'Seasons' })
    const entries = within(nav)
      .getAllByRole('button')
      .filter((button) => !button.hasAttribute('aria-label'))
    expect(entries.map((button) => button.textContent)).toEqual([
      'storied',
      'plain',
    ])
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual(['storied', 'plain'])
  })

  it('highlights only the first season to start', async () => {
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    expect(seasonButton('storied')).toHaveAttribute('aria-current', 'true')
    expect(seasonButton('plain')).not.toHaveAttribute('aria-current')
  })

  it('shows the top players by total minutes with rated PER, linked to their history', async () => {
    const user = userEvent.setup()
    const { router } = await renderWithRouter(['/teamHistory/bos'])
    const list = await screen.findByRole('list', {
      name: 'storied top players by minutes',
    })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Paul Pierce, PER 19.8',
      'Kevin Garnett, PER 25.3',
      'Joe Moves, PER 15.0',
      'Joe Scrub, PER –',
    ])
    expect(
      links.map((link) =>
        link.querySelector('[data-rating]')?.getAttribute('data-rating')
      )
    ).toEqual(['good', 'elite', 'fair', 'unrated'])
    await user.click(links[0])
    expect(router.state.location.pathname).toBe('/playerHistory/piercpa01')
  })

  it('omits top players for a season without roster data', async () => {
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    expect(
      screen.queryByRole('list', { name: 'plain top players by minutes' })
    ).toBeNull()
  })

  it('opens the season chart with the team pinned', async () => {
    const user = userEvent.setup()
    const { router, store } = await renderWithRouter(['/teamHistory/mia'])
    await user.click(
      await screen.findByRole('link', { name: 'View storied chart' })
    )
    expect(router.state.location.pathname).toBe('/storied')
    expect(store.getState().chart.pinnedTeams).toEqual(['mia'])
  })
})

describe('selecting a season', () => {
  let scrollTo: ReturnType<typeof vi.fn>
  let restoreMedia: (() => void) | undefined

  beforeEach(() => {
    scrollTo = vi.fn()
    Element.prototype.scrollTo =
      scrollTo as unknown as typeof Element.prototype.scrollTo
    // jsdom has no layout, so give the detail column room to scroll
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(5000)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const top = this.dataset.season === 'plain' ? 1200 : 0
        return {
          top,
          bottom: top,
          left: 0,
          right: 0,
          height: 0,
          width: 0,
          x: 0,
          y: top,
          toJSON: () => ({}),
        }
      }
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    restoreMedia?.()
    restoreMedia = undefined
  })

  it('highlights the clicked season and scrolls the detail column to it', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    await user.click(seasonButton('plain'))
    expect(seasonButton('plain')).toHaveAttribute('aria-current', 'true')
    expect(seasonButton('storied')).not.toHaveAttribute('aria-current')
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200, behavior: 'smooth' })
  })

  it('jumps without animation when reduced motion is requested', async () => {
    restoreMedia = mockMediaQueries(['(prefers-reduced-motion: reduce)'])
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    await user.click(seasonButton('plain'))
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200, behavior: 'auto' })
  })

  it('works from the keyboard', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('navigation', { name: 'Seasons' })
    seasonButton('plain').focus()
    await user.keyboard('{Enter}')
    expect(seasonButton('plain')).toHaveAttribute('aria-current', 'true')
  })

  it('does not select a season when its playoff badge is clicked', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/bos'])
    const nav = await screen.findByRole('navigation', { name: 'Seasons' })
    await user.click(seasonButton('plain'))
    const badges = within(nav).getByRole('list', { name: 'Playoff series' })
    await user.click(within(badges).getAllByRole('button')[0])
    expect(seasonButton('plain')).toHaveAttribute('aria-current', 'true')
  })
})

describe('narrow layout', () => {
  let restoreMedia: () => void

  beforeEach(() => {
    restoreMedia = mockMediaQueries(['(max-width: 1023.98px)'])
  })

  afterEach(() => restoreMedia())

  const header = (name: string) => screen.getByRole('button', { name })

  it('shows only collapsed season overviews', async () => {
    await renderWithRouter(['/teamHistory/mia'])
    await screen.findByRole('button', { name: 'storied' })
    expect(screen.queryByRole('navigation', { name: 'Seasons' })).toBeNull()
    expect(header('storied')).toHaveAttribute('aria-expanded', 'false')
    expect(header('plain')).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('list', { name: 'storied Miami Heat storylines' })
    ).toBeNull()
  })

  it('expands and collapses each season on its own', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/mia'])
    await user.click(await screen.findByRole('button', { name: 'storied' }))
    expect(header('storied')).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('list', { name: 'storied Miami Heat storylines' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View storied chart' })
    ).toBeInTheDocument()

    await user.click(header('plain'))
    expect(header('storied')).toHaveAttribute('aria-expanded', 'true')
    expect(header('plain')).toHaveAttribute('aria-expanded', 'true')

    await user.click(header('storied'))
    expect(header('storied')).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('list', { name: 'storied Miami Heat storylines' })
    ).toBeNull()
  })

  it('does not toggle a season when its playoff badge is clicked', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/bos'])
    await screen.findByRole('button', { name: 'storied' })
    const badges = screen.getAllByRole('list', { name: 'Playoff series' })
    await user.click(within(badges[0]).getAllByRole('button')[0])
    expect(header('storied')).toHaveAttribute('aria-expanded', 'false')
  })
})
