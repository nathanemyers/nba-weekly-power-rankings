import type { Storyline } from 'schemas/season'
import type { PlayoffStage, Team } from 'types'

// Shapes of data/raw/storylines/<season>.json; see specs/007-season-storylines/data-model.md
export type CandidateKind = 'team' | 'playoffs' | 'trade' | 'season' | 'draft'
export type CandidateStatus = 'pending' | 'included' | 'excluded'

export type Candidate = Storyline & {
  kind: CandidateKind
  blockbuster: boolean
  guidance: string[]
  status: CandidateStatus
}

export type GuidanceTopic = {
  id: string
  summary: string
  origin: string
  teams: Team[]
  weeks?: number[]
}

export type RawStorylines = {
  season: string
  updatedAt: string
  guidance: GuidanceTopic[]
  candidates: Candidate[]
}

export type ReviewState = {
  raw: RawStorylines
  teams: Team[]
  playoffs: Partial<Record<Team, PlayoffStage>>
  finalized: boolean
  failures: string[]
  finalizeFailures: string[]
  running: string | null
}

// Outcome of a headless `/season-storylines <season> more <section>` run
export type MoreResult = {
  section: string
  added: string[]
  summary?: string
  costUsd?: number
  error?: string
}

export const KINDS: CandidateKind[] = [
  'team',
  'playoffs',
  'trade',
  'season',
  'draft',
]

export const isSeasonStoryline = (candidate: Candidate) =>
  candidate.featured || candidate.kind === 'season'

async function readResponse(response: Response): Promise<ReviewState> {
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.failures?.join('\n'))
  return payload
}

const endpoint = (season: string) => `/__storylines/${season}`

export const fetchSeasons = (): Promise<string[]> =>
  fetch('/__storylines')
    .then((response) => response.json())
    .then((payload) => payload.seasons)

export const fetchReview = (season: string) =>
  fetch(endpoint(season)).then(readResponse)

export const saveReview = (raw: RawStorylines) =>
  fetch(endpoint(raw.season), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(raw),
  }).then(readResponse)

export const findMore = (season: string, section: string) =>
  fetch(`${endpoint(season)}/more`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section }),
  }).then(
    readResponse as (
      response: Response
    ) => Promise<ReviewState & { more: MoreResult }>
  )

export const finalizeReview = (season: string) =>
  fetch(`${endpoint(season)}/finalize`, { method: 'POST' }).then(readResponse)
