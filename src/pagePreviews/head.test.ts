import { describe, expect, it } from 'vitest'
import { applyHead } from './head'

const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <title>NBA Weekly Power Rankings</title>
    <meta name="description" content="Site description." />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="NBA Weekly Power Rankings" />
    <meta property="og:description" content="Site description." />
    <meta property="og:url" content="https://example.com/site/" />
    <meta property="og:image" content="https://example.com/site/sitePreview.png" />
    <meta property="og:image:width" content="2392" />
    <meta property="og:image:height" content="1434" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://example.com/site/sitePreview.png" />
    <script type="module" crossorigin src="/site/assets/index.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>
`

const head = {
  title: 'Boston Celtics · NBA Weekly Power Rankings',
  description: "Boston Celtics' rankings & results.",
  canonicalUrl: 'https://example.com/site/teamHistory/bos',
  imageUrl: 'https://example.com/site/previews/team-bos.png',
}

const result = applyHead(html, head)
const lines = (text: string) => text.split('\n')
const count = (text: string, needle: string) => text.split(needle).length - 1

describe('applyHead', () => {
  it('sets the page title and description', () => {
    expect(result).toContain(
      '<title>Boston Celtics · NBA Weekly Power Rankings</title>'
    )
    expect(result).toContain(
      '<meta name="description" content="Boston Celtics&#39; rankings &amp; results." />'
    )
    expect(result).toContain(
      '<meta property="og:description" content="Boston Celtics&#39; rankings &amp; results." />'
    )
  })

  it('points the URL and both image tags at the page', () => {
    expect(result).toContain(
      '<meta property="og:url" content="https://example.com/site/teamHistory/bos" />'
    )
    expect(count(result, 'previews/team-bos.png')).toBe(2)
    expect(result).not.toContain('sitePreview.png')
  })

  it('sizes the image as a 1200×630 card', () => {
    expect(result).toContain(
      '<meta property="og:image:width" content="1200" />'
    )
    expect(result).toContain(
      '<meta property="og:image:height" content="630" />'
    )
  })

  it('keeps each tag once and leaves every other line alone', () => {
    expect(count(result, 'property="og:title"')).toBe(1)
    expect(count(result, '<title>')).toBe(1)
    const changed = lines(html).filter((line, i) => line !== lines(result)[i])
    expect(changed).toHaveLength(9)
    expect(lines(result)).toHaveLength(lines(html).length)
  })

  it('fails loudly when a tag is missing', () => {
    expect(() =>
      applyHead(html.replace(/.*og:url.*\n/, ''), head)
    ).toThrow(/og:url/)
  })
})
