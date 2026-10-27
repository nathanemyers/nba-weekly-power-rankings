import { Link } from 'react-router'
import { cn } from 'cn'
import {
  getSeasonAwardGroups,
  type AwardWinner,
  type SeasonAwardGroup,
} from '@/data/awards'
import { useSeason } from '@/hooks/useSeason'
import TeamLogo from './TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const ALL_NBA = ['NBA1', 'NBA2', 'NBA3']
const ALL_DEFENSIVE = ['DEF1', 'DEF2']
const COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}
const TEAM_NAMES: Record<string, string> = {
  NBA1: 'First Team',
  NBA2: 'Second Team',
  NBA3: 'Third Team',
  DEF1: 'First Team',
  DEF2: 'Second Team',
}

function PlayerLink(props: AwardWinner) {
  return (
    <Link
      to={'/playerHistory/' + props.id}
      className="inline-flex cursor-pointer items-center gap-1.5 hover:underline"
    >
      <TeamLogo team={props.team} alt="" className="size-4 object-contain" />
      {props.name}
    </Link>
  )
}

function PlayerList(props: { group: SeasonAwardGroup; className?: string }) {
  return (
    <ul aria-label={props.group.title} className={props.className}>
      {props.group.players.map((player) => (
        <li key={player.id} className="py-0.5">
          <PlayerLink {...player} />
        </li>
      ))}
    </ul>
  )
}

function TeamsCard(props: { title: string; groups: SeasonAwardGroup[] }) {
  if (!props.groups.length) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent className={cn('grid gap-4', COLUMNS[props.groups.length])}>
        {props.groups.map((group) => (
          <div key={group.code}>
            <h4 className="mb-1 text-sm text-muted-foreground">
              {TEAM_NAMES[group.code]}
            </h4>
            <PlayerList group={group} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function SeasonAwardsPane() {
  const season = useSeason()
  const groups = getSeasonAwardGroups(season)
  if (!groups.length) return null

  const winners = groups.filter((group) => group.code.endsWith('-1'))
  const allStars = groups.find((group) => group.code === 'AS')
  const pick = (codes: string[]) =>
    groups.filter((group) => codes.includes(group.code))

  return (
    <section aria-labelledby="awards-heading" className="mt-6">
      <h2 id="awards-heading" className="text-lg font-semibold">
        {season.name} awards
      </h2>
      <div className="mt-2 grid gap-4 md:grid-cols-2">
        {winners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Season awards</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-4 sm:grid-cols-[auto_1fr] sm:gap-y-1">
                {winners.map((group) => (
                  <div key={group.code} className="contents">
                    <dt className="text-muted-foreground">{group.title}</dt>
                    <dd className="mb-2 sm:mb-0">
                      <PlayerList group={group} />
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
        <TeamsCard title="All-Defensive" groups={pick(ALL_DEFENSIVE)} />
        <div className="md:col-span-2">
          <TeamsCard title="All-NBA" groups={pick(ALL_NBA)} />
        </div>
        {allStars && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All-Stars</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerList
                group={allStars}
                className="columns-2 sm:columns-3 md:columns-4"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
