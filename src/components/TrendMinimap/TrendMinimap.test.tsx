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
    expect(container.querySelectorAll('path')).toHaveLength(3)
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
    const paths = Array.from(container.querySelectorAll('path'))
    const rects = Array.from(container.querySelectorAll('clipPath rect'))

    expect(paths.map((p) => p.getAttribute('data-band'))).toEqual([
      'top',
      'middle',
      'bottom',
    ])
    expect(paths.map((p) => p.getAttribute('class'))).toEqual([
      'stroke-rank-up',
      'stroke-rank-mid',
      'stroke-rank-down',
    ])
    expect(
      paths.every((p) => p.getAttribute('d') === paths[0].getAttribute('d'))
    ).toBe(true)
    paths.forEach((p) => expect(p.getAttribute('stroke')).toBeNull())
    const tops = rects.map((r) => Number(r.getAttribute('y')))
    expect(tops[0]).toBeLessThan(tops[1])
    expect(tops[1]).toBeLessThan(tops[2])
  })

  it('gives each instance its own clip paths', () => {
    const { container } = render(
      <>
        <TrendMinimap team={Team.Boston} season={full} />
        <TrendMinimap team={Team.Miami} season={full} />
      </>
    )
    const ids = Array.from(container.querySelectorAll('clipPath')).map((c) =>
      c.getAttribute('id')
    )

    expect(ids).toHaveLength(6)
    expect(ids.filter((id, i) => ids.indexOf(id) === i)).toHaveLength(6)
    ids.forEach((id) => expect(id).toMatch(/^[a-zA-Z0-9_-]+$/))
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
