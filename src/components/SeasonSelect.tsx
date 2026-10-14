import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import {
  seasonSelected,
  selectSeason,
} from 'store/slices/navigation/navigation'
import {
  selectSeasonOrder,
  selectSeasonsById,
} from 'store/slices/seasons/seasons'
import TeamLogo from './TeamLogo'

export default function SeasonSelect() {
  const dispatch = useAppDispatch()
  const seasons = useAppSelector(selectSeasonOrder)
  const bySeason = useAppSelector(selectSeasonsById)
  const season = useAppSelector(selectSeason)

  return (
    <Select
      value={season}
      onValueChange={(value) => dispatch(seasonSelected(value))}
    >
      <SelectTrigger className="w-[180px]">
        {/* Explicit children keep the champion logo out of the closed trigger */}
        <SelectValue placeholder="Season">{season}</SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {seasons.map((s) => {
          const champion = bySeason[s].champion
          return (
            <SelectItem key={s} value={s}>
              {s}
              {champion && (
                <TeamLogo team={champion} className="size-5 object-contain" />
              )}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
