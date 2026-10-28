import { describe, expect, it } from 'vitest'
import { shortPlayerName } from './shortPlayerName'

describe('shortPlayerName', () => {
  it.each([
    ['LeBron James', 'L. James'],
    ['Gary Trent Jr.', 'G. Trent Jr.'],
    ['Karl-Anthony Towns', 'K. Towns'],
    ['Shai Gilgeous-Alexander', 'S. Gilgeous-Alexander'],
    ['Nenê', 'Nenê'],
  ])('shortens %s to %s', (name, expected) => {
    expect(shortPlayerName(name)).toBe(expected)
  })
})
