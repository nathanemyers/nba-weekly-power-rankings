import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { Team } from 'types'
import TeamPicker from './TeamPicker'
import {
  KINDS,
  type Candidate,
  type CandidateKind,
  type CandidateStatus,
  type GuidanceTopic,
} from './types'

const STATUS_LABELS: Record<CandidateStatus, string> = {
  included: 'Include',
  excluded: 'Exclude',
  pending: 'Pending',
}

interface CandidateRowProps {
  candidate: Candidate
  teams: Team[]
  guidance: GuidanceTopic[]
  failures: string[]
  onChange: (candidate: Candidate) => void
}

export default function CandidateRow(props: CandidateRowProps) {
  const { candidate } = props
  const update = (changes: Partial<Candidate>) =>
    props.onChange({ ...candidate, ...changes })
  const topics = props.guidance.filter((topic) =>
    candidate.guidance.includes(topic.id)
  )

  return (
    <li
      data-status={candidate.status}
      aria-label={candidate.title}
      className="flex flex-col gap-3 rounded-lg border border-l-4 border-border bg-card p-4 data-[status=excluded]:border-l-review-excluded data-[status=excluded]:opacity-60 data-[status=included]:border-l-review-included data-[status=pending]:border-l-review-pending"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ButtonGroup aria-label="Status">
          {(Object.keys(STATUS_LABELS) as CandidateStatus[]).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={candidate.status === status ? 'default' : 'outline'}
              aria-pressed={candidate.status === status}
              className="cursor-pointer"
              onClick={() => update({ status })}
            >
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </ButtonGroup>
        <Button
          size="sm"
          variant={candidate.featured ? 'default' : 'outline'}
          aria-pressed={candidate.featured}
          className="cursor-pointer"
          onClick={() =>
            update({
              featured: !candidate.featured,
              blockbuster: !candidate.featured && candidate.blockbuster,
            })
          }
        >
          Season storyline
        </Button>
        <NativeSelect
          size="sm"
          aria-label="Kind"
          value={candidate.kind}
          onChange={(event) => {
            const kind = event.target.value as CandidateKind
            update({
              kind,
              blockbuster: kind === 'trade' && candidate.blockbuster,
            })
          }}
          className="cursor-pointer"
        >
          {KINDS.map((kind) => (
            <NativeSelectOption key={kind} value={kind}>
              {kind}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {candidate.kind === 'trade' && (
          <Button
            size="sm"
            variant={candidate.blockbuster ? 'default' : 'outline'}
            aria-pressed={candidate.blockbuster}
            className="cursor-pointer"
            onClick={() =>
              update({
                blockbuster: !candidate.blockbuster,
                featured: !candidate.blockbuster || candidate.featured,
              })
            }
          >
            Blockbuster
          </Button>
        )}
        <Input
          type="date"
          aria-label="Event date"
          value={candidate.eventDate}
          onChange={(event) => update({ eventDate: event.target.value })}
          className="ml-auto h-7 w-auto"
        />
      </div>

      <Input
        aria-label="Title"
        value={candidate.title}
        onChange={(event) => update({ title: event.target.value })}
        className="font-semibold"
      />

      <div>
        <a
          href={candidate.article.url}
          target="_blank"
          rel="noreferrer"
          className="cursor-pointer text-foreground-soft hover:underline"
        >
          {candidate.article.headline}
        </a>
        <p className="text-sm text-muted-foreground">
          {candidate.article.publisher} · published{' '}
          {candidate.article.publishedAt}
        </p>
      </div>

      <TeamPicker
        teams={props.teams}
        value={candidate.teams}
        onChange={(teams) => update({ teams })}
      />

      {topics.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {topics.map((topic) => (
            <li key={topic.id}>
              <span className="text-dim">{topic.origin}</span> {topic.summary}
            </li>
          ))}
        </ul>
      )}

      {props.failures.length > 0 && (
        <ul className="text-sm text-destructive">
          {props.failures.map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
        </ul>
      )}
    </li>
  )
}
