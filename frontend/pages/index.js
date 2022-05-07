import Link from 'next/link';
import styled from 'styled-components';

export default function home() {
  return (
    <Container>
      <h1>Tokenized Derivatives</h1>
      <Menu>
        <Link href="/list">
          <a>Write Options</a>
        </Link>
        <Link href="/buy">
          <a>Buy Options</a>
        </Link>
      </Menu>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  align-items: center;
  padding-top: 0;
  margin: 0;
  /* margin-top: 10px; */

  h1 {
    margin-top: 50px;
    margin-bottom: 10px;
    font-size: 70px;
  }
`;

const Menu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  a {
    font-size: 32px;
    margin: 0 7px;

    :hover {
      color: #0f6cf7;
    }
  }
`;
