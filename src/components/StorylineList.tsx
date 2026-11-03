import type { Storyline } from 'schemas/season'
import type { Team } from 'types'
import TeamLogo from './TeamLogo'

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

interface StorylineListProps {
  label: string
  storylines: Storyline[]
  hideTeam?: Team
}

export default function StorylineList(props: StorylineListProps) {
  return (
    <ul aria-label={props.label} className="divide-y divide-border">
      {props.storylines.map((storyline) => (
        <li key={storyline.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2">
            {storyline.teams
              .filter((team) => team !== props.hideTeam)
              .map((team) => (
                <TeamLogo
                  key={team}
                  team={team}
                  className="size-5 object-contain"
                />
              ))}
            <h3 className="font-semibold">{storyline.title}</h3>
          </div>
          <a
            href={storyline.article.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer text-foreground-soft hover:underline"
          >
            {storyline.article.headline}
          </a>
          <p className="text-sm text-muted-foreground">
            {storyline.article.publisher} · {formatDate(storyline.eventDate)}
          </p>
        </li>
      ))}
    </ul>
  )
}
