import { TooltipProvider } from './components/ui/tooltip'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from './routes'
import { legacyHashTarget } from './pagePreviews/legacyHash'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const legacyTarget = legacyHashTarget(
  basename,
  window.location.hash,
  window.location.search
)
if (legacyTarget) window.history.replaceState(null, '', legacyTarget)

const router = createBrowserRouter(routes, { basename })

function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
