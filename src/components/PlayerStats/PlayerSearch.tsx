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
import CareerHighlights from './CareerHighlights'

const MAX_RESULTS = 20

export default function PlayerSearch(props: {
  players: Promise<PlayerSummary[]>
}) {
  const players = use(props.players)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // The dropdown anchors to the whole search box so it spans the icon too
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
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
      <div ref={setAnchor} className="w-full md:w-80">
        <AutocompleteInput
          type={'search'}
          aria-label="Player name"
          placeholder="Find a player…"
          className="w-full"
        />
      </div>
      <AutocompleteContent
        anchor={anchor}
        align="end"
        className="w-(--anchor-width)"
      >
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
                <CareerHighlights player={player} limit={1} />
              </span>
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  )
}
