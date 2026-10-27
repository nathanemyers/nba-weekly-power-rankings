import { use, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { searchPlayers, type PlayerSummary } from '@/data/playerHistory'
import { Button } from '../ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const results = searchPlayers(players, query, MAX_RESULTS)

  const choose = (player: PlayerSummary) => {
    setOpen(false)
    setQuery('')
    navigate('/playerHistory/' + player.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-64 cursor-pointer justify-start">
          <Search aria-hidden />
          <span className="text-muted-foreground">Find a player…</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            aria-label="Player name"
            placeholder="Type a player's name"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim() && <CommandEmpty>No players found.</CommandEmpty>}
            {results.map((player) => (
              <CommandItem
                key={player.id}
                value={player.id}
                onSelect={() => choose(player)}
                className="cursor-pointer justify-between"
              >
                <span>{player.name}</span>
                <span className="text-xs text-muted-foreground">
                  {seasonRange(player)}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
