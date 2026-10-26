import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { mockReducedMotion } from 'test/fixtures'
import { renderWithStore } from 'test/renderWithStore'

// Fixture seasons: 26 weeks, 21 weeks, one short enough to fit the window (from ESPN), and two with rank swings
vi.mock('data/seasons', async () => {
  const { buildRankings, buildSwingRankings, PLAYOFF_SERIES, PLAYOFFS } =
    await import('./test/fixtures')
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
  return {
    seasons: ['long', 'mid', 'short', 'rising', 'active'],
    seasonData: {
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
  }
})

const earlier = () => screen.getByRole('button', { name: /earlier/i })
const later = () => screen.getByRole('button', { name: /later/i })
const zoomOut = () => screen.getByRole('button', { name: /zoom out/i })
const zoomIn = () => screen.getByRole('button', { name: /zoom in/i })
const chart = () => screen.getByRole('img', { name: /line chart/i })
const miamiLabel = () => screen.getByText('Miami Heat', { selector: 'text' })
const chooseSeason = async (
  user: ReturnType<typeof userEvent.setup>,
  season: string
) => {
  await user.click(screen.getByRole('combobox'))
  await user.click(
    screen.getByRole('option', { name: new RegExp(`^${season}`) })
  )
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
  it('starts on the full season and zooms in to a 10-week span', () => {
    const { container } = renderWithStore(<App />)
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
    renderWithStore(<App />)
    fireEvent.click(zoomIn())

    await user.click(later())
    expect(shownWeeks()).toBe('2–12')
    expect(
      screen.getByText('Detroit Pistons', { selector: 'text' })
    ).toHaveAttribute('y', String(30 + (19 / 29) * 510))

    await user.click(earlier())
    expect(shownWeeks()).toBe('1–11')
  })

  it('travels the whole season with the arrow keys, stopping at its ends', () => {
    renderWithStore(<App />)
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
    const { container } = renderWithStore(<App />)

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
    renderWithStore(<App />)
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
    const { container } = renderWithStore(<App />)

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
    renderWithStore(<App />)
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
    const { container } = renderWithStore(<App />)

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
    renderWithStore(<App />)

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
    renderWithStore(<App />)

    await user.click(miamiLabel())
    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '700')

    fireEvent.click(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')
  })
})

describe('Team AI summary', () => {
  const summaryButton = () => screen.getByRole('button', { name: 'AI Summary' })

  it("shows the pinned team's labeled summary on hover and disables on unpin", async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    expect(summaryButton()).toBeDisabled()

    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    expect(summaryButton()).not.toBeDisabled()

    await user.hover(summaryButton())
    expect(
      await screen.findByText('Boston led from the first week.')
    ).toBeInTheDocument()
    expect(screen.getByText('AI-generated summary')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Boston Celtics' })
    ).toBeInTheDocument()

    await user.unhover(summaryButton())
    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    expect(summaryButton()).toBeDisabled()
  })

  it('disables the summary when switching seasons clears the pin', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)

    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await chooseSeason(user, 'mid')

    expect(summaryButton()).toBeDisabled()
    expect(shownWeeks()).toBe('1–21')
  })
})

describe('Rank swings hover card', () => {
  const trendsButton = () =>
    screen.queryByRole('button', { name: 'Season Trends' })
  const openTrends = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.hover(trendsButton()!)
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
    renderWithStore(<App />)
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

  it('is absent for a season that has not completed', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await chooseSeason(user, 'active')

    expect(trendsButton()).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'AI Summary' })
    ).not.toBeInTheDocument()
  })

  it('pins the clicked team, replacing an earlier pin', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
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
    renderWithStore(<App />)
    await chooseSeason(user, 'rising')

    await user.click(screen.getByText('Indiana Pacers', { selector: 'text' }))
    await openTrends(user)

    expect(toggle('Indiana Pacers')).toHaveAttribute('aria-pressed', 'true')
  })

  it("clears the pin and shows the new season's teams on a season switch", async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
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

  it('disappears and drops the pin when switching to a season that has not completed', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await chooseSeason(user, 'rising')
    await openTrends(user)
    await user.click(toggle('Indiana Pacers'))
    await user.unhover(trendsButton()!)

    await chooseSeason(user, 'active')

    expect(trendsButton()).not.toBeInTheDocument()
    fireEvent.mouseLeave(chart())
    expect(
      screen.getByText('Indiana Pacers', { selector: 'text' })
    ).toHaveAttribute('font-weight', '400')
  })

  it('clears a pin made in the chart on a season switch', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await user.click(miamiLabel())

    await chooseSeason(user, 'mid')

    fireEvent.mouseLeave(chart())
    expect(miamiLabel()).toHaveAttribute('font-weight', '400')
  })
})

describe('Season selector', () => {
  it("shows each completed season's champion logo beside it", async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await user.click(screen.getByRole('combobox'))

    const option = (name: string) =>
      screen.getByRole('option', { name: new RegExp(`^${name}`) })
    expect(
      within(option('long')).getByRole('img', { name: 'Boston Celtics logo' })
    ).toBeInTheDocument()
    expect(within(option('active')).queryByRole('img')).not.toBeInTheDocument()
  })

  it('keeps the logo out of the closed selector', () => {
    renderWithStore(<App />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('long')
    expect(within(trigger).queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('Data source badges', () => {
  const sourceBadge = () => screen.getByRole('link', { name: /rankings source/i })

  it('names the source of the selected season beside the chart', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    expect(sourceBadge()).toHaveTextContent('Source: NBA.com')

    await chooseSeason(user, 'short')
    expect(sourceBadge()).toHaveTextContent('Source: ESPN')
  })

  it("names each season's source in the team history", async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await user.click(screen.getByText('Boston Celtics', { selector: 'text' }))
    await user.click(screen.getByRole('button', { name: 'Team History' }))

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
  const seriesList = () => screen.queryByRole('list', { name: 'Playoff series' })
  const pin = (user: ReturnType<typeof userEvent.setup>, name: string) =>
    user.click(screen.getByText(name, { selector: 'text' }))

  it('appears in the chart view only while one playoff team is pinned', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    expect(seriesList()).not.toBeInTheDocument()

    await pin(user, 'Boston Celtics')
    const items = within(seriesList()!).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(within(items[0]).getByRole('button')).toHaveAccessibleName(
      'First round: beat Detroit Pistons 4-0'
    )

    await pin(user, 'Miami Heat')
    const miami = within(seriesList()!).getAllByRole('button')
    expect(miami).toHaveLength(2)
    expect(miami[1]).toHaveAccessibleName('Second round: lost to Boston Celtics 2-4')

    await pin(user, 'Detroit Pistons')
    expect(seriesList()).not.toBeInTheDocument()
  })

  it("pins the opponent when a badge in the chart view is clicked", async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await pin(user, 'Boston Celtics')

    await user.click(screen.getByRole('button', { name: 'Second round: beat Miami Heat 4-2' }))
    const miami = within(seriesList()!).getAllByRole('button')
    expect(miami).toHaveLength(2)
    expect(miami[1]).toHaveAccessibleName('Second round: lost to Boston Celtics 2-4')

    await user.click(miami[1])
    expect(within(seriesList()!).getAllByRole('button')).toHaveLength(4)
  })

  it('shows on team history cards without leaving the history when clicked', async () => {
    const user = userEvent.setup()
    renderWithStore(<App />)
    await pin(user, 'Boston Celtics')
    await user.click(screen.getByRole('button', { name: 'Team History' }))

    // Every fixture season except 'active' has playoff results
    const lists = screen.getAllByRole('list', { name: 'Playoff series' })
    expect(lists).toHaveLength(4)
    await user.click(within(lists[0]).getAllByRole('button')[0])
    expect(
      screen.getByRole('heading', { name: /Boston Celtics Team History/ })
    ).toBeInTheDocument()
  })
})
