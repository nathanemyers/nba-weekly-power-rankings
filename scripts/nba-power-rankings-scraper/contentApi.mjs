import { fetchJsonWithRetry, sleep } from './http.mjs'

// Undocumented public API behind the "Load more" button on nba.com/news/category/power-rankings; category 3194 is "Power Rankings".
const CONTENT_API_BASE =
  'https://content-api-prod.nba.com/public/1/leagues/nba/content'
const POWER_RANKINGS_CATEGORY_ID = 3194
const PAGE_SIZE = 50

/** Walks every page of the Power Rankings category listing, oldest and newest alike. */
export async function listAllPowerRankingsArticles({ delayMs = 300 } = {}) {
  const items = []
  let page = 1

  while (page !== false) {
    const url = `${CONTENT_API_BASE}?page=${page}&count=${PAGE_SIZE}&types=post&term-category=${POWER_RANKINGS_CATEGORY_ID}`
    const data = await fetchJsonWithRetry(url)
    items.push(...data.results.items)
    page = data.results.pageNext
    if (page !== false) {
      await sleep(delayMs)
    }
  }

  return items
}
