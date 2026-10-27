import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, CardContent } from './ui/card'

export default function NotFoundCard(props: {
  message: string
  children?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{props.message}</h1>
        {props.children}
        <Link to="/" className="cursor-pointer text-primary underline">
          Back to the rankings chart
        </Link>
      </CardContent>
    </Card>
  )
}
