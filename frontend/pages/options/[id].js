import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  useSendTransaction,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  useAccount,
  useContractEvent,
} from 'wagmi';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SmallTable, { AvatarCell } from '../../components/SmallTable';
import { rinkeby } from '../../utils/addresses';
import aggregatorV3Interface from '../../../contracts/out/AggregatorV3Interface.sol/AggregatorV3Interface.json';
import SpeculateExchange from '../../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';

const getOffers2 = () => {
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

const styleAddress = (address) => {
  return (
    address.substring(0, 5) +
    '...' +
    address.substring(address.length - 3, address.length)
  );
};

export default function Option() {
  const [makerAsk, setMakerAsk] = useState(null);
  const [makerBids, setMakerBids] = useState([]);
  const [listed, setListed] = useState(false);
  const [bidded, setBidded] = useState(false);
  const { data: activeAccount, isError, isLoading } = useAccount();
  const [nft, setNft] = useState(null);
  const [assetPrice, setAssetPrice] = useState(0);
  const router = useRouter();
  const { id } = router.query;

  const bidFunc = useContractWrite(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'createMakerBid'
  );

  const waitForBidFunc = useWaitForTransaction({
    hash: bidFunc.data?.hash,
  });

  const listFunc = useContractWrite(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'createMakerAsk'
  );

  const waitForListFunc = useWaitForTransaction({
    hash: listFunc.data?.hash,
  });

  const acceptFunc = useContractWrite(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'matchBidWithTakerAsk'
  );

  const waitForAcceptFunc = useWaitForTransaction({
    hash: acceptFunc.data?.hash,
  });

  useContractEvent(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'MakerAsk',
    ([
      signer,
      collection,
      tokenId,
      isOrderAsk,
      currency,
      strategy,
      amount,
      price,
      startTime,
      endTime,
    ]) => {
      const makerAsk = {
        signer: signer.toLowerCase(),
        collection: collection.toLowerCase(),
        tokenId: tokenId.toString(),
        isOrderAsk: isOrderAsk,
        currency: currency.toLowerCase(),
        strategy: strategy.toLowerCase(),
        amount: amount.toString(),
        price: price.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
      };
      setMakerAsk(makerAsk);
      setListed(true);
    }
  );
  useContractEvent(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'MakerBid',
    ([
      signer,
      collection,
      tokenId,
      isOrderAsk,
      currency,
      strategy,
      amount,
      price,
      startTime,
      endTime,
    ]) => {
      const makerBid = {
        signer: signer.toLowerCase(),
        collection: collection.toLowerCase(),
        tokenId: tokenId.toString(),
        isOrderAsk: isOrderAsk,
        currency: currency.toLowerCase(),
        strategy: strategy.toLowerCase(),
        amount: amount.toString(),
        price: price.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
      };
      setMakerBids([...makerBids, makerBid]);
      setBidded(true);
    }
  );

  const getOffers = () => {
    // necessary to avoid weird frontend bug where one bid is shown twice
    const addresses = new Set();
    let processedOffers = [];
    for (const bid of makerBids) {
      if (!addresses.has(bid.signer)) {
        processedOffers.push({
          price: ethers.utils.formatEther(bid.price),
          usdPrice: '$100', //bid.price.mul(10),
          expiration: bid.endTime,
          priceTreshold: '$2020',
          from: styleAddress(bid.signer),
          img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
        });
      }
      addresses.add(bid.signer);
    }

    return processedOffers;
  };

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
    if (activeAccount) {
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
      console.log('connect with your wallet!');
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

  useEffect(() => {
    if (!id) {
      return;
    }
    const setUpMakerOrders = async () => {
      const responseMakerAsk = await fetch(
        `http://localhost:3001/makerAsks/${rinkeby.optionFactory.toLowerCase()}/${id}`
      );
      const responseMakerBids = await fetch(
        `http://localhost:3001/makerBids/${rinkeby.optionFactory.toLowerCase()}/${id}`
      );
      let makerAsk = await responseMakerAsk.json();
      let makerBids = await responseMakerBids.json();

      if (makerAsk.collection) {
        setListed(true);
        setMakerAsk(makerAsk);
      }

      setMakerBids(makerBids);
      if (makerBids.length > 0) {
        setBidded(true);
      }
    };
    setUpMakerOrders();
  }, [id]);

  const offers = useMemo(() => getOffers(), [makerBids]);

  const formik = useFormik({
    initialValues: {
      price: 0,
      until: 13204210,
    },

    validationSchema: Yup.object({
      price: Yup.number()
        .min(0.000000001, 'Must cost atleast 1 gwei')
        .required('Required'),
      until: Yup.date().required('Required'),
    }),

    onSubmit: (values) => {
      listOption(values);
    },
  });

  const offerFormik = useFormik({
    initialValues: {
      price: 0,
      until: 13204210,
    },

    validationSchema: Yup.object({
      price: Yup.number()
        .min(0.000000001, 'Must cost atleast 1 gwei')
        .required('Required'),
      until: Yup.date().required('Required'),
    }),

    onSubmit: (values) => {
      makeOffer(values);
    },
  });

  const listOption = async ({ price, until }) => {
    if (activeAccount) {
      const makerAsk = {
        isOrderAsk: true,
        signer: activeAccount.address,
        collection: nft.token_address,
        price: ethers.BigNumber.from(ethers.utils.parseEther(price.toString())),
        tokenId: nft.token_id,
        amount: 1,
        strategy: rinkeby.strategy,
        currency: rinkeby.weth,
        startTime: 1651301377,
        endTime: 1660995560,
      };

      listFunc.write({
        args: [makerAsk],
      });
    } else {
      console.log('connect with your wallet!');
    }
  };

  const cancelListing = async () => {
    if (activeAccount) {
      console.log('do cancel listing function later');
    } else {
      console.log('connect your wallet!');
    }
  };

  const getTopOffer = () => {
    if (makerBids) {
      let max = makerBids[0];
      for (const bid of makerBids) {
        if (ethers.BigNumber.from(bid.price).gt(max)) {
          max = bid;
        }
      }
      return max;
    }
    return {};
  };

  const makeOffer = async ({ price, until }) => {
    if (activeAccount) {
      const makerBid = {
        isOrderAsk: false,
        signer: activeAccount.address,
        collection: nft.token_address,
        price: ethers.BigNumber.from(ethers.utils.parseEther(price.toString())),
        tokenId: nft.token_id,
        amount: 1,
        strategy: rinkeby.strategy,
        currency: rinkeby.weth,
        startTime: 1651301377,
        endTime: 1660995560,
      };

      bidFunc.write({
        args: [makerBid],
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const acceptOffer = async () => {
    if (activeAccount) {
      const makerBid = makerBids[0];

      console.log(makerBid);

      const takerAsk = {
        isOrderAsk: true,
        taker: activeAccount.address,
        price: ethers.BigNumber.from(makerBid.price),
        tokenId: makerBid.tokenId,
      };

      // acceptFunc.write({
      //   args: [takerAsk, makerBid],
      // });
    } else {
      console.log('connect your wallet!');
    }
  };

  const buyNow = async () => {
    if (activeAccount) {
      console.log('do buy now function later');
    } else {
      console.log('connect your wallet!');
    }
  };

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
          {listed ? (
            <PriceBox>
              <div className="time">
                <p>Option expires in 20 days & the sale ends May 23, 2022</p>
              </div>
              <div className="price">
                {listed ? (
                  <>
                    <span>Buy now price:</span>
                    <p>{ethers.utils.formatEther(makerAsk.price)} ETH</p>
                  </>
                ) : (
                  <p>Unlisted</p>
                )}
                {bidded ? (
                  <>
                    <span>Highest Offer:</span>
                    <p>{ethers.utils.formatEther(makerBids[0].price)} ETH</p>
                  </>
                ) : null}
                {!isLoading &&
                nft &&
                nft.owner_of.toLowerCase() ===
                  activeAccount.address.toLowerCase() ? (
                  <>
                    {bidded && (
                      <Button onClick={acceptOffer}>Accept Offer</Button>
                    )}
                    <Button onClick={cancelListing}>Cancel Listing</Button>
                  </>
                ) : (
                  <>
                    <form onSubmit={offerFormik.handleSubmit}>
                      <InputContainer>
                        <label htmlFor="price">Offer price: </label>
                        <StyledMyTextInput
                          name="price"
                          type="number"
                          placeholder="2000"
                          {...offerFormik.getFieldProps('price')}
                        />
                      </InputContainer>
                      <InputContainer>
                        <label htmlFor="until">Valid until: </label>
                        <StyledMyTextInput
                          name="until"
                          type="date"
                          placeholder=""
                          {...offerFormik.getFieldProps('until')}
                        />
                      </InputContainer>
                      {bidFunc.isLoading ? (
                        <>
                          <Button type="submit">Loading...</Button>
                          <Button onClick={buyNow}>Buy now</Button>
                        </>
                      ) : waitForBidFunc.isLoading ? (
                        <>
                          <Button type="submit">Pending...</Button>
                          <Button onClick={buyNow}>Buy now</Button>
                        </>
                      ) : (
                        <>
                          <Button type="submit">Make Offer</Button>
                          <Button onClick={buyNow}>Buy now</Button>
                        </>
                      )}
                    </form>
                  </>
                )}
              </div>
            </PriceBox>
          ) : (
            <PriceBox>
              <div className="time">
                <p>Option expires in 23 days</p>
              </div>
              <div className="price">
                <p>Unlisted</p>
                {!isLoading &&
                nft &&
                nft.owner_of.toLowerCase() ===
                  activeAccount.address.toLowerCase() ? (
                  <>
                    <form onSubmit={formik.handleSubmit}>
                      <InputContainer>
                        <label htmlFor="price">price: </label>
                        <StyledMyTextInput
                          name="price"
                          type="number"
                          placeholder="2000"
                          {...formik.getFieldProps('price')}
                        />
                      </InputContainer>
                      <InputContainer>
                        <label htmlFor="until">until: </label>
                        <StyledMyTextInput
                          name="until"
                          type="date"
                          placeholder=""
                          {...formik.getFieldProps('until')}
                        />
                      </InputContainer>
                      {listFunc.isLoading ? (
                        <Button type="submit">Loading...</Button>
                      ) : waitForListFunc.isLoading ? (
                        <Button type="submit">Pending...</Button>
                      ) : (
                        <Button type="submit">List Option</Button>
                      )}
                    </form>
                  </>
                ) : (
                  <>
                    <Button>sup</Button>
                  </>
                )}
              </div>
            </PriceBox>
          )}
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

const StyledMyTextInput = styled.input`
  margin: 10px 0px;
  padding: 5px;
  border: 1px solid lightblue;
  border: ${(props) => (props.error ? '1px solid red' : '1px solid lightblue')};
  border-radius: 3px;
`;

const InputContainer = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;

  label {
    margin: 7px;
    margin-left: 7px;
    margin-right: 15px;
  }

  p {
    margin: 10px;
    margin-left: 7px;
    margin-right: 15px;
  }
`;

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
