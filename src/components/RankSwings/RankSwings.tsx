import styled from "styled-components";
import TrendMinimap from "components/TrendMinimap/TrendMinimap";
import { PLAYOFF_MEDALS } from "components/Chart/utils";
import type { Team, TeamRankings } from "types";
import { biggestSwings, type RankSwing } from "./utils";

const Panel = styled.section`
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  background: #2c2c2e;
  border: 1px solid #3a3a3c;
  border-radius: 8px;
`;

const Group = styled.div`
  & + & {
    margin-top: 1rem;
  }
`;

const Heading = styled.h2`
  margin: 0 0 0.5rem;
  color: #a1a1a6;
  font-size: 0.95rem;
  font-weight: 600;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.6rem;
`;

const Card = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  background: #1d1d1f;
  color: #f5f5f7;
  border: 1px solid #3a3a3c;
  border-radius: 6px;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #3a3a3c;
  }

  &[aria-pressed="true"] {
    background: #3a3a3c;
    border-color: #a1a1a6;
  }
`;

const TeamName = styled.span`
  padding-right: 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
`;

const Medal = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0.6rem;
`;

const Trend = styled.span`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: auto;
`;

const Ranks = styled.span`
  color: #d1d1d6;
  font-size: 0.9rem;
  white-space: nowrap;
`;

const Change = styled.span<{ $rose: boolean }>`
  color: ${(props) => (props.$rose ? "#30D158" : "#FF453A")};
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
`;

interface RankSwingsProps {
  teams: TeamRankings[];
  maxWeek: number;
  pinnedTeams: Team[];
  onClick: (team: Team) => void;
}

export default function RankSwings(props: RankSwingsProps) {
  const { risers, fallers } = biggestSwings(props.teams);
  if (risers.length === 0 && fallers.length === 0) return null;

  const renderGroup = (title: string, swings: RankSwing[]) =>
    swings.length > 0 && (
      <Group>
        <Heading>{title}</Heading>
        <Cards>
          {swings.map((swing) => {
            const rose = swing.change > 0;
            const places = Math.abs(swing.change);
            const medal =
              swing.team.playoff && PLAYOFF_MEDALS[swing.team.playoff];
            const pressed =
              props.pinnedTeams.length === 1 &&
              props.pinnedTeams[0] === swing.team.teamId;
            return (
              <Card
                key={swing.team.teamId}
                type="button"
                aria-pressed={pressed}
                aria-label={`${swing.team.name}: ${rose ? "rose" : "fell"} ${places} ${places === 1 ? "place" : "places"}, from ${swing.startRank} to ${swing.endRank}${medal ? `. ${medal.label}` : ""}`}
                onClick={() => props.onClick(swing.team.teamId)}
              >
                <TeamName>{swing.team.name}</TeamName>
                {medal && <Medal title={medal.label}>{medal.icon}</Medal>}
                <Trend>
                  <TrendMinimap
                    rankings={swing.team.rankings}
                    maxWeek={props.maxWeek}
                  />
                  <Ranks>
                    {swing.startRank} → {swing.endRank}
                  </Ranks>
                  <Change $rose={rose}>
                    {rose ? "▲" : "▼"} {places}
                  </Change>
                </Trend>
              </Card>
            );
          })}
        </Cards>
      </Group>
    );

  return (
    <Panel aria-label="Biggest rank swings">
      {renderGroup("Biggest Improvements", risers)}
      {renderGroup("Biggest Fall Offs", fallers)}
    </Panel>
  );
}
