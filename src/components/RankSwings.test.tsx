import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RankSwings from './RankSwings'
import { renderInSeason } from 'test/renderWithRouter'
import { getPinnedTeams } from '@/store/slices/chart'
import { Team } from 'types'

vi.mock('data/seasons', async () => {
  const { weeklyRankings } = await import('test/fixtures')
  const { mockSeasonModule } = await import('test/mockSeasons')
  // Weeks 1-2 hold the start rank (week 1 is preseason), every later week holds the end rank
  const swing = (start: number, end: number) =>
    weeklyRankings(10, end).map((r) =>
      r.week <= 2 ? { ...r, rank: start } : r
    )
  return mockSeasonModule({
    swings: {
      season: 'swings',
      source: 'nba',
      maxWeek: 10,
      rankings: {
        atl: swing(20, 5),
        bos: swing(10, 2),
        bkn: swing(12, 4),
        cha: swing(3, 3),
        chi: swing(15, 10),
        cle: swing(8, 6),
        dal: swing(1, 20),
        den: swing(4, 14),
        det: swing(6, 12),
        gsw: swing(5, 9),
        hou: swing(7, 11),
        ind: swing(9, 9),
      },
    },
  })
})

afterEach(cleanup)

const list = (name: string) =>
  within(screen.getByRole('region', { name })).getByRole('list')

const rows = (name: string) => within(list(name)).getAllByRole('listitem')

describe('RankSwings', () => {
  it('shows the 5 biggest risers and fallers, largest change first', async () => {
    await renderInSeason(<RankSwings />, 'swings')
    expect(rows('Most improved')).toHaveLength(5)
    expect(rows('Most declined')).toHaveLength(5)
    expect(rows('Most improved')[0]).toHaveTextContent('Atlanta Hawks')
    expect(rows('Most declined')[0]).toHaveTextContent('Dallas Mavericks')
  })

  it('shows the signed rank change on each row', async () => {
    await renderInSeason(<RankSwings />, 'swings')
    expect(rows('Most improved')[0]).toHaveTextContent('+15')
    expect(rows('Most improved')[0]).toHaveTextContent('up 15 places')
    expect(rows('Most declined')[0]).toHaveTextContent('−19')
    expect(rows('Most declined')[0]).toHaveTextContent('down 19 places')
  })

  it('uses list-row sized logos', async () => {
    await renderInSeason(<RankSwings />, 'swings')
    const logo = within(rows('Most improved')[0]).getByRole('img')
    expect(logo).toHaveClass('size-5')
  })

  it('stacks improving above declining and splits into columns only at sm', async () => {
    await renderInSeason(<RankSwings />, 'swings')
    const improved = screen.getByRole('region', { name: 'Most improved' })
    const declined = screen.getByRole('region', { name: 'Most declined' })
    expect(
      improved.compareDocumentPosition(declined) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    const wrapper = improved.parentElement!
    expect(wrapper).toHaveClass('grid', 'sm:grid-cols-2')
    expect(wrapper.className).not.toMatch(/(^|\s)grid-cols-/)
  })

  it('pins the clicked team and marks only its row pressed', async () => {
    const user = userEvent.setup()
    const { store } = await renderInSeason(<RankSwings />, 'swings')
    const buttons = () => screen.getAllByRole('button')
    const pressed = () =>
      buttons().filter((b) => b.getAttribute('aria-pressed') === 'true')

    expect(buttons()).toHaveLength(10)
    buttons().forEach((b) => expect(b).toHaveClass('cursor-pointer'))

    await user.click(
      within(list('Most improved')).getByRole('button', {
        name: /Atlanta Hawks/,
      })
    )
    expect(getPinnedTeams(store.getState())).toEqual([Team.Atlanta])
    expect(pressed()).toHaveLength(1)
    expect(pressed()[0]).toHaveAccessibleName(/Atlanta Hawks/)

    await user.click(
      within(list('Most declined')).getByRole('button', {
        name: /Dallas Mavericks/,
      })
    )
    expect(getPinnedTeams(store.getState())).toEqual([Team.Dallas])
    expect(pressed()).toHaveLength(1)
    expect(pressed()[0]).toHaveAccessibleName(/Dallas Mavericks/)
  })
})
