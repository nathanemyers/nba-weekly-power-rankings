import { expect, it } from 'vitest'
import { loadAllSeasons, seasonIndex } from './seasonData'

it('validates every bundled season and its index entry', async () => {
  expect(seasonIndex).toHaveLength(22)
  const seasons = await loadAllSeasons()
  expect(seasons.map((s) => s.name)).toEqual(seasonIndex.map((e) => e.name))
})

it('gives every team in every bundled season a roster and a head coach', async () => {
  for (const season of await loadAllSeasons()) {
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
