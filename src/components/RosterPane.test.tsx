import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RosterPane from './RosterPane'
import { renderInSeason } from 'test/renderWithRouter'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { Team } from 'types'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

async function renderPane(pinned: Team[], season = 'long') {
  const result = await renderInSeason(
    <RosterPane />,
    season
  )
  act(() => {
    result.store.dispatch(setPinnedTeams(pinned))
  })
  return result
}

const bodyRows = () =>
  within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')
const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)

afterEach(cleanup)

describe('RosterPane', () => {
  it("lists the pinned team's players in roster order", async () => {
    await renderPane([Team.Boston])
    expect(
      screen.getByRole('heading', { name: 'Boston Celtics roster, long' })
    ).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(4)
    expect(cells(bodyRows()[0])).toEqual([
      'Paul Pierce',
      'SF',
      '30',
      '80',
      '19.6',
      '5.1',
      '4.5',
      '1.3',
      '2.9',
      '19.8',
    ])
  })

  it('formats every stat to one decimal and shows a dash for a missing PER', async () => {
    await renderPane([Team.Boston])
    expect(cells(bodyRows()[3])).toEqual([
      'Joe Scrub',
      'C',
      '27',
      '3',
      '10.0',
      '4.0',
      '2.0',
      '1.0',
      '1.5',
      '–',
    ])
  })

  it('names each stat in full on its column header', async () => {
    await renderPane([Team.Boston])
    expect(screen.getByRole('columnheader', { name: 'PTS' })).toHaveAttribute(
      'title',
      'Points per game'
    )
    expect(screen.getByRole('columnheader', { name: 'PER' })).toHaveAttribute(
      'title',
      'Player Efficiency Rating'
    )
  })

  it('marks players who joined or left mid-season', async () => {
    await renderPane([Team.Boston])
    const [pierce, garnett, moves, scrub] = bodyRows()
    expect(within(pierce).queryAllByRole('button')).toEqual([])
    expect(
      within(garnett).getByRole('button', {
        name: 'Joined from Minnesota Timberwolves mid-season',
      })
    ).toBeInTheDocument()
    expect(
      within(moves)
        .getAllByRole('button')
        .map((mark) => mark.getAttribute('aria-label'))
    ).toEqual([
      'Joined from Detroit Pistons mid-season',
      'Left for Miami Heat mid-season',
    ])
    expect(
      within(scrub).getByRole('button', {
        name: 'Left for Toronto Raptors mid-season',
      })
    ).toBeInTheDocument()
  })

  it("shows each move as a badge with an arrow and the other team's logo, after the name", async () => {
    await renderPane([Team.Boston])
    const moves = bodyRows()[2]
    const [joined, left] = within(moves).getAllByRole('button')
    expect(joined.querySelector('svg')).toHaveClass('lucide-arrow-left')
    expect(joined.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('det')
    )
    expect(left.querySelector('svg')).toHaveClass('lucide-arrow-right')
    expect(left.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('mia')
    )
    expect(joined.lastElementChild?.tagName).toBe('IMG')
    const nameCell = within(moves).getAllByRole('cell')[0]
    expect(nameCell.firstElementChild).toHaveClass('justify-between')
    expect(joined).toHaveClass('text-move-joined')
    expect(left).toHaveClass('text-move-left')
  })

  it('pins the other team when a move badge is clicked', async () => {
    const { store } = await renderPane([Team.Boston])
    await userEvent.click(
      screen.getByRole('button', { name: 'Left for Miami Heat mid-season' })
    )
    expect(getPinnedTeams(store.getState())).toEqual([Team.Miami])
  })

  it('names the head coaches in order with their records', async () => {
    await renderPane([Team.Boston])
    const line = screen.getByText(/Head coaches:/)
    expect(line).toHaveTextContent(
      /^Head coaches: Doc Rivers \(12-8\) → then Brad Stevens \(50-12\)$/
    )
    expect(within(line).getByText('then')).toHaveClass('sr-only')
  })

  it('names a single head coach', async () => {
    await renderPane([Team.Detroit])
    expect(screen.getByText(/Head coach:/)).toHaveTextContent(
      'Head coach: Flip Saunders (59-23)'
    )
  })

  it('colors stats for regular players and leaves small samples plain', async () => {
    await renderPane([Team.Boston])
    const [pierce, , , scrub] = bodyRows()
    const ratings = (row: HTMLElement) =>
      within(row)
        .getAllByRole('cell')
        .slice(4)
        .map((cell) => cell.getAttribute('data-rating'))
    expect(ratings(pierce)).toEqual([
      'elite',
      'fair',
      'good',
      'good',
      'poor',
      'good',
    ])
    expect(within(pierce).getAllByRole('cell')[4]).toHaveClass(
      'text-stat-elite'
    )
    expect(ratings(scrub)).toEqual([null, null, null, null, null, null])
  })

  it('shows a color key with each band labeled by its share', async () => {
    await renderPane([Team.Boston])
    const key = screen.getByRole('img', { name: /^Stat colors/ })
    expect(key).toHaveAccessibleName(
      'Stat colors, lowest to highest: red 25%, yellow 50%, green 15%, purple 10%. Fewer turnovers rate higher.'
    )
    expect(key.firstElementChild?.textContent).toBe('25%50%15%10%')
    const segments = [...(key.lastElementChild?.children ?? [])]
    expect(segments.map((segment) => segment.className)).toEqual([
      expect.stringContaining('bg-stat-poor'),
      expect.stringContaining('bg-stat-fair'),
      expect.stringContaining('bg-stat-good'),
      expect.stringContaining('bg-stat-elite'),
    ])
    expect(
      segments.map((segment) => (segment as HTMLElement).style.flexGrow)
    ).toEqual(['25', '50', '15', '10'])
    expect(screen.queryByText(/Stats are colored/)).toBeNull()
  })

  it('renders nothing without exactly one pinned team', async () => {
    const { container } = await renderPane([])
    expect(container).toBeEmptyDOMElement()
    cleanup()
    expect(
      (await renderPane([Team.Boston, Team.Miami])).container
    ).toBeEmptyDOMElement()
  })

  it('renders nothing when the team has no roster', async () => {
    expect((await renderPane([Team.Miami])).container).toBeEmptyDOMElement()
    cleanup()
    const { container } = await renderPane([Team.Boston], 'short')
    expect(container).toBeEmptyDOMElement()
  })
})
