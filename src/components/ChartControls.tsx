import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  getIsZoomedOut,
  getCanPageEarlier,
  getCanPageLater,
  getCanZoom,
  pageWindow,
  setZoomedOut,
} from '@/store/slices/chart'
import { useSeason } from '@/hooks/useSeason'

export default function ChartControls() {
  const dispatch = useAppDispatch()
  const { maxWeek } = useSeason()
  const zoomedOut = useAppSelector(getIsZoomedOut)
  const canPageEarlier = useAppSelector((s) => getCanPageEarlier(s, maxWeek))
  const canPageLater = useAppSelector((s) => getCanPageLater(s, maxWeek))
  const canZoom = useAppSelector((s) => getCanZoom(s, maxWeek))

  return (
    <ButtonGroup>
      <Button
        className="w-12"
        aria-label="Earlier weeks"
        onClick={() => dispatch(pageWindow(-1, maxWeek))}
        disabled={!canPageEarlier}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </Button>
      <Button
        className="w-24"
        disabled={!canZoom}
        onClick={() => dispatch(setZoomedOut(!zoomedOut))}
      >
        {zoomedOut ? `Zoom In` : `Zoom Out`}
      </Button>
      <Button
        className="w-12"
        aria-label="Later weeks"
        onClick={() => dispatch(pageWindow(1, maxWeek))}
        disabled={!canPageLater}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </ButtonGroup>
  )
}
