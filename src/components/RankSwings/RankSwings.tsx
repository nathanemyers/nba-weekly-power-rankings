import { Card, CardContent } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { PLAYOFF_MEDALS } from 'components/Chart/utils'
import type { Team, TeamRankings } from 'types'
import { biggestSwings, type RankSwing } from './utils'

interface RankSwingsProps {
  teams: TeamRankings[]
  maxWeek: number
  pinnedTeams: Team[]
  onClick: (team: Team) => void
}

export default function RankSwings(props: RankSwingsProps) {
  const { risers, fallers } = biggestSwings(props.teams)
  if (risers.length === 0 && fallers.length === 0) return null

  const renderGroup = (title: string, swings: RankSwing[]) =>
    swings.length > 0 && (
      <div>
        <h2 className="mb-2 text-[0.95rem] font-semibold text-muted-foreground">
          {title}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
          {swings.map((swing) => {
            const rose = swing.change > 0
            const places = Math.abs(swing.change)
            const medal =
              swing.team.playoff && PLAYOFF_MEDALS[swing.team.playoff]
            const pressed =
              props.pinnedTeams.length === 1 &&
              props.pinnedTeams[0] === swing.team.teamId
            return (
              <Toggle
                key={swing.team.teamId}
                variant="outline"
                className="relative flex h-auto cursor-pointer flex-col items-start gap-1.5 bg-background px-3 py-2.5 text-left whitespace-normal data-[state=on]:border-muted-foreground"
                pressed={pressed}
                aria-label={`${swing.team.name}: ${rose ? 'rose' : 'fell'} ${places} ${places === 1 ? 'place' : 'places'}, from ${swing.startRank} to ${swing.endRank}${medal ? `. ${medal.label}` : ''}`}
                onPressedChange={() => props.onClick(swing.team.teamId)}
              >
                <span className="pr-6 text-[0.95rem] font-semibold">
                  {swing.team.name}
                </span>
                {medal && (
                  <span
                    className="absolute top-2 right-2.5"
                    title={medal.label}
                  >
                    {medal.icon}
                  </span>
                )}
                <span className="m-auto flex items-center gap-2.5">
                  <TrendMinimap
                    rankings={swing.team.rankings}
                    maxWeek={props.maxWeek}
                  />
                  <span className="text-sm whitespace-nowrap text-foreground-soft">
                    {swing.startRank} → {swing.endRank}
                  </span>
                  <span
                    data-direction={rose ? 'up' : 'down'}
                    className="text-sm font-semibold whitespace-nowrap data-[direction=down]:text-rank-down data-[direction=up]:text-rank-up"
                  >
                    {rose ? '▲' : '▼'} {places}
                  </span>
                </span>
              </Toggle>
            )
          })}
        </div>
      </div>
    )

  return (
    <Card role="region" aria-label="Biggest rank swings" className="mt-5">
      <CardContent className="space-y-4">
        {renderGroup('Biggest Improvements', risers)}
        {renderGroup('Biggest Fall Offs', fallers)}
      </CardContent>
    </Card>
  )
}
