import { Button } from '@/components/ui/button'

interface FindMoreProps {
  section: string
  label: string
  finding: string | null
  finished: { count: number; failed: boolean }
  onFind: (section: string) => void
}

export default function FindMore(props: FindMoreProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <Button
        key={props.finished.count}
        size="sm"
        variant="outline"
        disabled={props.finding !== null}
        onClick={() => props.onFind(props.section)}
        data-finished={props.finished.count > 0 || undefined}
        data-failed={props.finished.failed || undefined}
        className="cursor-pointer [--attention:var(--color-primary)] data-[failed]:[--attention:var(--color-destructive)] data-[finished]:animate-attention"
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
  )
}
