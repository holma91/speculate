import { useMemo } from 'react';
import styled from 'styled-components';
import SmallTable, { AvatarCell } from '../components/SmallTable';

const getOffers = () => {
  const data = [
    {
      price: '0.36 WETH',
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
      usdPrice: '$733',
      expiration: '2022-07-01',
      priceTreshold: '$2200',
      from: '0xA13...37A',
    },
    {
      price: '0.32 WETH',
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
      usdPrice: '$713',
      expiration: '2022-07-20',
      priceTreshold: '$2500',
      from: '0xA18...38A',
    },
    {
      price: '0.28 WETH',
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
      usdPrice: '$693',
      expiration: '2022-06-20',
      priceTreshold: '$2500',
      from: '0xA28...18B',
    },
  ];

  return data;
};

export default function Long() {
  const offerColumns = useMemo(
    () => [
      {
        Header: 'Price',
        accessor: 'price',
        Cell: AvatarCell,
        imgAccessor: 'img',
      },
      {
        Header: 'USD Price',
        accessor: 'usdPrice',
      },
      {
        Header: 'Expiration',
        accessor: 'expiration',
      },
      {
        Header: 'Price Treshold',
        accessor: 'priceTreshold',
      },
      {
        Header: 'From',
        accessor: 'from',
      },
    ],
    []
  );

  const initialState = {
    sortBy: [
      {
        id: 'price',
        desc: true,
      },
    ],
    pageSize: 5,
  };

  const offers = useMemo(() => getOffers(), []);

  return (
    <OuterContainer>
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
          <p className="collection-header">ETH Options</p>
          <p className="header">ETH 2000 CALL</p>
          <p className="owned-by">Owned by 0x133...7ab</p>
          <p>ETH Price: $2019.33</p>
          <PriceBox>
            <div className="time">
              <p>Sale ends May 23, 2022</p>
            </div>
            <div className="price">
              <span>Buy now price:</span>
              <p>1.47 ETH</p>
              <Button>Buy now</Button>
              <Button>Make offer</Button>
            </div>
          </PriceBox>
          <OfferBox>
            <div className="heading">
              <p>Offers</p>
            </div>
            <SmallTable
              columns={offerColumns}
              data={offers}
              initialState={initialState}
            />
          </OfferBox>
        </div>
      </Container>
    </OuterContainer>
  );
}

const OuterContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const PriceBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #ecedef;
  padding: 15px;
  border-radius: 6px;
  width: 100%;

  .time {
    padding-bottom: 5px;
    border-bottom: 1px solid #ecedef;
  }

  .price {
    span {
      font-size: 14px;
    }

    p {
      margin-top: 5px;
      font-size: 22px;
    }
  }
`;

const OfferBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #ecedef;
  padding: 15px;
  border-radius: 6px;
  width: 100%;

  .heading {
    padding-bottom: 5px;
    border-bottom: 1px solid #ecedef;
  }
`;

const Container = styled.div`
  margin: 20px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  /* align-items: center; */
  gap: 20px;
  max-width: 1200px;

  .left {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .collection-header {
      font-size: 16px;
    }

    .header {
      font-size: 30px;
    }

    .owned-by {
      font-size: 14px;
    }
  }
`;

const DescriptionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid black;
  border-radius: 6px;
  padding: 10px;
  width: 320px;
`;

const StyledSVG = styled.svg`
  border: 1px solid black;
  border-radius: 6px;
`;

const Button = styled.button`
  background-color: #0e76fd;
  color: white;
  margin-top: 10px;
  margin-right: 10px;
  margin-left: 0;
  padding: 9px 25px;
  font-size: 100%;
  font-weight: 700;
  border-radius: 12px;
  /* width: 50%; */
  border: none;
  outline: none;
  cursor: pointer;

  /* box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); */
  :hover {
    transform: scale(1.01) perspective(1px);
  }
`;
