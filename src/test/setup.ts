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

// Radix Select uses pointer capture and scrollIntoView, which jsdom doesn't implement.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// Radix tooltips measure their trigger with ResizeObserver, which jsdom doesn't implement.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
