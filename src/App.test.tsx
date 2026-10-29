import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockReducedMotion } from 'test/fixtures'
import { renderWithRouter } from 'test/renderWithRouter'

// Fixture seasons: 26 weeks, 21 weeks, one short enough to fit the window (from ESPN), and two with rank swings
vi.mock('data/seasons', async () => {
  const { buildRankings, buildSwingRankings, PLAYOFF_SERIES, PLAYOFFS } =
    await import('./test/fixtures')
  const { mockSeasonModule } = await import('./test/mockSeasons')
  const season = (
    name: string,
    maxWeek: number,
    summaries?: Record<string, string>
  ) => ({
    season: name,
    source: 'nba',
    maxWeek,
    rankings: buildRankings(maxWeek),
    playoffs: PLAYOFFS,
    playoffSeries: PLAYOFF_SERIES,
    summaries,
  })
  return mockSeasonModule(
    {
      long: season('long', 26, { bos: 'Boston led from the first week.' }),
      mid: season('mid', 21),
      short: { ...season('short', 8), source: 'espn' },
      rising: {
        ...season('rising', 25),
        rankings: buildSwingRankings(25),
      },
      active: {
        season: 'active',
        source: 'nba',
        maxWeek: 25,
        rankings: buildSwingRankings(25),
      },
    },
    { long: 'bos', mid: 'bos', short: 'bos', rising: 'bos' }
  )
})

const earlier = () => screen.getByRole('button', { name: /earlier/i })
const later = () => screen.getByRole('button', { name: /later/i })
const zoomOut = () => screen.getByRole('button', { name: /zoom out/i })
const zoomIn = () => screen.getByRole('button', { name: /zoom in/i })
const chart = () => screen.getByRole('img', { name: /line chart/i })
// Waits for a navigation to finish rendering the chart, since the old view stays up until then
const findChart = () => screen.findByRole('img', { name: /line chart/i })
const miamiLabel = () => screen.getByText('Miami Heat', { selector: 'text' })
const chooseSeason = async (
  user: ReturnType<typeof userEvent.setup>,
  season: string
) => {
  await user.click(screen.getByRole('combobox'))
  await user.click(
    screen.getByRole('option', { name: new RegExp(`^${season}`) })
  )
  await settle()
  await waitFor(() =>
    expect(screen.getByRole('combobox')).toHaveTextContent(`${season} Season`)
  )
}
// Waits for any route or season loading state to finish
const settle = () =>
  waitFor(() => expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument())
const openTeamHistory = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Team History' }))
  await screen.findByRole('heading', { name: /Team History/ })
  await settle()
}
// The first and last visible week ticks, e.g. "2–12"
const shownWeeks = () => {
  const ticks = Array.from(document.querySelectorAll('.week-ticks text'))
  return `${ticks[0]?.textContent}–${ticks[ticks.length - 1]?.textContent}`
}
const weekTickCount = (container: HTMLElement) =>
  container.querySelectorAll('.week-ticks text').length

let restoreMotion: () => void

beforeEach(() => {
  restoreMotion = mockReducedMotion(true)
})

afterEach(() => {
  cleanup()
  restoreMotion()
})

describe('User Story 2 — move around the season', () => {
  it('starts on the full season and zooms in to a 10-week span', async () => {
    const { container } = await renderWithRouter()
    expect(shownWeeks()).toBe('1–26')
    expect(zoomIn()).toBeInTheDocument()

    fireEvent.click(zoomIn())
    expect(shownWeeks()).toBe('1–11')
    expect(weekTickCount(container)).toBe(11)
    expect(earlier()).toBeDisabled()
    expect(later()).not.toBeDisabled()
  })

  it('pages one week at a time with the on-screen controls', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    fireEvent.click(zoomIn())

    await user.click(later())
    expect(shownWeeks()).toBe('2–12')
    expect(
      screen.getByText('Detroit Pistons', { selector: 'text' })
    ).toHaveAttribute('y', String(30 + (19 / 29) * 510))

    await user.click(earlier())
    expect(shownWeeks()).toBe('1–11')
  })

  it('travels the whole season with the arrow keys, stopping at its ends', async () => {
    await renderWithRouter()
    fireEvent.click(zoomIn())

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(shownWeeks()).toBe('2–12')

    for (let i = 0; i < 40; i++)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(shownWeeks()).toBe('16–26')
    expect(later()).toBeDisabled()

    for (let i = 0; i < 40; i++) fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(shownWeeks()).toBe('1–11')
    expect(earlier()).toBeDisabled()
  })

  it('shows the full season with paging disabled and arrow keys ignored', async () => {
    const user = userEvent.setup()
    const { container } = await renderWithRouter()

    expect(shownWeeks()).toBe('1–26')
    expect(zoomIn()).toBeInTheDocument()
    expect(weekTickCount(container)).toBe(26)
    expect(earlier()).toBeDisabled()
    expect(later()).toBeDisabled()
    expect(container.querySelector('.playoff-column')).not.toBeNull()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await user.click(zoomIn())
    expect(shownWeeks()).toBe('1–11')
  })

  it('restores the window position and pinned team after a zoom round trip', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    fireEvent.click(zoomIn())

    await user.click(later())
    await user.click(miamiLabel())
    await user.click(zoomOut())
    await user.click(zoomIn())

    expect(shownWeeks()).toBe('2–12')
    expect(earlier()).not.toBeDisabled()
    expect(later()).not.toBeDisabled()
    expect(miamiLabel()).toHaveAttribute('font-weight', '700')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(shownWeeks()).toBe('3–13')
  })

  it('keeps the zoom mode across a season switch', async () => {
    const user = userEvent.setup()
    const { container } = await renderWithRouter()

    await chooseSeason(user, 'mid')
    expect(shownWeeks()).toBe('1–21')
    expect(zoomIn()).toBeInTheDocument()
    expect(weekTickCount(container)).toBe(21)

    await user.click(zoomIn())
    await chooseSeason(user, 'long')
    expect(shownWeeks()).toBe('1–11')
    expect(weekTickCount(container)).toBe(11)
  })

  it('keeps the window inside a shorter season after a switch', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    fireEvent.click(zoomIn())

    for (let i = 0; i < 40; i++)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    await chooseSeason(user, 'mid')

    expect(shownWeeks()).toBe('11–21')
    expect(later()).toBeDisabled()

    await user.click(earlier())
    expect(shownWeeks()).toBe('10–20')
  })

  it('disables the zoom control when the season fits the window', async () => {
    const user = userEvent.setup()
    const { container } = await renderWithRouter()

    await chooseSeason(user, 'short')

    expect(zoomIn()).toBeDisabled()
    expect(shownWeeks()).toBe('1–8')
    expect(weekTickCount(container)).toBe(8)
    expect(earlier()).toBeDisabled()
    expect(later()).toBeDisabled()
  })
})

describe('User Story 3 — pin a team', () => {
  it('pins on click and unpins when the same team is clicked again', async () => {
    const user = userEvent.setup()
    const boston = () =>
      screen.getByText('Boston Celtics', { selector: 'text' })
    await renderWithRouter()

    await user.click(miamiLabel())
    expect(miamiLabel()).toHaveAttribute('font-weight', '700')

    await user.unhover(miamiLabel())
    await user.click(boston())
    expect(boston()).toHaveAttribute('font-weight', '700')
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')

    await user.click(boston())
    fireEvent.mouseLeave(chart())
    expect(boston()).toHaveAttribute('font-weight', '400')
  })

  it('unpins when the chart background is clicked', async () => {
    const user = userEvent.setup()
    await renderWithRouter()

    await user.click(miamiLabel())
    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '700')

    fireEvent.click(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')
  })
})

describe('Team AI summary tab', () => {
  const summaryTab = () => screen.queryByRole('tab', { name: 'Summary' })

  it("shows the pinned team's labeled summary and hides on unpin", async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    expect(summaryTab()).toBeDisabled()

    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await user.click(summaryTab()!)
    expect(
      screen.getByText('Boston led from the first week.')
    ).toBeInTheDocument()
    expect(screen.getByText('AI-generated summary')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Boston Celtics' })
    ).toBeInTheDocument()

    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    expect(summaryTab()).toBeDisabled()
  })

  it('hides the summary when switching seasons clears the pin', async () => {
    const user = userEvent.setup()
    await renderWithRouter()

    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await chooseSeason(user, 'mid')

    expect(summaryTab()).toBeDisabled()
    expect(shownWeeks()).toBe('1–21')
  })
})

describe('Season trends tab', () => {
  const trendsTab = () => screen.queryByRole('tab', { name: 'Trends' })
  const openTrends = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(trendsTab()!)
    await screen.findByRole('heading', { name: 'Biggest Up' })
  }
  // The team logos in a section, in display order
  const sectionTeams = (heading: string) =>
    within(
      screen.getByRole('heading', { name: heading })
        .nextElementSibling as HTMLElement
    )
      .getAllByRole('img')
      .map((img) => img.getAttribute('alt'))
  const toggle = (team: string) =>
    screen.getAllByRole('button', { name: `${team} logo` })[0]

  it('lists the biggest risers and fallers of a completed season', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'rising')
    await openTrends(user)

    expect(sectionTeams('Biggest Up').slice(0, 2)).toEqual([
      'Indiana Pacers logo',
      'Miami Heat logo',
    ])
    expect(sectionTeams('Biggest Up')).toHaveLength(3)
    expect(sectionTeams('Biggest Down')[0]).toBe('Memphis Grizzlies logo')
    expect(sectionTeams('Biggest Down')).toHaveLength(3)
  })

  it('is enabled for a season in progress, with the summary tab disabled', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'active')
    await user.click(screen.getByText('Indiana Pacers', { selector: 'text' }))

    expect(trendsTab()).toBeEnabled()
    expect(screen.getByRole('tab', { name: 'Summary' })).toBeDisabled()
  })

  it('pins the clicked team, replacing an earlier pin', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'rising')
    await openTrends(user)

    await user.click(toggle('Indiana Pacers'))
    expect(toggle('Indiana Pacers')).toHaveAttribute('aria-pressed', 'true')
    expect(toggle('Memphis Grizzlies')).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByText('Indiana Pacers', { selector: 'text' })
    ).toHaveAttribute('font-weight', '700')

    await user.click(toggle('Memphis Grizzlies'))
    expect(toggle('Memphis Grizzlies')).toHaveAttribute('aria-pressed', 'true')
    expect(toggle('Indiana Pacers')).toHaveAttribute('aria-pressed', 'false')
  })

  it('reflects a team pinned from the chart', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'rising')

    await user.click(screen.getByText('Indiana Pacers', { selector: 'text' }))
    await openTrends(user)

    expect(toggle('Indiana Pacers')).toHaveAttribute('aria-pressed', 'true')
  })

  it("clears the pin and shows the new season's teams on a season switch", async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'rising')
    await user.click(screen.getByText('Indiana Pacers', { selector: 'text' }))

    await chooseSeason(user, 'long')
    await openTrends(user)

    expect(
      screen.queryByRole('button', { pressed: true })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Indiana Pacers logo' })
    ).not.toBeInTheDocument()
  })

  it('drops the pin when switching to a season that has not completed', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await chooseSeason(user, 'rising')
    await openTrends(user)
    await user.click(toggle('Indiana Pacers'))

    await chooseSeason(user, 'active')

    fireEvent.mouseLeave(chart())
    expect(
      screen.getByText('Indiana Pacers', { selector: 'text' })
    ).toHaveAttribute('font-weight', '400')
  })

  it('clears a pin made in the chart on a season switch', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await user.click(miamiLabel())

    await chooseSeason(user, 'mid')

    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')
  })
})

describe('Season selector', () => {
  it("shows each completed season's champion logo beside it", async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await user.click(screen.getByRole('combobox'))

    const option = (name: string) =>
      screen.getByRole('option', { name: new RegExp(`^${name}`) })
    expect(
      within(option('long')).getByRole('img', { name: 'Boston Celtics logo' })
    ).toBeInTheDocument()
    expect(within(option('active')).queryByRole('img')).not.toBeInTheDocument()
  })

  it('keeps the logo out of the closed selector', async () => {
    await renderWithRouter()
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('long')
    expect(within(trigger).queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('Data source badges', () => {
  const sourceBadge = () =>
    screen.getByRole('link', { name: /rankings source/i })

  it('names the source of the selected season beside the chart', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    expect(sourceBadge()).toHaveTextContent('Source: NBA.com')

    await chooseSeason(user, 'short')
    expect(sourceBadge()).toHaveTextContent('Source: ESPN')
  })

  it("names each season's source in the team history", async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await openTeamHistory(user)

    const badges = screen.getAllByRole('link', { name: /rankings source/i })
    expect(badges.map((badge) => badge.textContent)).toEqual([
      'Source: NBA.com',
      'Source: NBA.com',
      'Source: ESPN',
      'Source: NBA.com',
      'Source: NBA.com',
    ])
    expect(screen.getAllByText('AI-generated summary')).toHaveLength(1)
  })
})

describe('Playoff series badges', () => {
  const seriesList = () =>
    screen.queryByRole('list', { name: 'Playoff series' })
  const pin = (user: ReturnType<typeof userEvent.setup>, name: string) =>
    user.click(screen.getByText(name, { selector: 'text' }))

  it('appears in the chart view only while one playoff team is pinned', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    expect(seriesList()).not.toBeInTheDocument()

    await pin(user, 'Boston Celtics')
    const items = within(seriesList()!).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(within(items[0]).getByRole('button')).toHaveAccessibleName(
      'First round: defeated Detroit Pistons 4-0'
    )

    await pin(user, 'Miami Heat')
    const miami = within(seriesList()!).getAllByRole('button')
    expect(miami).toHaveLength(2)
    expect(miami[1]).toHaveAccessibleName(
      'Second round: lost to Boston Celtics 2-4'
    )

    await pin(user, 'Detroit Pistons')
    expect(seriesList()).not.toBeInTheDocument()
  })

  it('pins the opponent when a badge in the chart view is clicked', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await pin(user, 'Boston Celtics')

    await user.click(
      screen.getByRole('button', {
        name: 'Second round: defeated Miami Heat 4-2',
      })
    )
    const miami = within(seriesList()!).getAllByRole('button')
    expect(miami).toHaveLength(2)
    expect(miami[1]).toHaveAccessibleName(
      'Second round: lost to Boston Celtics 2-4'
    )

    await user.click(miami[1])
    expect(within(seriesList()!).getAllByRole('button')).toHaveLength(4)
  })

  it('shows on team history cards without leaving the history when clicked', async () => {
    const user = userEvent.setup()
    await renderWithRouter()
    await pin(user, 'Boston Celtics')
    await openTeamHistory(user)

    // Every fixture season except 'active' has playoff results
    const lists = screen.getAllByRole('list', { name: 'Playoff series' })
    expect(lists).toHaveLength(4)
    await user.click(within(lists[0]).getAllByRole('button')[0])
    expect(
      screen.getByRole('heading', { name: /Boston Celtics Team History/ })
    ).toBeInTheDocument()
  })
})

describe('Season addresses', () => {
  const path = (router: { state: { location: { pathname: string } } }) =>
    router.state.location.pathname

  it('lands on the latest season from the base address', async () => {
    const { router } = await renderWithRouter(['/'])
    expect(path(router)).toBe('/long')
    expect(screen.getByRole('combobox')).toHaveTextContent('long Season')
  })

  it('opens a season straight from its address', async () => {
    const { router } = await renderWithRouter(['/mid'])
    expect(path(router)).toBe('/mid')
    expect(shownWeeks()).toBe('1–21')
  })

  it('sends an unknown season to the latest season', async () => {
    const { router } = await renderWithRouter(['/1999-00'])
    expect(path(router)).toBe('/long')
    expect(shownWeeks()).toBe('1–26')
  })

  it('updates the address from the picker and goes back with history', async () => {
    const user = userEvent.setup()
    const { router } = await renderWithRouter(['/long'])
    await user.click(miamiLabel())

    await chooseSeason(user, 'mid')
    expect(path(router)).toBe('/mid')
    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')

    await act(() => router.navigate(-1))
    await settle()
    expect(path(router)).toBe('/long')
    expect(shownWeeks()).toBe('1–26')
  })

  it('shows a not-found page for an unknown address', async () => {
    await renderWithRouter(['/long/extra'])
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})

describe('Team history addresses', () => {
  const path = (router: { state: { location: { pathname: string } } }) =>
    router.state.location.pathname
  const cards = () => screen.getAllByRole('heading', { level: 2 })

  it('opens a team history from its address, ignoring letter case', async () => {
    await renderWithRouter(['/teamHistory/BOS'])
    await settle()
    expect(
      screen.getByRole('heading', { name: /Boston Celtics Team History/ })
    ).toBeInTheDocument()
    expect(cards().map((h) => h.textContent)).toEqual([
      'long',
      'mid',
      'short',
      'rising',
      'active',
    ])
  })

  it('shows team not found for an unknown team', async () => {
    await renderWithRouter(['/teamHistory/xyz'])
    expect(screen.getByText('Team not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to the rankings chart/i })
    ).toBeInTheDocument()
  })

  it('goes from the chart to the history and back to a season with the team pinned', async () => {
    const user = userEvent.setup()
    const { router } = await renderWithRouter(['/long'])
    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await openTeamHistory(user)
    expect(path(router)).toBe('/teamHistory/bos')

    await user.click(screen.getByRole('heading', { name: 'mid' }))
    await findChart()
    expect(path(router)).toBe('/mid')
    fireEvent.mouseLeave(chart())
    expect(
      screen.getByText('Boston Celtics', { selector: 'text' })
    ).toHaveAttribute('font-weight', '700')

    await act(() => router.navigate(-1))
    await settle()
    expect(path(router)).toBe('/teamHistory/bos')
  })

  it('pins the team when a card is opened from a shared history link', async () => {
    const user = userEvent.setup()
    await renderWithRouter(['/teamHistory/mia'])
    await settle()

    await user.click(screen.getByRole('heading', { name: 'long' }))
    await findChart()
    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '700')
  })
})
