import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router'
import TeamHistory from '@/components/TeamHistory'
import TeamLogo from '@/components/TeamLogo'
import type { Season } from '@/data/seasonData'
import { getTeamName, type Team } from '@/types'

type TeamHistoryLoaderData = { team: Team; seasons: Promise<Season[]> }

function TeamHistorySeasons(props: { team: Team; seasons: Promise<Season[]> }) {
  return <TeamHistory team={props.team} seasons={use(props.seasons)} />
}

export default function TeamHistoryView() {
  const { team, seasons } = useLoaderData() as TeamHistoryLoaderData

  return (
    <div className="flex flex-col">
      <h1 className="flex flex-row items-center gap-5 mb-10 text-4xl">
        <TeamLogo team={team} />
        {getTeamName(team)} Team History
      </h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <TeamHistorySeasons team={team} seasons={seasons} />
      </Suspense>
    </div>
  )
}
