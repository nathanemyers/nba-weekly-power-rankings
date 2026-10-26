import { useAppSelector } from 'store/hooks'
import { getView, View } from 'store/slices/UI'
import ChartView from './views/ChartView'
import TeamHistoryView from './views/TeamHistoryView'
import { CHART_WIDTH } from './constants'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
  const view = useAppSelector(getView)

  let body

  // if we ever add a third view just use react-router
  switch (view) {
    case View.Chart:
      body = <ChartView />
      break
    case View.TeamHistory:
      body = <TeamHistoryView />
      break
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-8"
      style={{ maxWidth: CHART_WIDTH + 32 }}
    >
      <TooltipProvider>{body}</TooltipProvider>
    </main>
  )
}

export default App
