import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setSelectedSeason, getSelectedSeason } from '@/store/slices/UI/UI'
import { getSeasons } from 'store/slices/seasons/seasons'
import TeamLogo from './TeamLogo'
import { setPinnedTeams } from '@/store/slices/chart'

export default function SeasonSelect() {
  const dispatch = useAppDispatch()
  const seasons = useAppSelector(getSeasons)
  const selectedSeason = useAppSelector(getSelectedSeason)

  return (
    <Select
      value={selectedSeason.name}
      onValueChange={(value) => {
        dispatch(setSelectedSeason(value))
        dispatch(setPinnedTeams([]))
      }}
    >
      <SelectTrigger className="md:w-[180px] w-full text-lg">
        <SelectValue placeholder="Season">{`${selectedSeason.name} Season`}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {seasons.map((s) => {
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
