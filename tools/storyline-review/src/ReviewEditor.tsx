import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import CandidateRow from './CandidateRow'
import TeamCoverage, { type TeamFilter } from './TeamCoverage'
import {
  isSeasonStoryline,
  KINDS,
  saveReview,
  type Candidate,
  type ReviewState,
} from './types'

function matchesFilters(
  candidate: Candidate,
  filters: { team: TeamFilter; status: string; kind: string; search: string }
) {
  if (filters.team === 'season' && !isSeasonStoryline(candidate)) return false
  if (
    filters.team &&
    filters.team !== 'season' &&
    !candidate.teams.includes(filters.team)
  )
    return false
  if (filters.status && candidate.status !== filters.status) return false
  if (filters.kind && candidate.kind !== filters.kind) return false
  const search = filters.search.toLowerCase()
  return (
    !search ||
    candidate.title.toLowerCase().includes(search) ||
    candidate.article.headline.toLowerCase().includes(search)
  )
}

export default function ReviewEditor(props: { initial: ReviewState }) {
  const [review, setReview] = useState(props.initial)
  const [raw, setRaw] = useState(props.initial.raw)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [team, setTeam] = useState<TeamFilter>(null)
  const [status, setStatus] = useState('')
  const [kind, setKind] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const updateCandidates = (change: (candidate: Candidate) => Candidate) => {
    setRaw({ ...raw, candidates: raw.candidates.map(change) })
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    setSaveError(undefined)
    try {
      const saved = await saveReview(raw)
      setReview(saved)
      setRaw(saved.raw)
      setDirty(false)
    } catch (error) {
      setSaveError(String(error))
    } finally {
      setSaving(false)
    }
  }

  const visible = raw.candidates
    .filter((c) => matchesFilters(c, { team, status, kind, search }))
    .toSorted((a, b) => a.eventDate.localeCompare(b.eventDate))
  const pendingVisible = visible.filter((c) => c.status === 'pending')
  const count = (value: string) =>
    raw.candidates.filter((c) => c.status === value).length
  const candidateIds = raw.candidates.map((c) => c.id)
  const otherFailures = review.finalizeFailures.filter(
    (failure) => !candidateIds.some((id) => failure.startsWith(`${id}:`))
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background py-3">
        <h1 className="text-2xl">{raw.season} storyline review</h1>
        {review.finalized && <Badge variant="destructive">Finalized</Badge>}
        <span className="text-sm text-muted-foreground">
          <span className="text-review-included">
            {count('included')} included
          </span>{' '}
          · {count('excluded')} excluded ·{' '}
          <span className="text-review-pending">
            {count('pending')} pending
          </span>
        </span>
        <span className="ml-auto text-sm text-muted-foreground">
          {dirty ? 'Unsaved changes' : `Saved ${raw.updatedAt}`}
        </span>
        <Button
          onClick={save}
          disabled={!dirty || saving}
          className="cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </header>

      {review.finalized && (
        <p className="text-sm text-muted-foreground">
          This season is already finalized. Saving here only changes the raw
          candidates file; rewriting the published list needs{' '}
          <code>
            npm run check:storylines -- {raw.season} --finalize --revise
          </code>
          .
        </p>
      )}

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}

      {(otherFailures.length > 0 || review.failures.length > 0) && (
        <section aria-label="Validation" className="text-sm">
          <h2 className="font-semibold">
            Validation {dirty && '(as of last save)'}
          </h2>
          <ul className="text-destructive">
            {otherFailures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
          {review.failures.length > 0 && (
            <p className="text-muted-foreground">
              {review.failures.length} candidate problems, shown on each row.
            </p>
          )}
        </section>
      )}

      <section aria-label="Coverage" className="flex flex-col gap-2">
        <h2 className="font-semibold">Coverage</h2>
        <p className="text-sm text-muted-foreground">
          Included / total candidates. Red outline: a playoff team without an
          included playoff storyline, or a team with no candidates. Click a tile
          to filter.
        </p>
        <TeamCoverage
          teams={review.teams.toSorted()}
          playoffs={review.playoffs}
          candidates={raw.candidates}
          selected={team}
          onSelect={setTeam}
        />
      </section>

      <section aria-label="Candidates" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">
            {visible.length} of {raw.candidates.length} candidates
          </h2>
          <Input
            aria-label="Search"
            placeholder="Search title or headline"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-56"
          />
          <NativeSelect
            size="sm"
            aria-label="Status filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="cursor-pointer"
          >
            <NativeSelectOption value="">Any status</NativeSelectOption>
            <NativeSelectOption value="pending">Pending</NativeSelectOption>
            <NativeSelectOption value="included">Included</NativeSelectOption>
            <NativeSelectOption value="excluded">Excluded</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            size="sm"
            aria-label="Kind filter"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="cursor-pointer"
          >
            <NativeSelectOption value="">Any kind</NativeSelectOption>
            {KINDS.map((k) => (
              <NativeSelectOption key={k} value={k}>
                {k}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {pendingVisible.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto cursor-pointer"
              onClick={() =>
                updateCandidates((c) =>
                  pendingVisible.includes(c) ? { ...c, status: 'included' } : c
                )
              }
            >
              Include {pendingVisible.length} pending shown
            </Button>
          )}
        </div>
        <ul className="flex flex-col gap-3">
          {visible.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              teams={review.teams.toSorted()}
              guidance={raw.guidance}
              failures={review.failures.filter((failure) =>
                failure.startsWith(`${candidate.id}:`)
              )}
              onChange={(next) =>
                updateCandidates((c) => (c.id === candidate.id ? next : c))
              }
            />
          ))}
        </ul>
      </section>
    </div>
  )
}
