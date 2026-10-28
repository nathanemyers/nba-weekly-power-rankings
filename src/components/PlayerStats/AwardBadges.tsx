import { seasonAwards } from '@/data/awards'
import AwardBadge from 'components/Badges/AwardBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from 'components/ui/tooltip'

export default function AwardBadges(props: { codes?: string[] }) {
  const awards = seasonAwards(props.codes)
  if (!awards.length) return null

  return (
    <ul aria-label="Season awards" className="flex w-max gap-1">
      {awards.map((award) => (
        <li key={award.code}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AwardBadge award={award} />
            </TooltipTrigger>
            <TooltipContent>{award.title}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}
