const USER_AGENT = 'nba-weekly-power-rankings (personal project)'

const windows1252 = new TextDecoder('windows-1252')
const utf8 = new TextDecoder('utf-8')

/** Decodes UTF-8 that may contain stray Windows-1252 bytes (old ESPN pages print "5\xbd games" this way); broken multi-byte sequences become U+FFFD. */
export function decodeUtf8Lenient(bytes) {
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const b = bytes[i]
    if (b < 0x80) {
      out += String.fromCharCode(b)
      i++
      continue
    }
    const length = b >= 0xf0 && b <= 0xf4 ? 4 : b >= 0xe0 && b <= 0xef ? 3 : b >= 0xc2 && b <= 0xdf ? 2 : 0
    let continuation = 0
    while (continuation < length - 1 && (bytes[i + 1 + continuation] & 0xc0) === 0x80) continuation++
    if (length && continuation === length - 1) {
      out += utf8.decode(bytes.subarray(i, i + length))
    } else if (continuation > 0) {
      out += '\uFFFD'
    } else {
      out += windows1252.decode(bytes.subarray(i, i + 1))
    }
    i += 1 + continuation
  }
  return out
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fetches text with retries and backoff; `allowRedirect: false` turns a 3xx into null, `encoding` picks a decoder ('utf-8-lenient' or any TextDecoder label). */
export async function fetchTextWithRetry(
  url,
  { retries = 3, baseDelayMs = 1000, allowRedirect = true, encoding } = {}
) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: allowRedirect ? 'follow' : 'manual',
      })
      if (!allowRedirect && res.status >= 300 && res.status < 400) {
        return null
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
      }
      if (!encoding) return await res.text()
      const bytes = new Uint8Array(await res.arrayBuffer())
      return encoding === 'utf-8-lenient' ? decodeUtf8Lenient(bytes) : new TextDecoder(encoding).decode(bytes)
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt)
      }
    }
  }
  throw new Error(
    `Failed to fetch ${url} after ${retries + 1} attempts: ${String(lastError)}`
  )
}

export async function fetchJsonWithRetry(url, opts) {
  const text = await fetchTextWithRetry(url, opts)
  return JSON.parse(text)
}
