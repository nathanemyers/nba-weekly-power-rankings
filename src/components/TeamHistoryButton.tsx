import type { Team } from '@/types'
import { Button } from './ui/button'

interface TeamHistoryButtonProps {
  team: Team
}
export default function TeamHistoryButton(props: TeamHistoryButtonProps) {
  return <Button>history</Button>
}
