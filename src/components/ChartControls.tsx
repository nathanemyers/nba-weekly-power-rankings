import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectZoomedOut,
  selectCanPageEarlier,
  selectCanPageLater,
  selectCanZoom,
  pageWindow,
  zoomToggled,
} from 'store/slices/chartView'
import { Button } from './ui/button'
import { ButtonGroup } from './ui/button-group'

export default function ChartControls() {
  const dispatch = useAppDispatch()
  const zoomedOut = useAppSelector(selectZoomedOut)
  const canPageEarlier = useAppSelector(selectCanPageEarlier)
  const canPageLater = useAppSelector(selectCanPageLater)
  const canZoom = useAppSelector(selectCanZoom)

  return (
    <ButtonGroup>
      <Button
        className="w-24"
        onClick={() => dispatch(pageWindow(-1))}
        disabled={!canPageEarlier}
      >
        Earlier
      </Button>
      <Button
        className="w-24"
        disabled={!canZoom}
        onClick={() => dispatch(zoomToggled())}
      >
        {zoomedOut ? `Zoom In` : `Zoom Out`}
      </Button>
      <Button
        className="w-24"
        onClick={() => dispatch(pageWindow(1))}
        disabled={!canPageLater}
      >
        Later
      </Button>
    </ButtonGroup>
  )
}
