import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayoffSeriesBadges from './PlayoffSeriesBadges'
import { TooltipProvider } from '../ui/tooltip'
import { PLAYOFF_SERIES } from 'test/fixtures'
import { PlayoffStage, Team, type SeriesResult } from 'types'

const renderBadges = (series: SeriesResult[] | undefined) =>
  render(
    <TooltipProvider>
      <PlayoffSeriesBadges series={series} />
    </TooltipProvider>
  )

const badges = () =>
  within(screen.getByRole('list', { name: 'Playoff series' })).getAllByRole(
    'listitem'
  )

afterEach(cleanup)

describe('PlayoffSeriesBadges', () => {
  it("shows a champion's run in round order with games and medals", () => {
    renderBadges(PLAYOFF_SERIES[Team.Boston])

    const items = badges()
    expect(items).toHaveLength(4)
    expect(
      items.map((item) =>
        within(item).getByRole('button').getAttribute('aria-label')
      )
    ).toEqual([
      'First round: defeated Detroit Pistons 4-0',
      'Second round: defeated Miami Heat 4-2',
      'Conference finals: defeated Toronto Raptors 4-3',
      'Finals: defeated Los Angeles Lakers 4-1',
    ])
    expect(items.map((item) => item.textContent)).toEqual([
      '4🥉',
      '6🥈',
      '7🥇',
      '5💍',
    ])
    expect(items[0].querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('det')
    )
  })

  it('marks won series green and the lost series red', () => {
    renderBadges(PLAYOFF_SERIES[Team.Miami])

    const [first, last] = badges().map((item) =>
      within(item).getByRole('button')
    )
    expect(first).toHaveClass('border-series-won')
    expect(last).toHaveClass('border-series-lost')
    expect(last).toHaveAccessibleName(
      'Second round: lost to Boston Celtics 2-4'
    )
    expect(last).toHaveTextContent('6🥈')
  })

  it('gives a lost Finals the cup instead of the ring', () => {
    renderBadges([
      { round: PlayoffStage.Finals, opponent: Team.Boston, wins: 1, losses: 4 },
    ])
    expect(badges()[0]).toHaveTextContent('5🏆')
  })

  it('renders nothing without series', () => {
    const { container } = renderBadges(undefined)
    expect(container).toBeEmptyDOMElement()
    cleanup()
    const empty = renderBadges([])
    expect(empty.container).toBeEmptyDOMElement()
  })

  it('keeps clicks from reaching a parent', async () => {
    const user = userEvent.setup()
    const onParentClick = vi.fn()
    render(
      <TooltipProvider>
        <div onClick={onParentClick}>
          <PlayoffSeriesBadges series={PLAYOFF_SERIES[Team.Miami]} />
        </div>
      </TooltipProvider>
    )

    await user.click(screen.getByRole('button', { name: /first round/i }))
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('passes the clicked opponent to onTeamClick', async () => {
    const user = userEvent.setup()
    const onTeamClick = vi.fn()
    render(
      <TooltipProvider>
        <PlayoffSeriesBadges
          series={PLAYOFF_SERIES[Team.Boston]}
          onTeamClick={onTeamClick}
        />
      </TooltipProvider>
    )

    await user.click(screen.getByRole('button', { name: /conference finals/i }))
    expect(onTeamClick).toHaveBeenCalledWith(Team.Toronto)
  })

  it('shows the result in a tooltip on hover and on keyboard focus', async () => {
    const user = userEvent.setup()
    renderBadges(PLAYOFF_SERIES[Team.Miami])

    await user.hover(screen.getByRole('button', { name: /first round/i }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'First round: defeated Orlando Magic 4-3'
    )

    await user.unhover(screen.getByRole('button', { name: /first round/i }))
    await user.tab()
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Second round: lost to Boston Celtics 2-4'
    )
  })
})
