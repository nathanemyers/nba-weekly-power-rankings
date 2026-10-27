import { TooltipProvider } from './components/ui/tooltip'
import { createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from './routes'

const router = createHashRouter(routes)

function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  )
}

export default App
