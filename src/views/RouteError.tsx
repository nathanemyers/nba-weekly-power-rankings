import {
  isRouteErrorResponse,
  Link,
  useParams,
  useRouteError,
} from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import SeasonSelect from '@/components/SeasonSelect'

export default function RouteError() {
  const error = useRouteError()
  const { season } = useParams()
  const notFound = isRouteErrorResponse(error) && error.status === 404

  let message = season
    ? `Couldn't load the ${season} season`
    : "Couldn't load this page"
  if (notFound) {
    message =
      error.statusText === 'Team not found'
        ? 'Team not found'
        : 'Page not found'
  } else {
    console.error(error)
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{message}</h1>
        {!notFound && season && (
          <div className="flex flex-row items-center gap-3">
            <span className="text-muted-foreground">Try another season:</span>
            <SeasonSelect />
          </div>
        )}
        <Link to="/" className="cursor-pointer text-primary underline">
          Back to the rankings chart
        </Link>
      </CardContent>
    </Card>
  )
}
