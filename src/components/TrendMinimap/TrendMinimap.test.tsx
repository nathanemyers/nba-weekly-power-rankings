import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import TrendMinimap from './TrendMinimap'
import { Team } from 'types'
import { parseSeason } from '@/data/seasonData'
import { weeklyRankings } from 'test/fixtures'

// 'full' has an unbroken Boston, a Lakers gap at week 10 and Miami low; 'early' has Miami ending at week 21
const full = parseSeason('full', {
  season: 'full',
  source: 'nba',
  maxWeek: 25,
  rankings: {
    bos: weeklyRankings(25, 5),
    lal: weeklyRankings(25, 5).filter((r) => r.week !== 10),
    mia: weeklyRankings(25, 20),
  },
})
const early = parseSeason('early', {
  season: 'early',
  source: 'nba',
  maxWeek: 24,
  rankings: {
    bos: weeklyRankings(24, 5),
    mia: weeklyRankings(21, 5),
  },
})

afterEach(cleanup)

const pathOf = (container: HTMLElement) =>
  container.querySelector('path') as SVGPathElement
const moveCount = (path: SVGPathElement) =>
  (path.getAttribute('d') ?? '').match(/M/g)?.length ?? 0
const lastX = (path: SVGPathElement) => {
  const points = (path.getAttribute('d') ?? '').split(' ')
  return Number(points[points.length - 1].slice(1).split(',')[0])
}

describe('TrendMinimap', () => {
  it('draws one decorative line for an unbroken season', () => {
    const { container } = render(
      <TrendMinimap team={Team.Boston} season={full} />
    )

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(container.querySelectorAll('path')).toHaveLength(1)
    expect(moveCount(pathOf(container))).toBe(1)
  })

  it('breaks the line at a missing week', () => {
    const { container } = render(
      <TrendMinimap team={Team.LALakers} season={full} />
    )

    expect(moveCount(pathOf(container))).toBe(2)
  })

  it('colors the line by rank band, green over yellow over red', () => {
    const { container } = render(
      <TrendMinimap team={Team.Boston} season={full} />
    )
    const gradient = container.querySelector('linearGradient')
    const stops = Array.from(container.querySelectorAll('stop'))

    expect(gradient).toHaveAttribute('gradientUnits', 'userSpaceOnUse')
    expect(pathOf(container)).toHaveAttribute(
      'stroke',
      `url(#${gradient?.getAttribute('id')})`
    )
    expect(stops.map((s) => s.getAttribute('data-band'))).toEqual([
      'top',
      'middle',
      'middle',
      'bottom',
    ])
    expect(stops[0].getAttribute('offset')).toBe(
      stops[1].getAttribute('offset')
    )
    expect(stops[2].getAttribute('offset')).toBe(
      stops[3].getAttribute('offset')
    )
    expect(Number(stops[0].getAttribute('offset'))).toBeLessThan(
      Number(stops[2].getAttribute('offset'))
    )
  })

  it('gives each instance its own gradient', () => {
    const { container } = render(
      <>
        <TrendMinimap team={Team.Boston} season={full} />
        <TrendMinimap team={Team.Miami} season={full} />
      </>
    )
    const ids = Array.from(container.querySelectorAll('linearGradient')).map(
      (g) => g.getAttribute('id')
    )

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('stops short of the right edge when the data ends early', () => {
    const fullLine = render(
      <TrendMinimap team={Team.Boston} season={early} width={96} />
    )
    const earlyLine = render(
      <TrendMinimap team={Team.Miami} season={early} width={96} />
    )

    expect(lastX(pathOf(earlyLine.container))).toBeLessThan(
      lastX(pathOf(fullLine.container))
    )
    expect(lastX(pathOf(fullLine.container))).toBeLessThan(96)
  })
})
