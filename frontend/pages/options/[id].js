import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import SmallTable, { AvatarCell } from '../../components/SmallTable';
import { rinkeby } from '../../utils/addresses';

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

export default function Option({ position }) {
  const [nft, setNft] = useState(null);
  const router = useRouter();
  const { id } = router.query;

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

  const getNft = async () => {
    const { ethereum } = window;
    if (ethereum) {
      if (!id) {
        return;
      }
      const chain = 'rinkeby';
      const url = `https://deep-index.moralis.io/api/v2/nft/${rinkeby.optionFactory}/${id}?chain=${chain}&format=decimal`;
      let response = await fetch(url, {
        headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
      });

      response = await response.json();

      let actualNft = {
        ...response,
        metadata: JSON.parse(response.metadata),
      };

      setNft(actualNft);
    } else {
      console.log('ethereum object not found');
    }
  };

  useEffect(() => {
    getNft();
  }, [id]);

  const offers = useMemo(() => getOffers(), []);

  return (
    <OuterContainer>
      <Container>
        <div className="left">
          {nft ? (
            <StyledImg src={`data:image/svg+xml;utf8,${nft.metadata.image}`} />
          ) : (
            <StyledImg />
          )}

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

const StyledImg = styled.img`
  border: 1px solid black;
  border-radius: 6px;
  width: 320px;
  height: 320px;
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
