import { Button } from './ui/button'
import { useNavigate } from 'react-router'
import { cn } from 'cn'
import type { Team } from '@/types'

interface ButtonProps {
  className?: string
  team?: Team
}

export default function TeamHistoryButton(props: ButtonProps) {
  const navigate = useNavigate()
  const disabled = !props.team

  return (
    <Button
      variant="outline"
      onClick={() => navigate('/teamHistory/' + props.team)}
      className={cn(disabled ? '' : 'cursor-pointer', props.className)}
      disabled={disabled}
    >
      Team History
    </Button>
  )
}
