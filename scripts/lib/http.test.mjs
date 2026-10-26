import { describe, expect, it } from 'vitest'
import { decodeUtf8Lenient } from './http.mjs'

const bytes = (...parts) =>
  Uint8Array.from(parts.flatMap((p) => (typeof p === 'string' ? [...new TextEncoder().encode(p)] : p)))

describe('decodeUtf8Lenient', () => {
  it('decodes valid UTF-8 unchanged', () => {
    expect(decodeUtf8Lenient(bytes('Café ’ ⬦ \u{1F3C0}'))).toBe('Café ’ ⬦ \u{1F3C0}')
  })

  it('reads a stray single byte as Windows-1252', () => {
    expect(decodeUtf8Lenient(bytes('5', [0xbd], ' games'))).toBe('5½ games')
    expect(decodeUtf8Lenient(bytes('it', [0x92], 's'))).toBe('it’s')
    expect(decodeUtf8Lenient(bytes('caf', [0xe9], '!'))).toBe('café!')
  })

  it('replaces a truncated multi-byte sequence with U+FFFD', () => {
    expect(decodeUtf8Lenient(bytes('Wall', [0xe2, 0xac], '"s'))).toBe('Wall�"s')
  })
})
