import { PlayoffStage } from "../types";
import type { Margin, Team, TeamRankings } from "../types";
import { getYforRank } from "./utils";
import styled from "styled-components";

export const PLAYOFF_MEDALS: Record<
  PlayoffStage,
  { icon: string; label: string }
> = {
  [PlayoffStage.FirstRound]: { icon: "🥉", label: "Lost in the first round" },
  [PlayoffStage.SecondRound]: { icon: "🥈", label: "Lost in the second round" },
  [PlayoffStage.ConferenceFinals]: {
    icon: "🥇",
    label: "Lost in the conference finals",
  },
  [PlayoffStage.Finals]: { icon: "🏆", label: "Runner-up in the Finals" },
  [PlayoffStage.Champion]: { icon: "👑", label: "NBA champion" },
};

const TeamLabel = styled.text<{ pinned: boolean }>`
  cursor: pointer;
  font-size: 13px;
  transition:
    fill 150ms,
    font-weight 150ms;

  fill: ${(props) => (props.pinned ? "#f5f5f7" : "#d1d1d6")};
`;

const PlayoffMedal = styled.text``;

interface TeamLabelsProps {
  teams: TeamRankings[];
  week: number;
  pinnedTeams: Team[];
  margin: Margin;
  height: number;
  onHover: (teamId: Team) => void;
  onClick: (teamId: Team) => void;
}

export default function TeamLabels(props: TeamLabelsProps) {
  const teamNames = props.teams.map((team) => {
    const weekRanking = team.rankings[props.week];
    const labelY = getYforRank(weekRanking.rank, props.height, props.margin);
    if (labelY === undefined) return null;
    const pinned = props.pinnedTeams.includes(team.teamId);
    return (
      <TeamLabel
        key={team.teamId}
        x={props.margin.left - 10}
        y={labelY}
        textAnchor="end"
        dominantBaseline="middle"
        fontWeight={pinned ? 700 : 400}
        pinned={pinned}
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
    const weekRanking = team.rankings[props.week];
    const labelY = getYforRank(weekRanking.rank, props.height, props.margin);
    const medal = team.playoff && PLAYOFF_MEDALS[team.playoff];
    if (labelY === undefined || !medal) return null;
    return (
      <PlayoffMedal
        key={`${team.teamId}-medal`}
        x={4}
        y={labelY}
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
      {teamNames}
      {playoffMedals}
    </>
  );
}
