export type PageHead = {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string
}

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

function setMeta(html: string, key: string, value: string): string {
  const pattern = new RegExp(
    `(<meta (?:name|property)="${key}" content=")[^"]*(")`
  )
  if (!pattern.test(html)) throw new Error(`index.html has no ${key} tag`)
  return html.replace(pattern, (_, start, end) => start + value + end)
}

// Writes one page's preview values into a copy of the built index.html.
export function applyHead(html: string, head: PageHead): string {
  if (!/<title>[^<]*<\/title>/.test(html))
    throw new Error('index.html has no title tag')
  const title = escapeHtml(head.title)
  const description = escapeHtml(head.description)
  const values: [string, string][] = [
    ['description', description],
    ['og:title', title],
    ['og:description', description],
    ['og:url', escapeHtml(head.canonicalUrl)],
    ['og:image', escapeHtml(head.imageUrl)],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
    ['twitter:image', escapeHtml(head.imageUrl)],
  ]
  return values.reduce(
    (result, [key, value]) => setMeta(result, key, value),
    html.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
  )
}
