import { cn } from 'cn'
import { DataSource } from 'types'
import { Badge } from './ui/badge'

interface DataSourceBadgeProps {
  source: DataSource
  season: string
  className?: string
}

const SOURCES = {
  [DataSource.NBA]: {
    label: 'NBA.com',
    title: 'Weekly Power Rankings by John Schuhmann on NBA.com',
    url: () => 'https://www.nba.com/news/category/power-rankings',
  },
  [DataSource.ESPN]: {
    label: 'ESPN',
    title: 'Weekly Power Rankings by Marc Stein on ESPN.com',
    url: (season: string) =>
      `https://www.espn.com/nba/powerrankings/_/year/${Number(season.slice(0, 4)) + 1}`,
  },
}

export default function DataSourceBadge(props: DataSourceBadgeProps) {
  const source = SOURCES[props.source]

  return (
    <Badge
      asChild
      variant="outline"
      className={cn('text-muted-foreground', props.className)}
    >
      <a
        href={source.url(props.season)}
        target="_blank"
        rel="noopener noreferrer"
        title={source.title}
        aria-label={`${props.season} rankings source: ${source.title}`}
        // Team history cards navigate on click, so keep the link from triggering that too
        onClick={(event) => event.stopPropagation()}
      >
        Source: {source.label}
      </a>
    </Badge>
  )
}
