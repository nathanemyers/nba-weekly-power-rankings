import styled from 'styled-components'

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #1d1d1f;
  color: #f5f5f7;
`

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
`

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #a1a1a6;
  margin: 0;
`

function App() {
  return (
    <Container>
      <Title>NBA Weekly Power Rankings</Title>
      <Subtitle>Coming soon</Subtitle>
    </Container>
  )
}

export default App
