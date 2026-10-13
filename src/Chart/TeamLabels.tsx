import type { Margin, Team, TeamRankings } from "../types";
import { interpolate, type ChartTransitionState } from "./useChartTransition";
import { firstRankingInRange, getYforRank, PLAYOFF_MEDALS } from "./utils";
import styled from "styled-components";

const TeamLabel = styled.text`
  cursor: pointer;
  font-size: 13px;
  transition:
    fill 150ms,
    font-weight 150ms;
`;

const PlayoffMedal = styled.text``;

interface TeamLabelsProps {
  teams: TeamRankings[];
  transition: ChartTransitionState;
  activeTeams: Team[];
  margin: Margin;
  height: number;
  onHover: (teamId: Team) => void;
  onClick: (teamId: Team) => void;
}

export default function TeamLabels(props: TeamLabelsProps) {
  const { transition } = props;

  // Labels glide between the first-visible-week rank of the old and new ranges
  const labelY = (team: TeamRankings) => {
    const from = firstRankingInRange(
      team.rankings,
      transition.fromStart,
      transition.fromStart + transition.fromSpan,
    );
    const to = firstRankingInRange(
      team.rankings,
      transition.toStart,
      transition.toStart + transition.toSpan,
    );
    const fromRank = from?.rank ?? to?.rank;
    const toRank = to?.rank ?? from?.rank;
    if (fromRank === undefined || toRank === undefined) return undefined;
    return interpolate(
      getYforRank(fromRank, props.height, props.margin),
      getYforRank(toRank, props.height, props.margin),
      transition.progress,
    );
  };

  const anyActive = props.activeTeams.length > 0;

  const teamNames = props.teams.map((team) => {
    const y = labelY(team);
    if (y === undefined) return null;
    const active = props.activeTeams.includes(team.teamId);
    return (
      <TeamLabel
        key={team.teamId}
        x={props.margin.left - 10}
        y={y}
        textAnchor="end"
        dominantBaseline="middle"
        fontWeight={active ? 700 : 400}
        fill={active ? "#f5f5f7" : anyActive ? "#5c5c63" : "#d1d1d6"}
        onMouseEnter={() => props.onHover(team.teamId)}
        onClick={(e) => {
          e.stopPropagation();
          props.onClick(team.teamId);
        }}
      >
        {team.name}
      </TeamLabel>
    );
  });

  const playoffMedals = props.teams.map((team) => {
    const y = labelY(team);
    const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
    if (y === undefined || !medal) return null;
    return (
      <PlayoffMedal
        key={`${team.teamId}-medal`}
        x={4}
        y={y}
        fontSize={14}
        dominantBaseline="middle"
      >
        <title>{medal.label}</title>
        {medal.icon}
      </PlayoffMedal>
    );
  });

  return (
    <>
      <g className="team-labels">{teamNames}</g>
      <g className="team-medals">{playoffMedals}</g>
    </>
  );
}
