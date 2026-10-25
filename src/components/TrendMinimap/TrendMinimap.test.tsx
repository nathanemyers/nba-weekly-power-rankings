import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import TrendMinimap from './TrendMinimap'
import { Team } from 'types'
import { renderWithStore } from 'test/renderWithStore'

// 'full' has an unbroken Boston, a Lakers gap at week 10 and Miami low; 'early' has Miami ending at week 21
vi.mock('data/seasons', async () => {
  const { weeklyRankings } = await import('test/fixtures')
  return {
    seasons: ['full', 'early'],
    seasonData: {
      full: {
        season: 'full',
        source: 'nba',
        maxWeek: 25,
        rankings: {
          bos: weeklyRankings(25, 5),
          lal: weeklyRankings(25, 5).filter((r) => r.week !== 10),
          mia: weeklyRankings(25, 20),
        },
      },
      early: {
        season: 'early',
        source: 'nba',
        maxWeek: 24,
        rankings: {
          bos: weeklyRankings(24, 5),
          mia: weeklyRankings(21, 5),
        },
      },
    },
  }
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
    const { container } = renderWithStore(
      <TrendMinimap team={Team.Boston} seasonId="full" />
    )

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(container.querySelectorAll('path')).toHaveLength(1)
    expect(moveCount(pathOf(container))).toBe(1)
  })

  it('breaks the line at a missing week', () => {
    const { container } = renderWithStore(
      <TrendMinimap team={Team.LALakers} seasonId="full" />
    )

    expect(moveCount(pathOf(container))).toBe(2)
  })

  it('colors the line by rank band, green over yellow over red', () => {
    const { container } = renderWithStore(
      <TrendMinimap team={Team.Boston} seasonId="full" />
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
    const { container } = renderWithStore(
      <>
        <TrendMinimap team={Team.Boston} seasonId="full" />
        <TrendMinimap team={Team.Miami} seasonId="full" />
      </>
    )
    const ids = Array.from(container.querySelectorAll('linearGradient')).map(
      (g) => g.getAttribute('id')
    )

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('stops short of the right edge when the data ends early', () => {
    const full = renderWithStore(
      <TrendMinimap team={Team.Boston} seasonId="early" width={96} />
    )
    const early = renderWithStore(
      <TrendMinimap team={Team.Miami} seasonId="early" width={96} />
    )

    expect(lastX(pathOf(early.container))).toBeLessThan(
      lastX(pathOf(full.container))
    )
    expect(lastX(pathOf(full.container))).toBeLessThan(96)
  })
})
