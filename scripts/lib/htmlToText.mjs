const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

// Old ESPN pages use Windows-1252 code points 128-159 in numeric entities, which aren't printable in Unicode.
const WINDOWS_1252 = {
  128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡',
  136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 142: 'Ž', 145: '‘',
  146: '’', 147: '“', 148: '”', 149: '•', 150: '–', 151: '—', 152: '˜',
  153: '™', 154: 'š', 155: '›', 156: 'œ', 158: 'ž', 159: 'Ÿ',
}

function decodeCodePoint(code) {
  return WINDOWS_1252[code] ?? String.fromCodePoint(code)
}

function decodeEntities(input) {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => decodeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => decodeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match)
}

/** Converts simple article HTML (<p>/<ul>/<a>/<strong> markup) to readable plain text. */
export function htmlToText(html) {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')

  const withoutTags = withBreaks.replace(/<[^>]+>/g, '')

  return decodeEntities(withoutTags)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim()
}
