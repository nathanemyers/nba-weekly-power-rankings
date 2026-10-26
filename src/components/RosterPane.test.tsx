import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import RosterPane from './RosterPane'
import { TooltipProvider } from './ui/tooltip'
import { renderWithStore } from 'test/renderWithStore'
import { setPinnedTeams } from '@/store/slices/chart'
import { setSelectedSeason } from '@/store/slices/UI'
import { Team } from 'types'

vi.mock(
  'data/seasons',
  async () => (await import('test/mockSeasons')).mockSeasons
)

function renderPane(pinned: Team[]) {
  const result = renderWithStore(
    <TooltipProvider>
      <RosterPane />
    </TooltipProvider>
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
  it("lists the pinned team's players in roster order", () => {
    renderPane([Team.Boston])
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

  it('formats every stat to one decimal and shows a dash for a missing PER', () => {
    renderPane([Team.Boston])
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

  it('names each stat in full on its column header', () => {
    renderPane([Team.Boston])
    expect(screen.getByRole('columnheader', { name: 'PTS' })).toHaveAttribute(
      'title',
      'Points per game'
    )
    expect(screen.getByRole('columnheader', { name: 'PER' })).toHaveAttribute(
      'title',
      'Player Efficiency Rating'
    )
  })

  it('marks players who joined or left mid-season', () => {
    renderPane([Team.Boston])
    const [pierce, garnett, moves, scrub] = bodyRows()
    expect(within(pierce).queryAllByRole('img')).toEqual([])
    expect(
      within(garnett).getByRole('img', {
        name: 'Joined from Minnesota Timberwolves mid-season',
      })
    ).toBeInTheDocument()
    expect(
      within(moves)
        .getAllByRole('img')
        .map((mark) => mark.getAttribute('aria-label'))
    ).toEqual([
      'Joined from Detroit Pistons mid-season',
      'Left for Miami Heat mid-season',
    ])
    expect(
      within(scrub).getByRole('img', {
        name: 'Left for Toronto Raptors mid-season',
      })
    ).toBeInTheDocument()
  })

  it('names the head coaches in order with their records', () => {
    renderPane([Team.Boston])
    const line = screen.getByText(/Head coaches:/)
    expect(line).toHaveTextContent(
      /^Head coaches: Doc Rivers \(12-8\) → then Brad Stevens \(50-12\)$/
    )
    expect(within(line).getByText('then')).toHaveClass('sr-only')
  })

  it('names a single head coach', () => {
    renderPane([Team.Detroit])
    expect(screen.getByText(/Head coach:/)).toHaveTextContent(
      'Head coach: Flip Saunders (59-23)'
    )
  })

  it('colors stats for regular players and leaves small samples plain', () => {
    renderPane([Team.Boston])
    const [pierce, , , scrub] = bodyRows()
    const ratings = (row: HTMLElement) =>
      within(row)
        .getAllByRole('cell')
        .slice(4)
        .map((cell) => cell.getAttribute('data-rating'))
    expect(ratings(pierce)).toEqual([
      'good',
      'fair',
      'good',
      'good',
      'poor',
      'good',
    ])
    expect(within(pierce).getAllByRole('cell')[4]).toHaveClass('text-stat-good')
    expect(ratings(scrub)).toEqual([null, null, null, null, null, null])
  })

  it('renders nothing without exactly one pinned team', () => {
    const { container } = renderPane([])
    expect(container).toBeEmptyDOMElement()
    cleanup()
    expect(
      renderPane([Team.Boston, Team.Miami]).container
    ).toBeEmptyDOMElement()
  })

  it('renders nothing when the team has no roster', () => {
    expect(renderPane([Team.Miami]).container).toBeEmptyDOMElement()
    cleanup()
    const { store, container } = renderPane([Team.Boston])
    act(() => {
      store.dispatch(setSelectedSeason('short'))
    })
    expect(container).toBeEmptyDOMElement()
  })
})
