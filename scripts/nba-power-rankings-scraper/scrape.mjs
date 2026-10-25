import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { listAllPowerRankingsArticles } from './contentApi.mjs'
import { fetchPowerRankingsArticle } from './articlePage.mjs'
import { sleep } from '../lib/http.mjs'

function slugify(value) {
  return value.replace(/[^a-z0-9-]/gi, '_')
}

function articleFilePath(article) {
  const seasonDir = article.season ? slugify(article.season) : 'unknown-season'
  return path.join('articles', seasonDir, `${slugify(article.slug)}.json`)
}

/** Scrapes articles from the last `years` years into `outDir`, reusing saved files unless `force` is set. */
export async function scrape({ years, outDir, delayMs, force }) {
  const cutoff = new Date()
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years)

  console.log('Fetching Power Rankings article list from NBA.com...')
  const listItems = await listAllPowerRankingsArticles({ delayMs })
  console.log(`Found ${listItems.length} articles total.`)

  const inRange = listItems.filter((item) => new Date(item.date) >= cutoff)
  console.log(
    `${inRange.length} articles published on or after ${cutoff.toISOString().slice(0, 10)} ` +
      `(the rest of NBA.com's archive is older than the requested ${years}-year window).`
  )

  await mkdir(outDir, { recursive: true })

  const index = []
  let fetched = 0
  let skipped = 0
  let failed = 0

  for (const [i, item] of inRange.entries()) {
    console.log(`[${i + 1}/${inRange.length}] ${item.slug}`)

    try {
      let article
      const existingPath = force
        ? null
        : await findExistingArticleFile(outDir, item.slug)

      if (existingPath) {
        article = JSON.parse(await readFile(existingPath, 'utf8'))
        skipped++
      } else {
        article = await fetchPowerRankingsArticle(item.permalink)
        const filePath = path.join(outDir, articleFilePath(article))
        await mkdir(path.dirname(filePath), { recursive: true })
        await writeFile(filePath, JSON.stringify(article, null, 2), 'utf8')
        fetched++
        await sleep(delayMs)
      }

      index.push({
        id: article.id,
        slug: article.slug,
        title: article.title,
        season: article.season,
        week: article.week,
        publishedAt: article.publishedAt,
        hasStructuredRankings: article.hasStructuredRankings,
        file: articleFilePath(article),
      })
    } catch (err) {
      failed++
      console.error(`  failed: ${String(err)}`)
    }
  }

  index.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  await writeFile(
    path.join(outDir, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf8'
  )

  console.log(
    `\nDone. Fetched ${fetched}, skipped (already saved) ${skipped}, failed ${failed}. ` +
      `Index written to ${path.join(outDir, 'index.json')}.`
  )
}

/** Looks for a previously-saved article with this slug under any season subdirectory. */
async function findExistingArticleFile(outDir, slug) {
  const articlesDir = path.join(outDir, 'articles')
  if (!existsSync(articlesDir)) {
    return null
  }
  const fileName = `${slugify(slug)}.json`
  for (const seasonDir of await readdir(articlesDir)) {
    const candidate = path.join(articlesDir, seasonDir, fileName)
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}
