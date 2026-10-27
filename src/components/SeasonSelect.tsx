import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useNavigate, useParams } from 'react-router'
import { useAppDispatch } from 'store/hooks'
import { seasonIndex } from '@/data/seasonData'
import TeamLogo from './TeamLogo'
import { setPinnedTeams } from '@/store/slices/chart'

export default function SeasonSelect() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const selectedSeason = useParams().season ?? ''

  return (
    <Select
      value={selectedSeason}
      onValueChange={(value) => {
        dispatch(setPinnedTeams([]))
        navigate('/' + value)
      }}
    >
      <SelectTrigger className="md:w-[180px] w-full text-lg">
        <SelectValue placeholder="Season">{`${selectedSeason} Season`}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {seasonIndex.map((s) => {
          return (
            <SelectItem className="h-10 text-lg" key={s.name} value={s.name}>
              {s.name}
              {s.champion && (
                <TeamLogo team={s.champion} className="size-8 object-contain" />
              )}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
