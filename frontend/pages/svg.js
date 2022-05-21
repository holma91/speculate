import styled from 'styled-components';

export default function Svg() {
  return (
    <Container>
      <svg
        width="300"
        height="300"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="2"
          width="250"
          height="275"
          stroke="black"
          fill="transparent"
          stroke-width="2"
        />
        <image
          href="https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg"
          x="54"
          y="26"
          height="28px"
          width="28px"
        />
        <text x="90" y="49" fontSize="25" fontWeight="300">
          ETH CALL
        </text>
        <line
          x1="15"
          y1="65"
          x2="235"
          y2="65"
          stroke="black"
          strokeWidth="1.25"
        />
        <text x="45" y="100" fontSize="16" fontWeight="300">
          Price Feed: ETH/USD
        </text>
        <text x="45" y="135" fontSize="16" fontWeight="300">
          Strike Price: $2000
        </text>
        <text x="45" y="170" fontSize="16" fontWeight="300">
          Amount: 1 ETH
        </text>
        <text x="45" y="205" fontSize="16" fontWeight="300">
          Expiry: 2023-01-01
        </text>
        <text x="45" y="240" fontSize="16" fontWeight="300">
          American Style
        </text>
      </svg>
    </Container>
  );
}

const StyledRect = styled.rect`
  border: 5px solid red;
`;

const Container = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
