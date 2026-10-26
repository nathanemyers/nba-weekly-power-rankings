import { Button } from './ui/button'
import { useAppDispatch } from '@/store/hooks'
import { setView, View } from '@/store/slices/UI'
import { cn } from 'cn'

interface ButtonProps {
  className?: string
  disabled?: boolean
}

export default function TeamHistoryButton(props: ButtonProps) {
  const dispatch = useAppDispatch()

  return (
    <Button
      variant="outline"
      onClick={() => dispatch(setView(View.TeamHistory))}
      className={cn(props.disabled ? '' : 'cursor-pointer', props.className)}
      disabled={props.disabled}
    >
      Team History
    </Button>
  )
}
