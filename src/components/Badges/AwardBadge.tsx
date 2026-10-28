import type { Award, AwardKind } from '@/data/awards'
import { cn } from 'cn'
import { Badge } from 'components/ui/badge'

const VARIANTS: Record<AwardKind, 'default' | 'secondary' | 'outline'> = {
  won: 'default',
  selection: 'secondary',
  vote: 'outline',
}

interface AwardBadgeProps {
  award: Award
}

export default function AwardBadge(props: AwardBadgeProps) {
  return (
    <Badge
      variant={VARIANTS[props.award.kind]}
      data-kind={props.award.kind}
      className={cn(props.award.kind === 'vote' && 'text-muted-foreground')}
    >
      <span aria-hidden>{props.award.label}</span>
      <span className="sr-only">{props.award.title}</span>
    </Badge>
  )
}
