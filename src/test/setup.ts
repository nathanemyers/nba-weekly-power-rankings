import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement matchMedia. Default to "no preference" (matches real browser
// defaults); individual tests override this to simulate prefers-reduced-motion.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
