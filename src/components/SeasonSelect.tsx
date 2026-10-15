import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { setSelectedSeason, getSelectedSeason } from '@/store/slices/UI/UI'
import {
  selectSeasonOrder,
  selectSeasonsById,
} from 'store/slices/seasons/seasons'
import TeamLogo from './TeamLogo'

export default function SeasonSelect() {
  const dispatch = useAppDispatch()
  const seasons = useAppSelector(selectSeasonOrder)
  const bySeason = useAppSelector(selectSeasonsById)
  const season = useAppSelector(getSelectedSeason)

  return (
    <Select
      value={season}
      onValueChange={(value) => dispatch(setSelectedSeason(value))}
    >
      <SelectTrigger className="md:w-[180px] w-full text-lg">
        <SelectValue placeholder="Season">{`${season} Season`}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {seasons.map((s) => {
          const champion = bySeason[s].champion
          return (
            <SelectItem className="h-10 text-lg" key={s} value={s}>
              {s}
              {champion && (
                <TeamLogo team={champion} className="size-8 object-contain" />
              )}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
