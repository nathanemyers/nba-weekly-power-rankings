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

export default function ChartControls() {
  const dispatch = useAppDispatch()
  const zoomedOut = useAppSelector(getIsZoomedOut)
  const canPageEarlier = useAppSelector(getCanPageEarlier)
  const canPageLater = useAppSelector(getCanPageLater)
  const canZoom = useAppSelector(getCanZoom)

  return (
    <ButtonGroup>
      <Button
        className="w-12"
        aria-label="Earlier weeks"
        onClick={() => dispatch(pageWindow(-1))}
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
        onClick={() => dispatch(pageWindow(1))}
        disabled={!canPageLater}
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Button>
    </ButtonGroup>
  )
}
