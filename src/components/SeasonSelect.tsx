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
import { selectSeasonOrder } from 'store/slices/seasons/seasons'

export default function SeasonSelect() {
  const dispatch = useAppDispatch()
  const seasons = useAppSelector(selectSeasonOrder)
  const season = useAppSelector(selectSeason)

  return (
    <Select
      value={season}
      onValueChange={(value) => dispatch(seasonSelected(value))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Season" />
      </SelectTrigger>
      <SelectContent className="bg-muted">
        {seasons.map((s) => (
          <SelectItem className="" key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
