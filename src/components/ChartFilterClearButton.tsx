import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from './ui/button'
import { faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart/chart'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

export default function ChartFilterClearButton() {
  const dispatch = useAppDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={pinnedTeams.length === 0}
      onClick={() => dispatch(setPinnedTeams([]))}
      aria-label="Clear pinned teams"
    >
      <FontAwesomeIcon icon={faFilterCircleXmark} />
    </Button>
  )
}
