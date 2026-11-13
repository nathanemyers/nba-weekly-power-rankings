import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { runnerImport, type Plugin, type ResolvedConfig } from 'vite'

const SITE_ORIGIN = 'https://nathanemyers.github.io'

// resvg cannot decode WebP, so the Wizards logo uses a PNG copy kept with the plugin.
const LOGO_FILES: Record<string, string> = {
  atl: 'atl.png', bos: 'bos.gif', bkn: 'bkn.png', cha: 'cha.png',
  chi: 'chi2.png', cle: 'cle.png', dal: 'dal.png', den: 'den.png',
  det: 'det.png', gsw: 'gsw.png', hou: 'hou.png', ind: 'ind.png',
  lac: 'lac.png', lal: 'lal.png', mem: 'mem.png', mia: 'mia2.png',
  mil: 'mil.png', min: 'min.png', nop: 'nop2.png', nyk: 'nyk.png',
  okc: 'okc.png', orl: 'orl.png', phi: 'phi.png', phx: 'phx.png',
  por: 'por.png', sac: 'sac.png', sas: 'sas.png', tor: 'tor.png',
  uta: 'uta2.png', was: 'build/pagePreviews/logos/was.png',
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.gif': 'image/gif',
}

type PageHead = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
}
type PageEntry = { file: string; head: PageHead | null }
type PreviewCard = { file: string; logo: string | null }
type BuildEntry = {
  seasons: unknown[]
  buildPages: (
    seasons: unknown[],
    origin: string,
    base: string
  ) => { pages: PageEntry[]; cards: PreviewCard[] }
  applyHead: (html: string, head: PageHead) => string
  cardSvg: (card: PreviewCard, logoDataUri: string | null) => string
}

async function write(path: string, contents: string | Buffer) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}

// Writes an entry HTML file for every page address, a 404.html fallback, and preview card PNGs.
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
      const fontDir = resolve(config.root, 'build/pagePreviews/fonts')
      const logoDir = resolve(config.root, 'staticAssets/logos/1x')
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

      const fontFiles = ['Inter-Regular.ttf', 'Inter-Bold.ttf'].map((file) =>
        resolve(fontDir, file)
      )
      for (const card of cards) {
        let logoDataUri: string | null = null
        if (card.logo) {
          const file = LOGO_FILES[card.logo]
          if (!file) throw new Error(`No logo file for team ${card.logo}`)
          const data = await readFile(
            file.includes('/') ? resolve(config.root, file) : resolve(logoDir, file)
          )
          logoDataUri = `data:${MIME[extname(file)]};base64,${data.toString('base64')}`
        }
        const png = new Resvg(module.cardSvg(card, logoDataUri), {
          font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' },
        })
          .render()
          .asPng()
        await write(resolve(outDir, card.file), png)
      }

      config.logger.info(
        `page-previews: ${pages.length} entry pages, ${cards.length} preview cards, 404.html`
      )
    },
  }
}
