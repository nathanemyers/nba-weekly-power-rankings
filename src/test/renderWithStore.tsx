import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store/redux'

export function renderWithStore(ui: ReactElement) {
  const store = makeStore()
  return { ...render(<Provider store={store}>{ui}</Provider>), store }
}
