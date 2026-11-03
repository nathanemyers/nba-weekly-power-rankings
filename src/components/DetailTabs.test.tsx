import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailTabs from './DetailTabs'
import { renderInSeason } from 'test/renderWithRouter'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { Team } from 'types'

vi.mock('data/seasons', async () => {
  const { buildRankings, PLAYOFFS, ROSTERS, STORYLINES } =
    await import('test/fixtures')
  const { mockSeasonModule } = await import('test/mockSeasons')
  return mockSeasonModule({
    long: {
      season: 'long',
      source: 'nba',
      maxWeek: 26,
      rankings: buildRankings(26),
      summaries: {
        bos: 'Boston led from the first week.',
        mia: 'Miami hovered at tenth.',
      },
      rosters: ROSTERS,
    },
    storied: {
      season: 'storied',
      source: 'nba',
      maxWeek: 8,
      rankings: buildRankings(8),
      playoffs: PLAYOFFS,
      storylines: STORYLINES,
    },
    bare: {
      season: 'bare',
      source: 'nba',
      maxWeek: 8,
      rankings: {},
    },
  })
})

async function renderTabs(pinned: Team[] = [], season = 'long') {
  const result = await renderInSeason(<DetailTabs />, season)
  pin(result.store, pinned)
  return result
}

function pin(
  store: Awaited<ReturnType<typeof renderInSeason>>['store'],
  teams: Team[]
) {
  act(() => {
    store.dispatch(setPinnedTeams(teams))
  })
}

const enabledTabs = () =>
  screen
    .queryAllByRole('tab')
    .filter((tab) => !tab.hasAttribute('disabled'))
    .map((tab) => tab.textContent)
const selectedTab = () =>
  screen
    .getAllByRole('tab')
    .find((tab) => tab.getAttribute('aria-selected') === 'true')?.textContent

afterEach(cleanup)

describe('DetailTabs', () => {
  it('shows Awards by default and disables team tabs when nothing is pinned', async () => {
    await renderTabs()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Summary',
      'Trends',
      'Roster',
      'Awards',
    ])
    expect(enabledTabs()).toEqual(['Trends', 'Awards'])
    expect(selectedTab()).toBe('Awards')
  })

  it('opens on Summary when a team is pinned', async () => {
    await renderTabs([Team.Boston])
    expect(enabledTabs()).toEqual(['Summary', 'Trends', 'Roster', 'Awards'])
    expect(selectedTab()).toBe('Summary')
  })

  it('keeps Roster selected when another team with a roster is pinned', async () => {
    const user = userEvent.setup()
    const { store } = await renderTabs([Team.Boston])
    await user.click(screen.getByRole('tab', { name: 'Roster' }))
    pin(store, [Team.Detroit])
    expect(selectedTab()).toBe('Roster')
  })

  it('keeps the chosen tab across pin changes while it is available', async () => {
    const user = userEvent.setup()
    const { store } = await renderTabs([Team.Boston])
    await user.click(screen.getByRole('tab', { name: 'Trends' }))
    pin(store, [Team.Miami])
    expect(selectedTab()).toBe('Trends')
  })

  it('falls back to the default when the chosen tab disappears', async () => {
    const user = userEvent.setup()
    const { store } = await renderTabs([Team.Boston])
    await user.click(screen.getByRole('tab', { name: 'Roster' }))
    pin(store, [])
    expect(selectedTab()).toBe('Awards')
  })

  it('opens on Summary with season storylines when the season has them and nothing is pinned', async () => {
    await renderTabs([], 'storied')
    expect(enabledTabs()).toContain('Summary')
    expect(selectedTab()).toBe('Summary')
    expect(
      within(screen.getByRole('tabpanel')).getByRole('list', {
        name: 'storied storylines',
      })
    ).toBeInTheDocument()
  })

  it('offers Summary for a pinned team with storylines but no AI summary', async () => {
    await renderTabs([Team.Miami], 'storied')
    expect(enabledTabs()).toContain('Summary')
    expect(selectedTab()).toBe('Summary')
    expect(
      within(screen.getByRole('tabpanel')).getByRole('link', {
        name: 'miami-slump headline',
      })
    ).toBeInTheDocument()
  })

  it('renders nothing when no tab has content', async () => {
    await renderTabs([], 'bare')
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('pins a team chosen from Trends', async () => {
    const user = userEvent.setup()
    const { store } = await renderTabs()
    await user.click(screen.getByRole('tab', { name: 'Trends' }))
    const panel = screen.getByRole('tabpanel')
    await user.click(
      within(panel).getAllByRole('button', { name: /Detroit Pistons/ })[0]
    )
    expect(getPinnedTeams(store.getState())).toEqual([Team.Detroit])
  })
})
