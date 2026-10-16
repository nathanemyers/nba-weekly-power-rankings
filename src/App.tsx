import { useAppSelector } from 'store/hooks'
import { getView, View } from 'store/slices/UI'
import ChartView from './views/ChartView'
import TeamHistoryView from './views/TeamHistoryView'

function App() {
  // const dispatch = useAppDispatch()
  const view = useAppSelector(getView)

  switch (view) {
    case View.Chart:
      return <ChartView />
    case View.TeamHistory:
      return <TeamHistoryView />
  }
}

export default App
