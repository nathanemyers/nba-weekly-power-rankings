import { useId } from 'react'
import { Link } from 'react-router'
import { getTeamStorylines, type Season } from '@/data/seasonData'
import { useAppDispatch } from '@/store/hooks'
import { setPinnedTeams } from '@/store/slices/chart'
import { getTeamName, type Team, type TeamRankings } from 'types'
import { Button } from '../ui/button'
import DataSourceBadge from '../Badges/DataSourceBadge'
import StorylineList from '../StorylineList'
import TopPlayerBadges from './TopPlayerBadges'

interface SeasonDetailProps {
  season: Season
  team: TeamRankings
  teamId: Team
  headingLevel?: 'h2' | 'h3'
}

export default function SeasonDetail(props: SeasonDetailProps) {
  const dispatch = useAppDispatch()
  const headingId = useId()
  const { season } = props
  const storylines = getTeamStorylines(season, props.teamId)
  const Heading = props.headingLevel

  return (
    <section
      aria-labelledby={Heading ? headingId : undefined}
      aria-label={Heading ? undefined : `${season.name} details`}
      className="flex flex-col gap-3"
    >
      {Heading && (
        <Heading id={headingId} className="text-2xl font-semibold">
          {season.name}
        </Heading>
      )}
      <h3 className="text-lg font-semibold">Storylines</h3>
      {storylines.length > 0 ? (
        <StorylineList
          label={`${season.name} ${getTeamName(props.teamId)} storylines`}
          storylines={storylines}
          hideTeam={props.teamId}
        />
      ) : (
        <p className="text-muted-foreground">
          {season.completed
            ? 'No storylines for this season'
            : 'Storylines appear once the season is complete'}
        </p>
      )}
      <h3 className="mt-2 text-lg font-semibold">Top players</h3>
      <TopPlayerBadges season={season} team={props.team} />
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        <DataSourceBadge source={season.source} season={season.name} />
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link
            to={'/' + season.name}
            aria-label={`View ${season.name} chart`}
            onClick={() => dispatch(setPinnedTeams([props.teamId]))}
          >
            View season chart
          </Link>
        </Button>
      </div>
    </section>
  )
}
