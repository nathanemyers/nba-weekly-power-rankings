import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router'
import NotFoundCard from '@/components/NotFoundCard'
import PlayerHistoryTable from '@/components/PlayerStats/PlayerHistoryTable'
import PlayerSearch from '@/components/PlayerStats/PlayerSearch'
import RatingKey from 'components/PlayerStats/RatingKey'
import type { PlayerStint, PlayerSummary } from '@/data/playerHistory'

type PlayerHistoryLoaderData = {
  playerId: string
  history: Promise<PlayerStint[]>
  players: Promise<PlayerSummary[]>
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
  const { history, players } = useLoaderData() as PlayerHistoryLoaderData

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Suspense>
          <PlayerSearch players={players} />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <PlayerHistoryContent history={history} />
      </Suspense>
    </div>
  )
}
