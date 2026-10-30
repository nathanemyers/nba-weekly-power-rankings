import { Toggle } from '@/components/ui/toggle'
import TeamLogo from '@/components/TeamLogo'
import type { PlayoffStage, Team } from 'types'
import { isSeasonStoryline, type Candidate } from './types'

export type TeamFilter = Team | 'season' | null

interface TeamCoverageProps {
  teams: Team[]
  playoffs: Partial<Record<Team, PlayoffStage>>
  candidates: Candidate[]
  selected: TeamFilter
  onSelect: (filter: TeamFilter) => void
}

function counts(candidates: Candidate[]) {
  return {
    included: candidates.filter((c) => c.status === 'included').length,
    pending: candidates.filter((c) => c.status === 'pending').length,
    total: candidates.length,
  }
}

function CoverageTile(props: {
  label: string
  logo?: Team
  detail?: string
  candidates: Candidate[]
  missing: boolean
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
}) {
  const { included, pending, total } = counts(props.candidates)
  return (
    <Toggle
      variant="outline"
      pressed={props.pressed}
      onPressedChange={props.onPressedChange}
      data-coverage={props.missing ? 'missing' : 'ok'}
      aria-label={props.label}
      className="h-auto cursor-pointer flex-col items-start gap-1 p-2 data-[coverage=missing]:border-destructive data-[state=on]:ring-2 data-[state=on]:ring-ring"
    >
      <span className="flex items-center gap-1.5">
        {props.logo && (
          <TeamLogo team={props.logo} className="size-5 object-contain" />
        )}
        <span className="font-semibold">{props.label}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        <span className="text-review-included">{included}</span> / {total}
        {pending > 0 && (
          <span className="text-review-pending"> · {pending} pending</span>
        )}
      </span>
      {props.detail && (
        <span className="text-xs text-muted-foreground">{props.detail}</span>
      )}
    </Toggle>
  )
}

export default function TeamCoverage(props: TeamCoverageProps) {
  const select = (filter: TeamFilter) => (pressed: boolean) =>
    props.onSelect(pressed ? filter : null)
  const seasonCandidates = props.candidates.filter(isSeasonStoryline)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      <CoverageTile
        label="Season"
        detail="league-wide"
        candidates={seasonCandidates}
        missing={!seasonCandidates.some((c) => c.status === 'included')}
        pressed={props.selected === 'season'}
        onPressedChange={select('season')}
      />
      {props.teams.map((team) => {
        const teamCandidates = props.candidates.filter((c) =>
          c.teams.includes(team)
        )
        const stage = props.playoffs[team]
        const missingPlayoffs =
          !!stage &&
          !teamCandidates.some(
            (c) => c.status === 'included' && c.kind === 'playoffs'
          )
        return (
          <CoverageTile
            key={team}
            label={team.toUpperCase()}
            logo={team}
            detail={missingPlayoffs ? `${stage} · no playoff storyline` : stage}
            candidates={teamCandidates}
            missing={missingPlayoffs || teamCandidates.length === 0}
            pressed={props.selected === team}
            onPressedChange={select(team)}
          />
        )
      })}
    </div>
  )
}
