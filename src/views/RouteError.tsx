import { isRouteErrorResponse, useParams, useRouteError } from 'react-router'
import NotFoundCard from '@/components/NotFoundCard'
import SeasonSelect from '@/components/SeasonSelect'

const NOT_FOUND_MESSAGES = ['Team not found', 'Player not found']

export default function RouteError() {
  const error = useRouteError()
  const { season } = useParams()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  let message = season
    ? `Couldn't load the ${season} season`
    : "Couldn't load this page"
  if (notFound) {
    message = NOT_FOUND_MESSAGES.includes(error.statusText)
      ? error.statusText
      : 'Page not found'
  } else {
    console.error(error)
  }

  return (
    <NotFoundCard message={message}>
      {!notFound && season && (
        <div className="flex flex-row items-center gap-3">
          <span className="text-muted-foreground">Try another season:</span>
          <SeasonSelect />
        </div>
      )}
    </NotFoundCard>
  )
}
