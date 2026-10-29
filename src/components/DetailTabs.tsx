import { useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { getSinglePinnedTeam } from '@/store/slices/chart'
import { useSeason } from '@/hooks/useSeason'
import {
  getAISummary,
  getSeasonStorylines,
  getTeamRankings,
  getTeamStorylines,
} from '@/data/seasonData'
import { getSeasonAwardGroups } from '@/data/awards'
import { getMostDeclinedTeams, getMostImprovedTeams } from '@/data/analysis'
import TeamSeasonSummary from './TeamSeasonSummary'
import RankSwings from './RankSwings'
import RosterPane from './RosterPane'
import SeasonAwardsPane from './SeasonAwardsPane'
import SeasonStorylinesPane from './SeasonStorylinesPane'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type DetailTabId = 'summary' | 'trends' | 'roster' | 'awards' | 'storylines'

const TABS: { id: DetailTabId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'trends', label: 'Trends' },
  { id: 'roster', label: 'Roster' },
  { id: 'awards', label: 'Awards' },
  { id: 'storylines', label: 'Storylines' },
]

const PINNED_ORDER: DetailTabId[] = [
  'roster',
  'summary',
  'trends',
  'awards',
  'storylines',
]
const UNPINNED_ORDER: DetailTabId[] = ['storylines', 'awards', 'trends']

export default function DetailTabs() {
  const [chosenTab, setChosenTab] = useState<DetailTabId>()
  const season = useSeason()
  const team = useAppSelector(getSinglePinnedTeam)

  const isAvailable: Record<DetailTabId, boolean> = {
    summary:
      !!team &&
      (!!getAISummary(season, team) ||
        getTeamStorylines(season, team).length > 0),
    trends:
      getMostImprovedTeams(season).length +
        getMostDeclinedTeams(season).length >
      0,
    roster: !!team && !!getTeamRankings(season, team)?.roster?.length,
    awards: getSeasonAwardGroups(season).length > 0,
    storylines: getSeasonStorylines(season).length > 0,
  }

  const defaultTab = (team ? PINNED_ORDER : UNPINNED_ORDER).find(
    (id) => isAvailable[id]
  )
  const shownTab = chosenTab && isAvailable[chosenTab] ? chosenTab : defaultTab
  if (!shownTab) return null

  // Short tabs fill a screen so switching from a long tab doesn't shrink the page and jump the scroll

  return (
    <Tabs
      value={shownTab}
      onValueChange={(value) => setChosenTab(value as DetailTabId)}
    >
      <TabsList className="w-full">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={!isAvailable[tab.id]}
            className="cursor-pointer"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="summary" className="min-h-svh pt-2">
        <TeamSeasonSummary />
      </TabsContent>
      <TabsContent value="trends" className="min-h-svh pt-2">
        <RankSwings />
      </TabsContent>
      <TabsContent value="roster" className="pt-2">
        <RosterPane />
      </TabsContent>
      <TabsContent value="awards" className="pt-2">
        <SeasonAwardsPane />
      </TabsContent>
      <TabsContent value="storylines" className="pt-2">
        <SeasonStorylinesPane />
      </TabsContent>
    </Tabs>
  )
}
