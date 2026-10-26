import { expect, it } from 'vitest'
import { seasonData, seasons } from 'data/seasons'
import { loadSeasons } from './slices/seasons/loadSeasons'

it('validates every bundled season', () => {
  const state = loadSeasons(seasons, seasonData)
  expect(state.invalidSeasons).toEqual([])
  expect(state.order).toHaveLength(22)
})

it('gives every team in every bundled season a roster and a head coach', () => {
  const state = loadSeasons(seasons, seasonData)
  for (const season of Object.values(state.seasons)) {
    for (const team of season.teams) {
      expect(
        team.roster?.length,
        `${season.name} ${team.teamId} roster`
      ).toBeGreaterThan(0)
      expect(
        team.coaches?.length,
        `${season.name} ${team.teamId} coaches`
      ).toBeGreaterThan(0)
    }
  }
})
