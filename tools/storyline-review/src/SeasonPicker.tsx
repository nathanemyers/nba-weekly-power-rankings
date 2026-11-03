import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

// Switching reloads the page so each season starts from a fresh editor
export default function SeasonPicker(props: {
  seasons: string[]
  season: string
}) {
  return (
    <NativeSelect
      aria-label="Season"
      value={props.season}
      onChange={(event) =>
        window.location.assign(`?season=${event.target.value}`)
      }
      className="cursor-pointer"
    >
      {props.seasons.map((season) => (
        <NativeSelectOption key={season} value={season}>
          {season}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
