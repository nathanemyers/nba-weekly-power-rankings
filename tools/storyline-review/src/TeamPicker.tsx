import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import TeamLogo from '@/components/TeamLogo'
import { getTeamName, type Team } from 'types'

interface TeamPickerProps {
  teams: Team[]
  value: Team[]
  onChange: (teams: Team[]) => void
}

export default function TeamPicker(props: TeamPickerProps) {
  const anchor = useComboboxAnchor()
  return (
    <Combobox
      multiple
      autoHighlight
      items={props.teams}
      value={props.value}
      onValueChange={props.onChange}
      itemToStringLabel={getTeamName}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(teams: Team[]) =>
            teams.map((team) => (
              <ComboboxChip key={team} aria-label={getTeamName(team)}>
                <TeamLogo team={team} className="size-4 object-contain" />
                {team.toUpperCase()}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput placeholder="Add team" />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No teams found</ComboboxEmpty>
        <ComboboxList>
          {(team: Team) => (
            <ComboboxItem key={team} value={team} className="cursor-pointer">
              <TeamLogo team={team} className="size-4 object-contain" />
              {getTeamName(team)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
