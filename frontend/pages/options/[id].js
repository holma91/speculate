import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SmallTable, { AvatarCell } from '../../components/SmallTable';
import { rinkeby } from '../../utils/addresses';
import aggregatorV3Interface from '../../../contracts/out/AggregatorV3Interface.sol/AggregatorV3Interface.json';

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

const priceFeeds = {
  RINKEBY: {
    ETH: {
      USD: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    BTC: {
      USD: '0xECe365B379E1dD183B20fc5f022230C044d51404',
    },
    ATOM: {
      USD: '0x3539F2E214d8BC7E611056383323aC6D1b01943c',
    },
    LINK: {
      USD: '0xd8bd0a1cb028a31aa859a21a3758685a95de4623',
    },
    MATIC: {
      USD: '0x7794ee502922e2b723432DDD852B3C30A911F021',
    },
  },
  FUJI: {
    ETH: {
      USD: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
    },
    BTC: {
      USD: '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
    },
    AVAX: {
      USD: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
    },
    LINK: {
      USD: '0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470',
    },
  },
};

export default function Option({ position }) {
  const { data, isError, isLoading } = useAccount();
  const [nft, setNft] = useState(null);
  const [assetPrice, setAssetPrice] = useState(0);
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

      console.log(actualNft);

      setNft(actualNft);
    } else {
      console.log('ethereum object not found');
    }
  };

  const getAssetPrice = async () => {
    try {
      if (!nft) {
        return;
      }
      const network = 'RINKEBY';
      const asset = nft.metadata.attributes[0].value;
      console.log(asset);

      const priceFeedAddress = priceFeeds[network][asset].USD;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

        const priceFeedContract = new ethers.Contract(
          priceFeedAddress,
          aggregatorV3Interface.abi,
          provider
        );

        const decimals = await priceFeedContract.decimals();
        const price = await priceFeedContract.latestRoundData();

        console.log(price);

        setAssetPrice(ethers.utils.formatUnits(price.answer, decimals));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAssetPrice();
  }, [nft]);

  useEffect(() => {
    getNft();
  }, [id]);

  const offers = useMemo(() => getOffers(), []);

  const styleAddress = (address) => {
    return (
      address.substring(0, 5) +
      '...' +
      address.substring(address.length - 3, address.length)
    );
  };

  return (
    <OuterContainer>
      <Container>
        <div className="left">
          {/* {!isLoading ? <p>{data.address}</p> : <p>yo</p>} */}
          {nft ? (
            <StyledImg src={`data:image/svg+xml;utf8,${nft.metadata.image}`} />
          ) : (
            <StyledImg />
          )}

          <DescriptionBox>
            <p>Description</p>
            {nft ? <p>Created by {styleAddress(nft.token_address)}</p> : null}
          </DescriptionBox>
        </div>
        <div className="right">
          <p className="collection-header">ETH Options</p>
          <p className="header">ETH 2000 CALL</p>
          <p className="owned-by">
            {nft ? `Owned by ${styleAddress(nft.owner_of)}` : 'Owned by '}
          </p>
          {assetPrice > 0
            ? `${nft.metadata.attributes[0].value} price: $${assetPrice}`
            : null}
          <PriceBox>
            <div className="time">
              <p>Sale ends May 23, 2022</p>
            </div>
            <div className="price">
              <span>Buy now price:</span>
              <p>1.47 ETH</p>
              <span>Highest Offer:</span>
              <p>0.36 ETH</p>
              {!isLoading &&
              nft &&
              nft.owner_of.toLowerCase() === data.address.toLowerCase() ? (
                <>
                  <Button>Accept Offer</Button>
                  <Button>Cancel Listing</Button>
                </>
              ) : (
                <>
                  <Button>Buy now</Button>
                  <Button>Make offer</Button>
                </>
              )}
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
