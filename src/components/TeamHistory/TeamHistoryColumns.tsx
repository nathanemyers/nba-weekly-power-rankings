import { Fragment, useId, useState, type UIEvent } from 'react'
import { cn } from 'cn'
import type { Season } from '@/data/seasonData'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Team } from 'types'
import { Separator } from '../ui/separator'
import SeasonOverview from './SeasonOverview'
import SeasonDetail from './SeasonDetail'
import { getTeamSeasons } from './getTeamSeasons'

interface TeamHistoryColumnsProps {
  team: Team
  seasons: Season[]
}

const findSeason = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-season="${name}"]`)

// Distance from the top of a scroll container's content to the top of one of its descendants
const offsetIn = (container: HTMLElement, element: HTMLElement) =>
  element.getBoundingClientRect().top -
  container.getBoundingClientRect().top +
  container.scrollTop

export default function TeamHistoryColumns(props: TeamHistoryColumnsProps) {
  const entries = getTeamSeasons(props.seasons, props.team)
  const leftId = useId()
  const rightId = useId()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const behavior = reduceMotion ? 'auto' : 'smooth'
  const [active, setActive] = useState(entries[0]?.season.name)
  const [scrollTarget, setScrollTarget] = useState<string>()

  function selectSeason(name: string) {
    setActive(name)
    const column = document.getElementById(rightId)
    const section = column && findSeason(column, name)
    if (!column || !section) return
    const top = Math.min(
      offsetIn(column, section),
      column.scrollHeight - column.clientHeight
    )
    if (Math.abs(top - column.scrollTop) <= 1) return
    setScrollTarget(name)
    column.scrollTo({ top, behavior })
  }

  function revealEntry(name: string) {
    const nav = document.getElementById(leftId)
    const entry = nav && findSeason(nav, name)
    if (!nav || !entry) return
    const top = offsetIn(nav, entry)
    const bottom = top + entry.offsetHeight
    if (top < nav.scrollTop) nav.scrollTo({ top, behavior })
    else if (bottom > nav.scrollTop + nav.clientHeight)
      nav.scrollTo({ top: bottom - nav.clientHeight, behavior })
  }

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const column = event.currentTarget
    const atEnd =
      column.scrollTop + column.clientHeight >= column.scrollHeight - 1
    let current: string | undefined = entries[0]?.season.name
    for (const { season } of entries) {
      const section = findSeason(column, season.name)
      if (section && offsetIn(column, section) <= column.scrollTop + 1)
        current = season.name
    }
    if (atEnd) current = entries.at(-1)?.season.name
    if (scrollTarget) {
      if (current === scrollTarget || atEnd) setScrollTarget(undefined)
      return
    }
    if (current && current !== active) {
      setActive(current)
      revealEntry(current)
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[20rem_minmax(0,1fr)] gap-6">
      <nav
        id={leftId}
        aria-label="Seasons"
        className="relative overflow-y-auto p-1 pr-2"
      >
        <ul className="flex flex-col gap-1">
          {entries.map(({ season, team }) => {
            const isActive = season.name === active
            return (
              <li
                key={season.name}
                data-season={season.name}
                className={cn(
                  'relative rounded-lg p-3',
                  isActive ? 'bg-muted ring-1 ring-ring' : 'hover:bg-muted/50'
                )}
              >
                <SeasonOverview
                  season={season}
                  team={team}
                  title={
                    <button
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
                      onClick={() => selectSeason(season.name)}
                    >
                      {season.name}
                    </button>
                  }
                />
              </li>
            )
          })}
        </ul>
      </nav>
      <div
        id={rightId}
        className="relative overflow-y-auto pr-2"
        onScroll={onScroll}
        onScrollEnd={() => setScrollTarget(undefined)}
      >
        {entries.map(({ season, team }, index) => (
          <Fragment key={season.name}>
            {index > 0 && <Separator className="my-6" />}
            <div data-season={season.name}>
              <SeasonDetail
                season={season}
                team={team}
                teamId={props.team}
                headingLevel="h2"
              />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
