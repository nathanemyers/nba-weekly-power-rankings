import styled from "styled-components";
import RankingsChart from "./Chart/Chart";

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  box-sizing: border-box;
  margin: 0;
  padding: 2rem 16px;
  font-family: system-ui, sans-serif;
  background: #1d1d1f;
  color: #f5f5f7;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #a1a1a6;
  margin: 0 0 1.5rem;
  text-align: center;
`;

function App() {
  return (
    <Container>
      <Title>NBA Weekly Power Rankings</Title>
      <Subtitle>
        Test data: hover a line or dot, click a team to pin it, use arrow keys
        to pan
      </Subtitle>
      <RankingsChart />
    </Container>
  );
}

export default App;
