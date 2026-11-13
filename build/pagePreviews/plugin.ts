import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { chromium, type Browser } from 'playwright-core'
import {
  preview,
  runnerImport,
  type Plugin,
  type ResolvedConfig,
} from 'vite'

const SITE_ORIGIN = 'https://nathanemyers.github.io'
const WIDTH = 1200
const HEIGHT = 630
const PARALLEL_PAGES = 4

type PageHead = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
}
type PageEntry = { file: string; head: PageHead | null }
type PreviewCard = { file: string; path: string }
type BuildEntry = {
  seasons: unknown[]
  buildPages: (
    seasons: unknown[],
    origin: string,
    base: string
  ) => { pages: PageEntry[]; cards: PreviewCard[] }
  applyHead: (html: string, head: PageHead) => string
}

async function write(path: string, contents: string) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}

async function launchChrome(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch (error) {
    throw new Error(
      'page-previews needs Google Chrome installed to screenshot pages.',
      { cause: error }
    )
  }
}

async function screenshotPages(
  siteUrl: string,
  outDir: string,
  cards: PreviewCard[]
) {
  const browser = await launchChrome()
  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    })
    const queue = [...cards]
    const worker = async () => {
      const page = await context.newPage()
      for (let card = queue.shift(); card; card = queue.shift()) {
        await page.goto(siteUrl + card.path.slice(1))
        await page.waitForFunction(
          "document.querySelector('h1') && !document.body.innerText.includes('Loading')"
        )
        await page.waitForTimeout(500)
        const path = resolve(outDir, card.file)
        await mkdir(dirname(path), { recursive: true })
        await page.screenshot({ path, type: 'jpeg', quality: 85 })
      }
      await page.close()
    }
    await Promise.all(Array.from({ length: PARALLEL_PAGES }, worker))
  } finally {
    await browser.close()
  }
}

// Writes an entry HTML file for every page address, a 404.html fallback, and page screenshots for link previews.
export function pagePreviews(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'page-previews',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    async closeBundle() {
      const outDir = resolve(config.root, config.build.outDir)
      const { module } = await runnerImport<BuildEntry>(
        '/src/pagePreviews/buildEntry.ts',
        {
          configFile: false,
          root: config.root,
          resolve: { tsconfigPaths: true },
          logLevel: 'warn',
        }
      )
      const { pages, cards } = module.buildPages(
        module.seasons,
        SITE_ORIGIN,
        config.base
      )
      const indexHtml = await readFile(resolve(outDir, 'index.html'), 'utf8')

      await write(resolve(outDir, '404.html'), indexHtml)
      await Promise.all(
        pages.map((page) =>
          write(
            resolve(outDir, page.file),
            page.head ? module.applyHead(indexHtml, page.head) : indexHtml
          )
        )
      )

      const server = await preview({
        configFile: false,
        root: config.root,
        base: config.base,
        build: { outDir },
        preview: { port: 4190 },
        logLevel: 'warn',
      })
      try {
        await screenshotPages(server.resolvedUrls!.local[0], outDir, cards)
      } finally {
        await server.close()
      }

      config.logger.info(
        `page-previews: ${pages.length} entry pages, ${cards.length} screenshots, 404.html`
      )
    },
  }
}
