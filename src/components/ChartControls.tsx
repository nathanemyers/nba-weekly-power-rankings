import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectZoomedOut,
  selectCanPageEarlier,
  selectCanPageLater,
  selectCanZoom,
  pageWindow,
  zoomToggled,
} from '@/store/slices/chartView'

export default function ChartControls() {
  const dispatch = useAppDispatch()
  const zoomedOut = useAppSelector(selectZoomedOut)
  const canPageEarlier = useAppSelector(selectCanPageEarlier)
  const canPageLater = useAppSelector(selectCanPageLater)
  const canZoom = useAppSelector(selectCanZoom)

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
        onClick={() => dispatch(zoomToggled())}
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
