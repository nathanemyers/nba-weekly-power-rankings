import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'

export default function RouteError() {
  const error = useRouteError()

  let message = "Couldn't load this season"
  if (isRouteErrorResponse(error) && error.status === 404) {
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
        <Link to="/" className="cursor-pointer text-primary underline">
          Back to the rankings chart
        </Link>
      </CardContent>
    </Card>
  )
}
