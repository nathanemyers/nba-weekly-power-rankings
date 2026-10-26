import type {
  CoachStint,
  RosterEntry,
  SeriesResult,
  WeekRanking,
} from 'schemas/season'

export type {
  CoachStint,
  RosterEntry,
  SeasonData,
  SeriesResult,
  WeekRanking,
} from 'schemas/season'

export type TeamRankings = TeamDisplay & {
  rankings: WeekRanking[]
  playoff?: PlayoffStage
  playoffSeries?: SeriesResult[]
  aiSummary?: string
  roster?: RosterEntry[]
  coaches?: CoachStint[]
}

// Where a season's weekly rankings were scraped from
export enum DataSource {
  NBA = 'nba',
  ESPN = 'espn',
}

export enum PlayoffStage {
  FirstRound = 'first-round',
  SecondRound = 'semis',
  ConferenceFinals = 'conf-finals',
  Finals = 'finals',
  Champion = 'champion',
}

export type SeriesRound = Exclude<PlayoffStage, PlayoffStage.Champion>

export enum Team {
  Atlanta = 'atl',
  Boston = 'bos',
  Brooklyn = 'bkn',
  Charlotte = 'cha',
  Chicago = 'chi',
  Cleveland = 'cle',
  Dallas = 'dal',
  Denver = 'den',
  Detroit = 'det',
  GoldenState = 'gsw',
  Houston = 'hou',
  Indiana = 'ind',
  LAClippers = 'lac',
  LALakers = 'lal',
  Memphis = 'mem',
  Miami = 'mia',
  Milwaukee = 'mil',
  Minnesota = 'min',
  NewOrleans = 'nop',
  NewYork = 'nyk',
  OklahomaCity = 'okc',
  Orlando = 'orl',
  Philadelphia = 'phi',
  Phoenix = 'phx',
  Portland = 'por',
  Sacramento = 'sac',
  SanAntonio = 'sas',
  Toronto = 'tor',
  Utah = 'uta',
  Washington = 'was',
}

export type TeamDisplay = { teamId: Team; name: string; color: string }

export const Teams: TeamDisplay[] = [
  { teamId: Team.Atlanta, name: 'Atlanta Hawks', color: '#E03A3E' },
  { teamId: Team.Boston, name: 'Boston Celtics', color: '#2EAD61' },
  { teamId: Team.Brooklyn, name: 'Brooklyn Nets', color: '#B5BCC8' },
  { teamId: Team.Charlotte, name: 'Charlotte Hornets', color: '#35C2E8' },
  { teamId: Team.Chicago, name: 'Chicago Bulls', color: '#FF5A5F' },
  { teamId: Team.Cleveland, name: 'Cleveland Cavaliers', color: '#FDBB30' },
  { teamId: Team.Dallas, name: 'Dallas Mavericks', color: '#4A90E2' },
  { teamId: Team.Denver, name: 'Denver Nuggets', color: '#FF9F43' },
  { teamId: Team.Detroit, name: 'Detroit Pistons', color: '#E83E8C' },
  { teamId: Team.GoldenState, name: 'Golden State Warriors', color: '#C7F464' },
  { teamId: Team.Houston, name: 'Houston Rockets', color: '#F08080' },
  { teamId: Team.Indiana, name: 'Indiana Pacers', color: '#00D1B2' },
  { teamId: Team.LAClippers, name: 'LA Clippers', color: '#F472B6' },
  { teamId: Team.LALakers, name: 'Los Angeles Lakers', color: '#B388FF' },
  { teamId: Team.Memphis, name: 'Memphis Grizzlies', color: '#7C9FD6' },
  { teamId: Team.Miami, name: 'Miami Heat', color: '#E0115F' },
  { teamId: Team.Milwaukee, name: 'Milwaukee Bucks', color: '#6BCB77' },
  { teamId: Team.Minnesota, name: 'Minnesota Timberwolves', color: '#A3E635' },
  { teamId: Team.NewOrleans, name: 'New Orleans Pelicans', color: '#D4A76A' },
  { teamId: Team.NewYork, name: 'New York Knicks', color: '#F28C28' },
  {
    teamId: Team.OklahomaCity,
    name: 'Oklahoma City Thunder',
    color: '#60A5FA',
  },
  { teamId: Team.Orlando, name: 'Orlando Magic', color: '#5EEAD4' },
  { teamId: Team.Philadelphia, name: 'Philadelphia 76ers', color: '#818CF8' },
  { teamId: Team.Phoenix, name: 'Phoenix Suns', color: '#FB923C' },
  { teamId: Team.Portland, name: 'Portland Trail Blazers', color: '#EF4444' },
  { teamId: Team.Sacramento, name: 'Sacramento Kings', color: '#A78BFA' },
  { teamId: Team.SanAntonio, name: 'San Antonio Spurs', color: '#CBD5E1' },
  { teamId: Team.Toronto, name: 'Toronto Raptors', color: '#F43F5E' },
  { teamId: Team.Utah, name: 'Utah Jazz', color: '#FACC15' },
  { teamId: Team.Washington, name: 'Washington Wizards', color: '#38BDF8' },
]

export const getTeamName = (teamId: Team): string => {
  const team = Teams.find((t) => t.teamId === teamId)
  return team ? team.name : 'Unknown Team'
}

export const atlanticDivisionTeams = [
  Team.Boston,
  Team.Brooklyn,
  Team.NewYork,
  Team.Philadelphia,
  Team.Toronto,
]

export const centralDivisionTeams = [
  Team.Chicago,
  Team.Cleveland,
  Team.Detroit,
  Team.Indiana,
  Team.Milwaukee,
]

export const southeastDivisionTeams = [
  Team.Atlanta,
  Team.Charlotte,
  Team.Miami,
  Team.Orlando,
  Team.Washington,
]

export const northwestDivisionTeams = [
  Team.Denver,
  Team.Minnesota,
  Team.OklahomaCity,
  Team.Portland,
  Team.Utah,
]

export const pacificDivisionTeams = [
  Team.GoldenState,
  Team.LAClippers,
  Team.LALakers,
  Team.Phoenix,
  Team.Sacramento,
]

export const southwestDivisionTeams = [
  Team.Houston,
  Team.Memphis,
  Team.Dallas,
  Team.NewOrleans,
  Team.SanAntonio,
]

export const westernConferenceTeams = [
  ...northwestDivisionTeams,
  ...pacificDivisionTeams,
  ...southwestDivisionTeams,
]

export const easternConferenceTeams = [
  ...atlanticDivisionTeams,
  ...centralDivisionTeams,
  ...southeastDivisionTeams,
]
