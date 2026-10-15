import { useAppDispatch, useAppSelector } from 'store/hooks'
import { pageWindow, getIsZoomedOut } from '@/store/slices/chart'
import { useEffect } from 'react'

export const useChartControls = () => {
  const dispatch = useAppDispatch()
  const zoomedOut = useAppSelector(getIsZoomedOut)

  useEffect(() => {
    if (zoomedOut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') dispatch(pageWindow(-1))
      if (e.key === 'ArrowRight') dispatch(pageWindow(1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomedOut, dispatch])
}
