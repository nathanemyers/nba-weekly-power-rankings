import { Suspense, type ReactElement } from 'react'
import { act, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { makeStore } from '@/store/redux'
import { routes } from '@/routes'
import { loadSeason } from '@/data/seasonData'

export async function renderWithRouter(initialEntries: string[] = ['/']) {
  const store = makeStore()
  const router = createMemoryRouter(routes, { initialEntries })
  const result = render(
    <Provider store={store}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </Provider>
  )
  // Let loaders and resolved season promises settle before the test inspects the page
  await act(async () => {})
  return { ...result, router, store }
}

// Renders one component inside a minimal 'season' route so useSeason() resolves
export async function renderInSeason(ui: ReactElement, season: string) {
  const store = makeStore()
  const router = createMemoryRouter(
    [
      {
        id: 'season',
        path: '/:season',
        loader: () => ({ season: loadSeason(season) }),
        element: <Suspense>{ui}</Suspense>,
      },
    ],
    { initialEntries: ['/' + season] }
  )
  const result = render(
    <Provider store={store}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </Provider>
  )
  await act(async () => {})
  return { ...result, router, store }
}
