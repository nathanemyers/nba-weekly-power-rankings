import { cn } from 'cn'
import { seasonAwards, type AwardKind } from '@/data/awards'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

const VARIANTS: Record<AwardKind, 'default' | 'secondary' | 'outline'> = {
  won: 'default',
  selection: 'secondary',
  vote: 'outline',
}

export default function AwardBadges(props: { codes?: string[] }) {
  const awards = seasonAwards(props.codes)
  if (!awards.length) return null

  return (
    <ul aria-label="Season awards" className="flex w-max gap-1">
      {awards.map((award) => (
        <li key={award.code}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={VARIANTS[award.kind]}
                data-kind={award.kind}
                className={cn(award.kind === 'vote' && 'text-muted-foreground')}
              >
                <span aria-hidden>{award.label}</span>
                <span className="sr-only">{award.title}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{award.title}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}
