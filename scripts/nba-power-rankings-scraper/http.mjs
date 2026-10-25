export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fetches text with a few retries and exponential backoff for transient failures. */
export async function fetchTextWithRetry(url, { retries = 3, baseDelayMs = 1000 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
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
