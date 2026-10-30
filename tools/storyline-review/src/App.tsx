import { Suspense, use } from 'react'
import ReviewEditor from './ReviewEditor'
import type { ReviewState } from './types'

function SeasonList(props: { seasons: Promise<string[]> }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl">Storyline review</h1>
      <ul className="flex flex-col gap-1">
        {use(props.seasons).map((season) => (
          <li key={season}>
            <a
              href={`?season=${season}`}
              className="cursor-pointer text-foreground-soft hover:underline"
            >
              {season}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReviewContent(props: { review: Promise<ReviewState> }) {
  return <ReviewEditor initial={use(props.review)} />
}

interface AppProps {
  seasons?: Promise<string[]>
  review?: Promise<ReviewState>
}

export default function App(props: AppProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        {props.review && <ReviewContent review={props.review} />}
        {props.seasons && <SeasonList seasons={props.seasons} />}
      </Suspense>
    </main>
  )
}
