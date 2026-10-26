import ChartView from './views/ChartView'
import TeamHistoryView from './views/TeamHistoryView'
import { TooltipProvider } from './components/ui/tooltip'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import Root from './Root'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { path: ':season', Component: ChartView },
      {
        path: 'teamHistory',
        children: [{ path: ':team', Component: TeamHistoryView }],
      },
    ],
  },
])

function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />,
    </TooltipProvider>
  )
}

export default App
