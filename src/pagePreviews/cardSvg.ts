import { SITE_NAME } from '@/constants'
import type { PreviewCard } from './cards'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

const PAD = 72
const LOGO_SIZE = 320
const LOGO_X = CARD_WIDTH - PAD - LOGO_SIZE
const BACKGROUND = '#1d1d1f'
const TEXT = '#f5f5f7'
const MUTED = '#a1a1aa'

const escapeXml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// Rough Inter advance widths in em, used to pick a font size that fits.
const fitSize = (lines: string[], width: number, em: number, max: number) =>
  Math.min(
    max,
    Math.floor(width / (Math.max(...lines.map((l) => l.length)) * em))
  )

function headingLines(heading: string): string[] {
  const words = heading.split(' ')
  if (heading.length <= 14 || words.length < 2) return [heading]
  const splits = words.slice(1).map((_, i) => [
    words.slice(0, i + 1).join(' '),
    words.slice(i + 1).join(' '),
  ])
  const longest = (lines: string[]) =>
    Math.max(...lines.map((line) => line.length))
  return splits.reduce((best, lines) =>
    longest(lines) < longest(best) ? lines : best
  )
}

// Builds the 1200×630 SVG for one page's link-preview card.
export function cardSvg(card: PreviewCard, logoDataUri: string | null): string {
  const textWidth = (logoDataUri ? LOGO_X - 48 : CARD_WIDTH - PAD) - PAD
  const lines = headingLines(card.heading)
  const headingSize = fitSize(lines, textWidth, 0.6, lines.length > 1 ? 104 : 150)
  const factSize = fitSize([card.fact], textWidth, 0.53, 42)
  const firstBaseline = 110 + headingSize
  const lastBaseline = firstBaseline + (lines.length - 1) * headingSize * 1.05
  const ruleY = lastBaseline + 36
  const factY = ruleY + 36 + factSize

  const headingText = lines
    .map(
      (line, i) =>
        `<tspan x="${PAD}" y="${firstBaseline + i * headingSize * 1.05}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const logo = logoDataUri
    ? `<image href="${logoDataUri}" x="${LOGO_X}" y="${(CARD_HEIGHT - LOGO_SIZE) / 2 - 20}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" preserveAspectRatio="xMidYMid meet"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${BACKGROUND}"/>
  <rect width="16" height="${CARD_HEIGHT}" fill="${card.accentColor}"/>
  ${logo}
  <text font-family="Inter" font-weight="700" font-size="${headingSize}" fill="${TEXT}">${headingText}</text>
  <rect x="${PAD}" y="${ruleY}" width="96" height="8" rx="4" fill="${card.accentColor}"/>
  <text x="${PAD}" y="${factY}" font-family="Inter" font-weight="400" font-size="${factSize}" fill="${TEXT}">${escapeXml(card.fact)}</text>
  <text x="${PAD}" y="${CARD_HEIGHT - PAD}" font-family="Inter" font-weight="400" font-size="28" fill="${MUTED}">${escapeXml(SITE_NAME)}</text>
</svg>`
}
