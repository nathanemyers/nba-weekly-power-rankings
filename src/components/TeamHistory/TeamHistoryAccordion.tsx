import { ChevronDown } from 'lucide-react'
import type { Season } from '@/data/seasonData'
import type { Team } from 'types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import SeasonOverview from './SeasonOverview'
import SeasonDetail from './SeasonDetail'
import { getTeamSeasons } from './getTeamSeasons'

interface TeamHistoryAccordionProps {
  team: Team
  seasons: Season[]
}

export default function TeamHistoryAccordion(props: TeamHistoryAccordionProps) {
  return (
    <Accordion type="multiple">
      {getTeamSeasons(props.seasons, props.team).map(({ season, team }) => (
        <AccordionItem
          key={season.name}
          value={season.name}
          className="group/season"
        >
          <div className="relative py-3 pr-8">
            <ChevronDown
              aria-hidden
              className="absolute top-4 right-0 size-5 text-muted-foreground transition-transform group-data-[state=open]/season:rotate-180"
            />
            <SeasonOverview
              season={season}
              team={team}
              title={
                <AccordionTrigger className="static cursor-pointer p-0 text-lg font-semibold hover:no-underline after:absolute after:inset-0 after:content-[''] **:data-[slot=accordion-trigger-icon]:hidden">
                  {season.name}
                </AccordionTrigger>
              }
            />
          </div>
          <AccordionContent className="pb-4 text-base [&_a]:no-underline">
            <SeasonDetail season={season} team={team} teamId={props.team} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
