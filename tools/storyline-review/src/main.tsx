import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import './review.css'
import App from './App'
import { fetchReview, fetchSeasons } from './types'

const season = new URLSearchParams(window.location.search).get('season')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App
        seasons={fetchSeasons()}
        review={season ? fetchReview(season) : undefined}
      />
    </TooltipProvider>
  </StrictMode>
)
