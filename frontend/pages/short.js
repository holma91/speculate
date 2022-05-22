import styled from 'styled-components';

export default function Short() {
  return (
    <Container>
      <div className="left">
        <StyledSVG
          width="320"
          height="320"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <image href={'/ETH.svg'} x="90" y="26" height="28px" width="28px" />
          <text x="120" y="49" fontSize="25" fontWeight="300">
            ETH CALL
          </text>
          <line
            x1="20"
            y1="65"
            x2="300"
            y2="65"
            stroke="black"
            strokeWidth="1.25"
          />
          <text x="70" y="105" fontSize="20" fontWeight="300">
            Price Feed: ETH/USD
          </text>
          <text x="70" y="150" fontSize="20" fontWeight="300">
            Strike Price: $2000
          </text>
          <text x="70" y="195" fontSize="20" fontWeight="300">
            Amount: 0.25 ETH
          </text>
          <text x="70" y="240" fontSize="20" fontWeight="300">
            Expiry: 2023-01-01
          </text>
          <text x="70" y="285" fontSize="20" fontWeight="300">
            American Style
          </text>
        </StyledSVG>
        <DescriptionBox>
          <p>Description</p>
          <p>Created by 0xABCD...1337</p>
        </DescriptionBox>
      </div>
      <div className="right">
        <p>ETH Options</p>
        <p>ETH Price: $2019.33</p>
        <p>Collateral: 2 ETH</p>
        <p>Collateral value: $4038.66</p>
        <p>
          You minted 10 longs and have sold 8, making you 80% filled and short 8
          ETH 2000 calls.
        </p>
        <p>Risk: 0.25 x 8 = 2 ETH</p>
        <p>Risk value: $4038.66</p>
        <p>Collateral Ratio: COVERED</p>
      </div>
    </Container>
  );
}

const DescriptionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid black;
  border-radius: 6px;
  padding: 10px;

  p {
  }
`;

const Container = styled.div`
  margin: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;

  .left {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
`;

const StyledSVG = styled.svg`
  border: 1px solid black;
  border-radius: 6px;
`;
