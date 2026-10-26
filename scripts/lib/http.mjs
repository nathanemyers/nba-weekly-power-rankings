const USER_AGENT = 'nba-weekly-power-rankings (personal project)'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fetches text with retries and exponential backoff; with `allowRedirect: false` a 3xx response resolves to null. */
export async function fetchTextWithRetry(
  url,
  { retries = 3, baseDelayMs = 1000, allowRedirect = true } = {}
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
      return await res.text()
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
