import { use, useState } from 'react'
import { useNavigate } from 'react-router'
import { searchPlayers, type PlayerSummary } from '@/data/playerHistory'
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from 'components/ui/autocomplete'

const MAX_RESULTS = 20

const seasonRange = (player: PlayerSummary) =>
  player.firstSeason === player.lastSeason
    ? player.firstSeason
    : `${player.firstSeason} to ${player.lastSeason}`

export default function PlayerSearch(props: {
  players: Promise<PlayerSummary[]>
}) {
  const players = use(props.players)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const results = searchPlayers(players, query, MAX_RESULTS)

  return (
    <Autocomplete
      items={players}
      filteredItems={results}
      value={query}
      onValueChange={(value, details) =>
        setQuery(details.reason === 'item-press' ? '' : value)
      }
      autoHighlight
      itemToStringValue={(player: PlayerSummary) => player.name}
    >
      <AutocompleteInput
        aria-label="Player name"
        placeholder="Find a player…"
        className="w-64"
      />
      <AutocompleteContent align="end" className="w-72">
        {query.trim() && (
          <AutocompleteEmpty>No players found.</AutocompleteEmpty>
        )}
        <AutocompleteList>
          {(player: PlayerSummary) => (
            <AutocompleteItem
              key={player.id}
              value={player}
              onClick={() => navigate('/playerHistory/' + player.id)}
              className="justify-between"
            >
              <span>{player.name}</span>
              <span className="text-xs text-muted-foreground">
                {seasonRange(player)}
              </span>
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  )
}
