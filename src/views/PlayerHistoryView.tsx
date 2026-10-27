import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router'
import NotFoundCard from '@/components/NotFoundCard'
import PlayerHistoryTable from '@/components/PlayerHistoryTable'
import { RatingKey } from '@/components/statColumns'
import type { PlayerStint } from '@/data/playerHistory'

type PlayerHistoryLoaderData = {
  playerId: string
  history: Promise<PlayerStint[]>
}

function PlayerHistoryContent(props: { history: Promise<PlayerStint[]> }) {
  const history = use(props.history)
  if (!history.length) return <NotFoundCard message="Player not found" />

  return (
    <div className="flex flex-col">
      <h1 className="mb-10 text-4xl">{history[0].player.name}</h1>
      <div className="flex justify-end">
        <RatingKey />
      </div>
      <div className="mt-2">
        <PlayerHistoryTable history={history} />
      </div>
    </div>
  )
}

export default function PlayerHistoryView() {
  const { history } = useLoaderData() as PlayerHistoryLoaderData

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <PlayerHistoryContent history={history} />
    </Suspense>
  )
}
