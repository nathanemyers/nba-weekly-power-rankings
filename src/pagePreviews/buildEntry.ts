import { loadSeason, seasonIndex, type Season } from '@/data/seasonData'
import { buildPages } from './pages'
import { applyHead } from './head'

// Loaded at the top level because Vite's module runner closes once this import finishes.
const loaded = await Promise.all(
  seasonIndex.map((entry) =>
    loadSeason(entry.name).catch((error: unknown) => {
      console.warn(`Skipping ${entry.name} page previews: ${String(error)}`)
      return null
    })
  )
)

export const seasons = loaded.filter((season): season is Season => !!season)

export { applyHead, buildPages }
