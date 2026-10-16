import { Button } from './ui/button'
import { useAppDispatch } from '@/store/hooks'
import { setView, View } from '@/store/slices/UI'

export default function TeamHistoryButton() {
  const dispatch = useAppDispatch()

  return (
    <Button
      variant="outline"
      onClick={() => dispatch(setView(View.TeamHistory))}
    >
      Team History
    </Button>
  )
}
