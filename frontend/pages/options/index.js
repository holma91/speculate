import Link from 'next/link';
import styled from 'styled-components';

export default function Options() {
  return (
    <RecentContainer>
      <RecentOptions>
        <p>Recent Calls</p>

        <OptionsHeader>
          <span>Asset</span>
          <span>Strike Price</span>
          <span>Current Price</span>
          <span>Right to buy</span>
          <span>Expiry</span>
          <span>Premium</span>
        </OptionsHeader>
        <Option>
          <span>
            <img src="https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg" />
            ETH/USD
          </span>
          <span>$3000</span>
          <span>$2000</span>
          <span>10 ETH</span>
          <span>2022-12-14</span>
          <span>1 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://prismic-io.s3.amazonaws.com/data-chain-link/19a58483-b100-4d09-ab0d-7d221a491090_BTC.svg" />
            BTC/USD
          </span>
          <span>$300000</span>
          <span>$30000</span>
          <span>5 BTC</span>
          <span>2025-12-14</span>
          <span>0.5 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format" />
            AVAX/USD
          </span>
          <span>$300</span>
          <span>$30</span>
          <span>10 AVAX</span>
          <span>2023-06-14</span>
          <span>0.05 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://data-chain-link.cdn.prismic.io/data-chain-link/ad14983c-eec5-448e-b04c-d1396e644596_LINK.svg" />
            LINK/USD
          </span>
          <span>$30</span>
          <span>$5</span>
          <span>100 LINK</span>
          <span>2023-01-01</span>
          <span>1 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/931ba23b-1755-46be-a466-73af2fcafaf1_ICON_SOL.png?auto=compress,format" />
            SOL/USD
          </span>
          <span>$500</span>
          <span>$50</span>
          <span>1000 SOL</span>
          <span>2024-01-01</span>
          <span>1 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format" />
            AVAX/USD
          </span>
          <span>$300</span>
          <span>$30</span>
          <span>10 AVAX</span>
          <span>2023-06-14</span>
          <span>0.2 ETH</span>
        </Option>
      </RecentOptions>
      <RecentOptions>
        <p>Recent Puts</p>
        <Option>
          <span>
            <img src="https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg" />
            ETH/USD
          </span>
          <span>$3000</span>
          <span>2022-07-01</span>
        </Option>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/931ba23b-1755-46be-a466-73af2fcafaf1_ICON_SOL.png?auto=compress,format" />
            SOL/USD
          </span>
          <span>$100</span>
          <span>2022-11-14</span>
        </Option>
        <Option>
          <span>
            <img src="https://data-chain-link.cdn.prismic.io/data-chain-link/53abc2bf-a078-40d5-9f46-835968837ee4_DOT.svg" />
            DOT/USD
          </span>
          <span>$8</span>
          <span>2022-10-14</span>
        </Option>
        <Option>
          <span>
            <img src="https://prismic-io.s3.amazonaws.com/data-chain-link/19a58483-b100-4d09-ab0d-7d221a491090_BTC.svg" />
            BTC/USD
          </span>
          <span>$30000</span>
          <span>2022-11-19</span>
        </Option>
        <Option>
          <span>
            <img src="https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg" />
            ETH/USD
          </span>
          <span>$2200</span>
          <span>2023-01-17</span>
        </Option>
        <Option>
          <span>
            <img src="https://data-chain-link.cdn.prismic.io/data-chain-link/53abc2bf-a078-40d5-9f46-835968837ee4_DOT.svg" />
            DOT/USD
          </span>
          <span>$8</span>
          <span>2023-04-16</span>
        </Option>
      </RecentOptions>
    </RecentContainer>
  );
}

const RecentContainer = styled.div`
  margin: 40px;
  display: flex;
  flex-direction: column;
  gap: 50px;

  @media screen and (max-width: 1000px) {
    gap: 10px;
  }
`;

const RecentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* width: 450px; */

  p {
    font-size: 20px;
    font-weight: 600;
  }

  a {
    padding: 10px;
    font-weight: 500;
  }
`;

const OptionsHeader = styled.div`
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  justify-content: space-between;
  align-items: center;
  /* border: 1px solid #ecedef; */
  border-radius: 6px;
  cursor: pointer;
  /* box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32); */

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const Option = styled.div`
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ecedef;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32);

  img {
    width: 19px;
    height: 19px;
  }

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  :hover {
    background: #fafafa;
  }
`;
