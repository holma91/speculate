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
import OptionFactory from '../../../contracts/out/OptionFactory.sol/OptionFactory.json';
import wethABI from '../../../contracts/wethABI.json';

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

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const [showExerciseInfo, setShowExerciseInfo] = useState(true);
  const [showListingInfo, setShowListingInfo] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [makerAsk, setMakerAsk] = useState(null);
  const [makerBids, setMakerBids] = useState([]);
  const [listed, setListed] = useState(false);
  const [bidded, setBidded] = useState(false);
  const { data: activeAccount, isError, isLoading } = useAccount();
  const [option, setOption] = useState(null);
  const [nft, setNft] = useState(null);
  const [asset, setAsset] = useState('');
  const [assetPrice, setAssetPrice] = useState(0);
  const router = useRouter();
  const { id } = router.query;

  const allowanceFunc = useContractRead(
    {
      addressOrName: rinkeby.weth,
      contractInterface: wethABI,
    },
    'allowance',
    {
      args: [activeAccount?.address, rinkeby.speculateExchange],
    }
  );

  const approveSpendingFunc = useContractWrite(
    {
      addressOrName: rinkeby.weth,
      contractInterface: wethABI,
    },
    'approve'
  );

  const waitForApproveSpendingFunc = useWaitForTransaction({
    hash: approveSpendingFunc.data?.hash,
    onSuccess(data) {
      // necessary to make approve button disappear after approval
      allowanceFunc.refetch();
    },
  });

  const buyNowFunc = useContractWrite(
    {
      addressOrName: rinkeby.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'matchAskWithTakerBid'
  );

  const waitForBuyNowFunc = useWaitForTransaction({
    hash: buyNowFunc.data?.hash,
  });

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
      underlyingPriceFeed,
      underlyingPriceTreshold,
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
        underlyingPriceFeed: underlyingPriceFeed.toLowerCase(),
        underlyingPriceTreshold: underlyingPriceTreshold.toString(),
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
      underlyingPriceFeed,
      underlyingPriceTreshold,
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
        underlyingPriceFeed: underlyingPriceFeed.toLowerCase(),
        underlyingPriceTreshold: underlyingPriceTreshold.toString(),
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
          priceTreshold:
            '$' + ethers.utils.formatUnits(bid.underlyingPriceTreshold, 8),
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

  const moralisMetadataSync = async (tokenId) => {
    const chain = 'rinkeby';
    const url = `https://deep-index.moralis.io/api/v2/nft/${
      rinkeby.optionFactory
    }/${tokenId.toString()}/metadata/resync?chain=${chain}&flag=metadata&mode=sync`;
    let response = await fetch(url, {
      headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
    });
    response = await response.json();
    return response;
  };

  const getOption = async () => {
    if (activeAccount) {
      if (!id) {
        return;
      }

      let provider = ethers.getDefaultProvider(process.env.ALCHEMY_RINKEBY_RPC);

      let contract = new ethers.Contract(
        rinkeby.optionFactory,
        OptionFactory.abi,
        provider
      );

      const option = await contract.getOptionById(id);
      const parsedOption = {
        underlyingPriceFeed: option.underlyingPriceFeed,
        underlyingPriceAmount: option.underlyingAmount,
        call: option.call,
        strikePrice: option.strikePrice,
        expiry: option.expiry,
      };

      setOption(parsedOption);
    } else {
      console.log('connect with your wallet!');
    }
  };

  const getNft = async () => {
    const extraRequest = async (url) => {
      try {
        let response = await fetch(url);
        let metadata = await response.json();
        return metadata;
      } catch (e) {
        console.log(e);
      }
    };

    const moralisRequest = async (id) => {
      const chain = 'rinkeby';
      const url = `https://deep-index.moralis.io/api/v2/nft/${rinkeby.optionFactory}/${id}?chain=${chain}&format=decimal`;
      let response = await fetch(url, {
        headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
      });

      response = await response.json();

      let actualNft = {
        ...response,
        metadata: response.metadata ? JSON.parse(response.metadata) : null,
      };

      return actualNft;
    };

    if (activeAccount) {
      if (!id) {
        return;
      }

      let actualNft = await moralisRequest(id);

      if (!actualNft.metadata) {
        const re = /\/ipfs\/.+metadata.json$/;
        const ipfsString = actualNft.token_uri.match(re)[0];

        const ipfsUrl = `https://minty.infura-ipfs.io${ipfsString}`;

        let metadata = await extraRequest(ipfsUrl);
        actualNft.metadata = metadata;
      }

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
      setAsset(asset);

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
    getOption();
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
      treshold: 2200,
    },

    validationSchema: Yup.object({
      price: Yup.number()
        .min(0.000000001, 'Must cost atleast 1 gwei')
        .required('Required'),
      until: Yup.date().required('Required'),
      treshold: Yup.number().required(),
    }),

    onSubmit: (values) => {
      listOption(values);
    },
  });

  const offerFormik = useFormik({
    initialValues: {
      price: 0.01,
      until: 13204210,
      treshold: 2200,
    },

    validationSchema: Yup.object({
      price: Yup.number()
        .min(0.000000001, 'Must cost atleast 1 gwei')
        .required('Required'),
      until: Yup.date().required('Required'),
      treshold: Yup.number().required(),
    }),

    onSubmit: (values) => {
      makeOffer(values);
    },
  });

  const listOption = async ({ price, until, treshold }) => {
    if (activeAccount) {
      const priceFeed = priceFeeds.RINKEBY[asset.toUpperCase()].USD;
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
        underlyingPriceFeed: priceFeed,
        underlyingPriceTreshold: ethers.utils.parseUnits(
          treshold.toString(),
          8
        ),
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
        if (ethers.BigNumber.from(bid.price).gt(max.price)) {
          max = bid;
        }
      }
      return max;
    }
    return {};
  };

  const makeOffer = async ({ price, until, treshold }) => {
    const priceFeed = priceFeeds.RINKEBY[asset.toUpperCase()].USD;
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
        underlyingPriceFeed: priceFeed,
        underlyingPriceTreshold: ethers.utils.parseUnits(
          treshold.toString(),
          8
        ),
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
      const makerBid = getTopOffer();

      const parsedMakerBid = {
        ...makerBid,
      };

      const takerAsk = {
        isOrderAsk: true,
        taker: activeAccount.address,
        price: ethers.BigNumber.from(makerBid.price),
        tokenId: makerBid.tokenId,
      };

      acceptFunc.write({
        args: [takerAsk, makerBid],
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const buyNow = async () => {
    if (activeAccount) {
      const takerBid = {
        isOrderAsk: false,
        taker: activeAccount.address,
        price: ethers.BigNumber.from(makerAsk.price),
        tokenId: makerAsk.tokenId,
      };

      buyNowFunc.write({
        args: [takerBid, makerAsk],
        overrides: {
          gasLimit: 500000,
        },
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const approveSpending = async () => {
    if (activeAccount) {
      approveSpendingFunc.write({
        args: [rinkeby.speculateExchange, ethers.utils.parseEther('10000000')], // 10 million WETH
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const getExpiryDate = (timestamp) => {
    let d = new Date(timestamp);
    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = d.getFullYear();
    const formatted = mm + '/' + dd + '/' + yyyy;
    return formatted;
  };

  const getOptionStatus = () => {
    const strikePrice = option.strikePrice;
    const marketPrice = ethers.utils.parseUnits(assetPrice, 8);
    if (marketPrice.gt(strikePrice)) {
      return 'ITM';
    } else {
      return 'OTM';
    }
  };

  return (
    <OuterContainer>
      <Container>
        <div className="left">
          {nft?.metadata ? (
            <StyledImg
              src={`data:image/svg+xml;utf8,${nft.metadata.image}`}
              sizes="(max-width: 48rem) 95vw, (max-width: 90rem) 60vw, 536px"
            />
          ) : (
            <StyledImg />
          )}

          <DescriptionBox>
            <p>Description</p>
            {nft ? <p>Created by {styleAddress(nft.token_address)}</p> : null}
          </DescriptionBox>
        </div>
        <div className="right">
          <p className="collection-header">{asset} Options</p>
          <p className="header">{asset} 2000 CALL</p>
          <p className="owned-by">
            {nft ? `Owned by ${styleAddress(nft.owner_of)}` : 'Owned by '}
          </p>
          {assetPrice > 0
            ? `${nft.metadata.attributes[0].value} price: $${assetPrice}`
            : null}
          <PriceBox isClicked={showExerciseInfo}>
            <div
              onClick={() => setShowExerciseInfo(!showExerciseInfo)}
              className="time"
            >
              <p>Exercising information</p>
            </div>
            {showExerciseInfo ? (
              nft?.metadata && assetPrice && option ? (
                <div className="exercising-info">
                  <p>
                    the option expires:{' '}
                    {getExpiryDate(nft.metadata.attributes[3].value)} (in 23
                    days)
                  </p>
                  <p>the option is currently: {getOptionStatus()}</p>
                  <p>
                    since the option is ITM and american style, you can exercise
                    it early.
                  </p>
                  <p>
                    all our options settle in cash, which means you'll get payed
                    the profit in WETH.
                  </p>
                  <p>the terms if you exercise right now:</p>
                  <ExerciseTerms>
                    <p>
                      - you have the right to buy 0.2ETH at the price of $2000.
                    </p>
                    <p className="math">0.2 x $2000 = $400</p>
                    <p>the market price of 1 ETH is at the moment $3000.</p>
                    <p className="math">0.2 x $3000 = $600</p>
                    <p>Your profit is therefore $600 - $200 = $400</p>
                  </ExerciseTerms>

                  <Button>Exercise</Button>
                </div>
              ) : (
                <div className="exercising-info">
                  <p>the option expires in: </p>
                  <p>the option is currently: </p>
                  <p>
                    since the option is ITM and american style, you can exercise
                    it early.
                  </p>
                  <p>
                    all our options settle in cash, which means you'll get payed
                    the profit in WETH.
                  </p>
                  <p>the terms if you exercise right now:</p>
                  <ExerciseTerms>
                    <p>- you have the right to buy at the price of .</p>
                    <p className="math"> x = </p>
                    <p>the market price of is at the moment .</p>
                    <p className="math"> x = </p>
                    <p>Your profit is therefore $ - $ = $</p>
                  </ExerciseTerms>

                  <Button>Exercise</Button>
                </div>
              )
            ) : null}
          </PriceBox>
          {listed ? (
            <PriceBox isClicked={showListingInfo}>
              <div
                className="time"
                onClick={() => setShowListingInfo(!showListingInfo)}
              >
                <p>Listing information</p>
              </div>
              {showListingInfo ? (
                <div className="listing-info">
                  <p className="extra-info">
                    Sale expires in 15 days OR when {asset} price {'>'} $
                    {ethers.utils.formatUnits(
                      makerAsk.underlyingPriceTreshold,
                      8
                    )}
                  </p>
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
                        <p>
                          {ethers.utils.formatEther(makerBids[0].price)} ETH
                        </p>
                      </>
                    ) : null}
                    {!isLoading &&
                    nft &&
                    nft.owner_of.toLowerCase() ===
                      activeAccount.address.toLowerCase() ? (
                      <>
                        {bidded ? (
                          acceptFunc.isLoading ? (
                            <Button>Loading...</Button>
                          ) : waitForAcceptFunc.isLoading ? (
                            <Button>Pending...</Button>
                          ) : (
                            <Button onClick={acceptOffer}>Accept Offer</Button>
                          )
                        ) : null}
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
                          <InputContainer>
                            <label htmlFor="treshold">
                              {asset} price treshold:{' '}
                            </label>
                            <StyledMyTextInput
                              name="treshold"
                              type="number"
                              {...formik.getFieldProps('treshold')}
                            />
                          </InputContainer>
                          {listed && allowanceFunc?.data?.lt(makerAsk.price) ? (
                            <ApproveDiv>
                              {approveSpendingFunc.isLoading ? (
                                <Button type="button" onClick={approveSpending}>
                                  Loading...
                                </Button>
                              ) : waitForApproveSpendingFunc.isLoading ? (
                                <Button type="button" onClick={approveSpending}>
                                  Pending...
                                </Button>
                              ) : (
                                <Button type="button" onClick={approveSpending}>
                                  Approve spending
                                </Button>
                              )}
                            </ApproveDiv>
                          ) : null}
                          <BuyDiv>
                            {bidFunc.isLoading ? (
                              <Button type="submit">Loading...</Button>
                            ) : waitForBidFunc.isLoading ? (
                              <Button type="submit">Pending...</Button>
                            ) : (
                              <Button type="submit">Make Offer</Button>
                            )}

                            {buyNowFunc.isLoading ? (
                              <Button onClick={buyNow} type="button">
                                Loading...
                              </Button>
                            ) : waitForBuyNowFunc.isLoading ? (
                              <Button onClick={buyNow} type="button">
                                Pending...
                              </Button>
                            ) : (
                              <Button onClick={buyNow} type="button">
                                Buy now
                              </Button>
                            )}
                          </BuyDiv>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </PriceBox>
          ) : (
            <PriceBox isClicked={showListingInfo}>
              <div
                className="time"
                onClick={() => setShowListingInfo(!showListingInfo)}
              >
                <p>Listing information</p>
              </div>
              {showListingInfo ? (
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
                        <InputContainer>
                          <label htmlFor="treshold">
                            {asset} price treshold:{' '}
                          </label>
                          <StyledMyTextInput
                            name="treshold"
                            type="number"
                            {...formik.getFieldProps('treshold')}
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
              ) : null}
            </PriceBox>
          )}
          <OfferBox isClicked={showOffers}>
            <div
              className="offers-info"
              onClick={() => setShowOffers(!showOffers)}
            >
              <p>Offers</p>
            </div>
            {showOffers ? (
              <div className="table-wrapper">
                <SmallTable
                  columns={offerColumns}
                  data={offers}
                  initialState={initialState}
                />
              </div>
            ) : null}
          </OfferBox>
        </div>
      </Container>
    </OuterContainer>
  );
}

const ExerciseTerms = styled.div`
  margin: 10px 20px;

  .math {
    padding-left: 13px;
  }
`;

const BuyDiv = styled.div`
  width: 50%;
  button {
    width: 47%;
  }
`;
const ApproveDiv = styled.div`
  width: 50%;

  button {
    width: 97%;
  }
`;

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
  /* padding: 15px; */
  border-radius: 6px;
  width: 100%;

  .time {
    cursor: pointer;
    padding-bottom: 5px;
    /* margin-bottom: 5px; */
    padding-left: 15px;
    padding-top: 10px;
    border-bottom: ${(props) => (props.isClicked ? '1px solid #ecedef' : '')};
    /* border-bottom: 1px solid #ecedef; */
    p {
      margin: 5px 0;
    }

    :hover {
      background-color: rgb(249 250 251);
    }
  }

  .price {
    padding-left: 15px;
    padding-bottom: 15px;
    span {
      font-size: 14px;
    }

    p {
      margin-top: 5px;
      font-size: 22px;
    }
  }

  .exercising-info {
    padding-left: 15px;
    padding-bottom: 15px;
    /* padding-top: 5px; */
    p {
      margin: 8px 0;
    }
    button {
      margin-top: 3px;
    }
  }

  .listing-info {
    .extra-info {
      padding-left: 15px;
      /* padding-bottom: 15px; */
      margin: 8px 0;
    }
  }
`;

const OfferBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #ecedef;
  /* padding: 15px; */

  border-radius: 6px;
  width: 100%;

  .offers-info {
    cursor: pointer;
    padding-bottom: 5px;
    padding-left: 15px;
    padding-top: 10px;
    border-bottom: ${(props) => (props.isClicked ? '1px solid #ecedef' : '')};
    p {
      margin: 5px 0;
    }

    :hover {
      background-color: rgb(249 250 251);
    }
  }

  .table-wrapper {
    padding: 10px;
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
