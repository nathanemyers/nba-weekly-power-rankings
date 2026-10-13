import styled from "styled-components";

const Panel = styled.section`
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  background: #2c2c2e;
  border: 1px solid #3a3a3c;
  border-radius: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const TeamName = styled.h2`
  margin: 0;
  font-size: 1.125rem;
`;

const Badge = styled.span`
  padding: 0.15rem 0.55rem;
  border: 1px solid #5c5c63;
  border-radius: 999px;
  color: #a1a1a6;
  font-size: 0.8rem;
  white-space: nowrap;
`;

const Text = styled.p`
  margin: 0;
  color: #d1d1d6;
  line-height: 1.5;
`;

interface TeamSummaryProps {
  teamName: string;
  summary: string;
}

export default function TeamSummary(props: TeamSummaryProps) {
  return (
    <Panel aria-label={`AI-generated summary for ${props.teamName}`}>
      <Header>
        <TeamName>{props.teamName}</TeamName>
        <Badge>AI-generated summary</Badge>
      </Header>
      <Text>{props.summary}</Text>
    </Panel>
  );
}
