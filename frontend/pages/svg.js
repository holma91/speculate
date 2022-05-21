import styled from 'styled-components';

export default function Svg() {
  return (
    <Container>
      <StyledSVG
        width="350"
        height="350"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <image
          href="https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg"
          x="100"
          y="26"
          height="28px"
          width="28px"
        />
        <text x="130" y="49" fontSize="25" fontWeight="300">
          ETH CALL
        </text>
        <line
          x1="40"
          y1="65"
          x2="310"
          y2="65"
          stroke="black"
          strokeWidth="1.25"
        />
        <text x="80" y="105" fontSize="20" fontWeight="300">
          Price Feed: ETH/USD
        </text>
        <text x="80" y="150" fontSize="20" fontWeight="300">
          Strike Price: $2000
        </text>
        <text x="80" y="195" fontSize="20" fontWeight="300">
          Amount: 1 ETH
        </text>
        <text x="80" y="240" fontSize="20" fontWeight="300">
          Expiry: 2023-01-01
        </text>
        <text x="80" y="285" fontSize="20" fontWeight="300">
          American Style
        </text>
      </StyledSVG>
    </Container>
  );
}

const StyledSVG = styled.svg`
  border: 2px solid black;
`;

const Container = styled.div`
  margin: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
