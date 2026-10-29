import { Button } from '@/components/ui/button'
import type { MoreResult } from './types'

interface FindMoreProps {
  section: string
  label: string
  finding: string | null
  result?: MoreResult
  onFind: (section: string) => void
}

export default function FindMore(props: FindMoreProps) {
  const result =
    props.result?.section === props.section ? props.result : undefined
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          disabled={props.finding !== null}
          onClick={() => props.onFind(props.section)}
          className="cursor-pointer"
        >
          {props.finding === props.section
            ? 'Searching…'
            : `Find more for ${props.label}`}
        </Button>
        <span className="text-muted-foreground">
          {props.finding === null
            ? 'Runs the season-storylines skill headless; new candidates arrive as pending.'
            : props.finding === props.section
              ? 'This takes a few minutes. You can keep reviewing; saving is paused until it finishes.'
              : `Already searching for ${props.finding}.`}
        </span>
      </div>
      {result && (
        <div className="flex flex-col gap-1">
          <p
            data-outcome={result.error ? 'error' : 'ok'}
            className="font-semibold data-[outcome=error]:text-destructive"
          >
            {result.error
              ? `Search failed after adding ${result.added.length} candidates`
              : `Added ${result.added.length} candidates`}
            {result.costUsd !== undefined &&
              ` · ~$${result.costUsd.toFixed(2)} estimated`}
          </p>
          {(result.error ?? result.summary) && (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {result.error ?? result.summary}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
