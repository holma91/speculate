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
        <rect x="0" y="0" width="350" height="350" fill="white" />

        <text x="122" y="49" fontSize="25" fontWeight="200">
          ETH CALL
        </text>
        <line x1="40" y1="65" x2="310" y2="65" stroke="black" strokeWidth="1" />
        <text x="80" y="105" fontSize="20" fontWeight="200">
          Price Feed: ETH/USD
        </text>
        <text x="80" y="150" fontSize="20" fontWeight="200">
          Strike Price: $2000
        </text>
        <text x="80" y="195" fontSize="20" fontWeight="200">
          Amount: 1 ETH
        </text>
        <text x="80" y="240" fontSize="20" fontWeight="200">
          Expiry: 2023-01-01
        </text>
        <text x="80" y="285" fontSize="20" fontWeight="200">
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
