import { Toggle } from '@/components/ui/toggle'
import TrendMinimap from 'components/TrendMinimap/TrendMinimap'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getPinnedTeams, setPinnedTeams } from '@/store/slices/chart'
import { getMostImprovedTeams, getMostDeclinedTeams } from '@/data/analysis'
import type { Season } from '@/data/seasonData'
import { useSeason } from '@/hooks/useSeason'
import TeamLogo from './TeamLogo'
import { getTeamName, type Team } from '@/types'

type TrendEntry = { team: Team; value: number }

function RankChange(props: { value: number }) {
  const { value } = props
  const places = Math.abs(value)
  const className =
    value > 0
      ? 'w-8 shrink-0 text-right tabular-nums text-rank-up'
      : value < 0
        ? 'w-8 shrink-0 text-right tabular-nums text-rank-down'
        : 'w-8 shrink-0 text-right tabular-nums text-rank-mid'
  const text = value > 0 ? `+${places}` : value < 0 ? `−${places}` : '0'
  const label =
    value > 0
      ? `up ${places} places`
      : value < 0
        ? `down ${places} places`
        : 'no change'

  return (
    <>
      <span aria-hidden="true" className={className}>
        {text}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

function TrendRow(props: {
  entry: TrendEntry
  season: Season
  isPressed: boolean
  onClick: () => void
}) {
  const { team, value } = props.entry
  return (
    <Toggle
      className="h-auto w-full min-w-0 cursor-pointer justify-start gap-2 px-2 py-1.5"
      onClick={props.onClick}
      pressed={props.isPressed}
    >
      <TeamLogo team={team} className="size-5 shrink-0 object-contain" />
      <span className="min-w-0 flex-1 truncate text-left">
        {getTeamName(team)}
      </span>
      <TrendMinimap
        team={team}
        season={props.season}
        width={64}
        height={20}
        className="h-5 w-16"
      />
      <RankChange value={value} />
    </Toggle>
  )
}

function TrendList(props: {
  title: string
  entries: TrendEntry[]
  season: Season
  pinnedTeams: Team[]
  onSelect: (team: Team) => void
}) {
  return (
    <section aria-label={props.title} className="min-w-0">
      <h3 className="text-sm text-muted-foreground">{props.title}</h3>
      <ol className="mt-1 flex flex-col gap-0.5">
        {props.entries.map((entry) => (
          <li key={entry.team}>
            <TrendRow
              entry={entry}
              season={props.season}
              isPressed={
                props.pinnedTeams.length === 1 &&
                props.pinnedTeams[0] === entry.team
              }
              onClick={() => props.onSelect(entry.team)}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function RankSwings() {
  const dispatch = useAppDispatch()
  const pinnedTeams = useAppSelector(getPinnedTeams)
  const season = useSeason()
  const select = (team: Team) => dispatch(setPinnedTeams([team]))

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TrendList
        title="Most improved"
        entries={getMostImprovedTeams(season)}
        season={season}
        pinnedTeams={pinnedTeams}
        onSelect={select}
      />
      <TrendList
        title="Most declined"
        entries={getMostDeclinedTeams(season)}
        season={season}
        pinnedTeams={pinnedTeams}
        onSelect={select}
      />
    </div>
  )
}
