import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router'
import NotFoundCard from '@/components/NotFoundCard'
import PlayerHistoryTable from '@/components/PlayerStats/PlayerHistoryTable'
import PlayerSearch from '@/components/PlayerStats/PlayerSearch'
import RatingKey from 'components/PlayerStats/RatingKey'
import type { PlayerStint, PlayerSummary } from '@/data/playerHistory'
import CareerHighlights from '@/components/PlayerStats/CareerHighlights'

type PlayerHistoryLoaderData = {
  playerId: string
  playerHistory: Promise<PlayerStint[]>
  allPlayers: Promise<PlayerSummary[]>
  playerSummary: Promise<PlayerSummary>
}

function PlayerHistoryContent(props: {
  playerHistory: Promise<PlayerStint[]>
  playerSummary: Promise<PlayerSummary>
}) {
  const playerHistory = use(props.playerHistory)
  const playerSummary = use(props.playerSummary)
  if (!playerHistory.length) return <NotFoundCard message="Player not found" />

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-2xl sm:text-4xl">{playerHistory[0].player.name}</h1>
      <div className="mb-6">
        <CareerHighlights player={playerSummary} limit={10} />
      </div>
      <div className="flex justify-end">
        <RatingKey />
      </div>
      <div className="mt-2">
        <PlayerHistoryTable playerHistory={playerHistory} />
      </div>
    </div>
  )
}

export default function PlayerHistoryView() {
  const { playerHistory, allPlayers, playerSummary } =
    useLoaderData() as PlayerHistoryLoaderData

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Suspense>
          <PlayerSearch players={allPlayers} />
        </Suspense>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <PlayerHistoryContent
          playerHistory={playerHistory}
          playerSummary={playerSummary}
        />
      </Suspense>
    </div>
  )
}
