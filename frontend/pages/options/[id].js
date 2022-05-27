import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  useAccount,
  useContractEvent,
  useNetwork,
} from 'wagmi';
import { useFormik } from 'formik';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SmallTable, { AvatarCell } from '../../components/SmallTable';
import {
  rinkeby,
  binance,
  zeroAddress,
  nativeTokenMapper,
} from '../../utils/addresses';
import aggregatorV3Interface from '../../../contracts/out/AggregatorV3Interface.sol/AggregatorV3Interface.json';
import SpeculateExchange from '../../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import OptionFactory from '../../../contracts/out/OptionFactory.sol/OptionFactory.json';
import wethABI from '../../../contracts/wethABI.json';
import { priceFeeds, moralisMapping } from '../../utils/misc';
import { Spinner } from '../../components/shared/Utils';

const trimStr = (str) => {
  let lock = true;
  let j = 0;
  let i = 0;
  while (i < str.length) {
    if (!lock) {
      j++;
      if (j >= 3) break;
    }
    if (str[i] === '.') {
      lock = false;
    }
    i++;
  }

  return str.substring(0, i);
};

const styleAddress = (address) => {
  return (
    address.substring(0, 5) +
    '...' +
    address.substring(address.length - 3, address.length)
  );
};

export default function Option() {
  const { activeChain } = useNetwork();
  const { data: activeAccount, isError, isLoading } = useAccount();

  const [showExerciseInfo, setShowExerciseInfo] = useState(true);
  const [showListingInfo, setShowListingInfo] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [makerAsk, setMakerAsk] = useState(null);
  const [makerBids, setMakerBids] = useState([]);
  const [listed, setListed] = useState(false);
  const [bidded, setBidded] = useState(false);
  const [option, setOption] = useState(null);
  const [nft, setNft] = useState(null);
  const [asset, setAsset] = useState('');
  const [assetPrice, setAssetPrice] = useState(0);
  const [rawAssetPrice, setRawAssetPrice] = useState(null);
  const [assetDecimals, setAssetDecimals] = useState(0);
  const [isUserShort, setIsUserShort] = useState(false);
  const [noMetadata, setNoMetadata] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const isApprovedForAllFunc = useContractRead(
    {
      addressOrName: binance.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'isApprovedForAll',
    {
      args: [
        activeAccount ? activeAccount.address : zeroAddress,
        binance.transferManagerERC721,
      ],
    }
  );

  const setApprovalFunc = useContractWrite(
    {
      addressOrName: binance.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'setApprovalForAll'
  );

  const waitForSetApprovalFunc = useWaitForTransaction({
    hash: setApprovalFunc.data?.hash,
    onSuccess(data) {
      // necessary to make approve button disappear after approval
      isApprovedForAllFunc.refetch();
    },
  });

  const allowanceFunc = useContractRead(
    {
      addressOrName: activeChain
        ? nativeTokenMapper[activeChain.name.toLowerCase()]
        : zeroAddress,
      contractInterface: wethABI,
    },
    'allowance',
    {
      args: [activeAccount?.address, binance.speculateExchange],
    }
  );

  const approveSpendingFunc = useContractWrite(
    {
      addressOrName: activeChain
        ? nativeTokenMapper[activeChain.name.toLowerCase()]
        : zeroAddress,
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
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'matchAskWithTakerBid'
  );

  const waitForBuyNowFunc = useWaitForTransaction({
    hash: buyNowFunc.data?.hash,
  });

  const exerciseFunc = useContractWrite(
    {
      addressOrName: binance.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'exerciseOption'
  );

  const waitForExerciseFunc = useWaitForTransaction({
    hash: exerciseFunc.data?.hash,
  });

  const bidFunc = useContractWrite(
    {
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'createMakerBid'
  );

  const waitForBidFunc = useWaitForTransaction({
    hash: bidFunc.data?.hash,
  });

  const listFunc = useContractWrite(
    {
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'createMakerAsk'
  );

  const waitForListFunc = useWaitForTransaction({
    hash: listFunc.data?.hash,
  });

  const acceptFunc = useContractWrite(
    {
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'matchBidWithTakerAsk'
  );

  const waitForAcceptFunc = useWaitForTransaction({
    hash: acceptFunc.data?.hash,
  });

  useContractEvent(
    {
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'MakerAsk',
    ([
      signer,
      collection,
      tokenId,
      isOrderAsk,
      currency,
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
      addressOrName: binance.speculateExchange,
      contractInterface: SpeculateExchange.abi,
    },
    'MakerBid',
    ([
      signer,
      collection,
      tokenId,
      isOrderAsk,
      currency,
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
          usdPrice:
            '$' +
            (
              parseFloat(ethers.utils.formatEther(bid.price)) *
              parseFloat(assetPrice)
            ).toFixed(7),
          expiration: bid.endTime,
          from: styleAddress(bid.signer),
          img: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=022',
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
      // {
      //   Header: 'Price Treshold',
      //   accessor: 'priceTreshold',
      // },
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

  const getOption = async () => {
    if (activeAccount && activeChain) {
      if (!id) {
        return;
      }

      let provider = new ethers.providers.JsonRpcProvider(
        activeChain.rpcUrls.default
      );

      let contract = new ethers.Contract(
        binance.optionFactory,
        OptionFactory.abi,
        provider
      );

      const option = await contract.getOptionById(id);

      const parsedOption = {
        underlyingPriceFeed: option.underlyingPriceFeed,
        underlyingAmount: option.underlyingAmount,
        call: option.call,
        strikePrice: option.strikePrice,
        expiry: option.expiry,
        european: option.european,
        seller: option.seller,
      };

      if (option.seller.toLowerCase() === activeAccount.address.toLowerCase()) {
        setIsUserShort(true);
      }

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
      if (activeChain) {
        const chain = moralisMapping[activeChain.name.toLowerCase()];
        const url = `https://deep-index.moralis.io/api/v2/nft/${binance.optionFactory}/${id}?chain=${chain}&format=decimal`;
        let response = await fetch(url, {
          headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
        });

        response = await response.json();

        let actualNft = {
          ...response,
          metadata: response.metadata ? JSON.parse(response.metadata) : null,
        };

        return actualNft;
      }
    };

    if (activeAccount) {
      if (!id) {
        return;
      }

      let actualNft = await moralisRequest(id);

      if (!actualNft.metadata && actualNft.token_uri) {
        const re = /\/ipfs\/.+metadata.json$/;
        const ipfsString = actualNft.token_uri.match(re)[0];

        const ipfsUrl = `https://minty.infura-ipfs.io${ipfsString}`;

        let metadata = await extraRequest(ipfsUrl);
        actualNft.metadata = metadata;
      }

      if (actualNft.metadata) {
        setNft(actualNft);
        setNoMetadata(false);
      } else {
        setNoMetadata(true);
        console.log(
          'moralis is not filling up the token_uri nor metadata field'
        );
      }
    } else {
      console.log('connect with your wallet!');
    }
  };

  const getAssetPrice = async () => {
    try {
      if (!nft) {
        return;
      }
      const asset = nft.metadata.attributes[0].value;
      setAsset(asset);

      if (activeAccount && activeChain) {
        const network = activeChain.name.toLowerCase();
        const priceFeedAddress = priceFeeds[network][asset.toLowerCase()].usd;

        const provider = new ethers.providers.JsonRpcProvider(
          activeChain.rpcUrls.default
        );

        const priceFeedContract = new ethers.Contract(
          priceFeedAddress,
          aggregatorV3Interface.abi,
          provider
        );

        const decimals = await priceFeedContract.decimals();
        const price = await priceFeedContract.latestRoundData();

        setAssetPrice(ethers.utils.formatUnits(price.answer, decimals));
        setRawAssetPrice(price.answer);
        setAssetDecimals(decimals);
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
        `http://localhost:3001/makerAsks/${binance.optionFactory.toLowerCase()}/${id}`
      );
      const responseMakerBids = await fetch(
        `http://localhost:3001/makerBids/${binance.optionFactory.toLowerCase()}/${id}`
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
    if (activeAccount && activeChain) {
      const nativeCurrency = nativeTokenMapper[activeChain.name.toLowerCase()];
      const network = activeChain.name.toLowerCase();
      const priceFeed = priceFeeds[network][asset.toLowerCase()].usd;
      const makerAsk = {
        isOrderAsk: true,
        signer: activeAccount.address,
        collection: nft.token_address,
        price: ethers.BigNumber.from(ethers.utils.parseEther(price.toString())),
        tokenId: nft.token_id,
        amount: 1,
        currency: nativeCurrency,
        startTime: Math.floor(new Date().getTime() / 1000),
        endTime: Math.floor(new Date(until).getTime() / 1000),
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
    if (activeAccount && activeChain) {
      const network = activeChain.name.toLowerCase();
      const priceFeed = priceFeeds[network][asset.toLowerCase()].usd;
      const nativeCurrency = nativeTokenMapper[activeChain.name.toLowerCase()];
      const makerBid = {
        isOrderAsk: false,
        signer: activeAccount.address,
        collection: nft.token_address,
        price: ethers.BigNumber.from(ethers.utils.parseEther(price.toString())),
        tokenId: nft.token_id,
        amount: 1,
        currency: nativeCurrency,
        startTime: Math.floor(new Date().getTime() / 1000),
        endTime: Math.floor(new Date(until).getTime() / 1000),
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

  const exercise = async () => {
    if (activeAccount) {
      exerciseFunc.write({
        args: [id],
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
        args: [binance.speculateExchange, ethers.utils.parseEther('10000000')], // arbitrary value
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const getExpiryDate = () => {
    let d = new Date(parseInt(option.expiry.toString()) * 1000);

    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0'); // january is 0
    let yyyy = d.getFullYear();
    const formatted = mm + '/' + dd + '/' + yyyy;
    return formatted;
  };

  const getOptionStatus = () => {
    const strikePrice = option.strikePrice;
    if (rawAssetPrice.gt(strikePrice)) {
      return 'ITM';
    } else {
      return 'OTM';
    }
  };

  const getRightToBuy = () => {
    return ethers.utils.formatEther(option.underlyingAmount.toString());
  };

  const getValue = () => {
    const diff = rawAssetPrice.sub(option.strikePrice);
    const value = diff.mul(option.underlyingAmount);
    return value.gt(0) ? '$' + ethers.utils.formatUnits(value, 18 + 8) : '-';
  };

  const reSyncMetadata = async () => {
    const chain = moralisMapping[activeChain.name.toLowerCase()];
    const url = `https://deep-index.moralis.io/api/v2/nft/${binance.optionFactory}/${id}/metadata/resync?chain=${chain}&flag=uri&mode=sync`;
    let response = await fetch(url, {
      headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
    });
    response = await response.json();
    getNft();
  };

  return (
    <BaseContainer>
      {isUserShort ? (
        <ShortOption>
          <Link href={`/positions/shorts/${id}`}>
            <a>
              You are short this option <ExternalLinkIcon></ExternalLinkIcon>
            </a>
          </Link>
        </ShortOption>
      ) : null}
      {noMetadata ? (
        <ShortOption>
          <p onClick={reSyncMetadata}>Can not get metadata. Click to re-sync</p>
        </ShortOption>
      ) : null}
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
              <p className="owned-by">
                {nft ? `Owned by ${styleAddress(nft.owner_of)}` : 'Owned by '}
              </p>
            </DescriptionBox>
          </div>
          <div className="right">
            <p className="collection-header">{asset} Options</p>
            <p className="header">LONG {asset} CALL</p>
            <Stats>
              {option && assetDecimals > 0 ? (
                <MarketPriceDiv>
                  <p className="price-header">Strike Price:</p>
                  <p className="price">
                    $
                    {trimStr(
                      ethers.utils
                        .formatUnits(
                          option.strikePrice.toString(),
                          assetDecimals
                        )
                        .toString()
                    )}
                  </p>
                </MarketPriceDiv>
              ) : null}
              {rawAssetPrice && option ? (
                <>
                  <MarketPriceDiv>
                    <p className="price-header">
                      {nft.metadata.attributes[0].value} Price:
                    </p>
                    <p className="price">${trimStr(assetPrice)}</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Status:</p>
                    <p className="price">{getOptionStatus()}</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Expiry:</p>
                    <p className="price">{getExpiryDate()}</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Right to buy:</p>
                    <p className="price">
                      {getRightToBuy()}
                      {asset}
                    </p>
                  </MarketPriceDiv>
                </>
              ) : null}
            </Stats>
            <Stats>
              <MarketPriceDiv>
                <p className="price-header">Inherent Value:</p>
                {rawAssetPrice && option ? (
                  <p className="price">{trimStr(getValue())}</p>
                ) : null}
              </MarketPriceDiv>
            </Stats>
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
                    {option.european ? (
                      <p>
                        Since the option is of european style, it cannot be
                        exercised before expiry.
                      </p>
                    ) : (
                      <>
                        <p>
                          Since the option is American style, it can be
                          exercised early.
                        </p>
                        All our options settle in cash, which means the profit
                        is payed back in the native token.
                        <p></p>
                        {exerciseFunc.isLoading ? (
                          <Button>
                            <Spinner />
                          </Button>
                        ) : waitForExerciseFunc.isLoading ? (
                          <Button>
                            <Spinner />
                          </Button>
                        ) : (
                          <Button
                            onClick={exercise}
                            disabled={getOptionStatus() === 'OTM'}
                          >
                            Exercise Option
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : null
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
                      <Stats>
                        {listed && activeChain ? (
                          <MarketPriceDiv>
                            <span>Buy now price:</span>
                            <p>
                              {ethers.utils.formatEther(makerAsk.price)}{' '}
                              {activeChain.nativeCurrency.symbol.toUpperCase()}
                            </p>
                          </MarketPriceDiv>
                        ) : (
                          <p>Unlisted</p>
                        )}
                        {bidded && activeChain ? (
                          <MarketPriceDiv>
                            <span>Highest Offer:</span>
                            <p>
                              {ethers.utils.formatEther(makerBids[0].price)}{' '}
                              {activeChain.nativeCurrency.symbol.toUpperCase()}
                            </p>
                          </MarketPriceDiv>
                        ) : null}
                      </Stats>
                      {!isLoading &&
                      nft &&
                      nft.owner_of.toLowerCase() ===
                        activeAccount.address.toLowerCase() ? (
                        <>
                          {bidded ? (
                            acceptFunc.isLoading ? (
                              <Button>
                                <Spinner />
                              </Button>
                            ) : waitForAcceptFunc.isLoading ? (
                              <Button>
                                <Spinner />
                              </Button>
                            ) : (
                              <Button onClick={acceptOffer}>
                                Accept Offer
                              </Button>
                            )
                          ) : null}
                          <Button onClick={cancelListing}>
                            Cancel Listing
                          </Button>
                        </>
                      ) : (
                        <InnerContainer>
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
                            {listed &&
                            allowanceFunc?.data?.lt(makerAsk.price) ? (
                              <ApproveDiv>
                                {approveSpendingFunc.isLoading ? (
                                  <Button type="button">
                                    <Spinner />
                                  </Button>
                                ) : waitForApproveSpendingFunc.isLoading ? (
                                  <Button type="button">
                                    <Spinner />
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={approveSpending}
                                  >
                                    Approve spending
                                  </Button>
                                )}
                              </ApproveDiv>
                            ) : null}
                            <BuyDiv>
                              {bidFunc.isLoading ? (
                                <Button type="submit">
                                  <Spinner />
                                </Button>
                              ) : waitForBidFunc.isLoading ? (
                                <Button type="submit">
                                  <Spinner />
                                </Button>
                              ) : (
                                <Button type="submit">Make Offer</Button>
                              )}

                              {buyNowFunc.isLoading ? (
                                <Button type="button">
                                  <Spinner />
                                </Button>
                              ) : waitForBuyNowFunc.isLoading ? (
                                <Button type="button">
                                  <Spinner />
                                </Button>
                              ) : (
                                <Button onClick={buyNow} type="button">
                                  Buy now
                                </Button>
                              )}
                            </BuyDiv>
                          </form>
                        </InnerContainer>
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
                    {!isLoading &&
                    nft &&
                    nft.owner_of.toLowerCase() ===
                      activeAccount.address.toLowerCase() ? (
                      <InnerContainer>
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
                          <div>
                            {isApprovedForAllFunc &&
                            !isApprovedForAllFunc.data ? (
                              <>
                                {setApprovalFunc.isLoading ? (
                                  <Button type="button">
                                    <Spinner />
                                  </Button>
                                ) : waitForSetApprovalFunc.isLoading ? (
                                  <Button type="button">
                                    <Spinner />
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      setApprovalFunc.write({
                                        args: [
                                          binance.transferManagerERC721,
                                          true,
                                        ],
                                      })
                                    }
                                  >
                                    Approve NFT spending
                                  </Button>
                                )}
                              </>
                            ) : null}
                          </div>
                          {listFunc.isLoading ? (
                            <Button type="submit">
                              <Spinner />
                            </Button>
                          ) : waitForListFunc.isLoading ? (
                            <Button type="submit">
                              <Spinner />
                            </Button>
                          ) : (
                            <Button type="submit">List Option</Button>
                          )}
                        </form>
                      </InnerContainer>
                    ) : (
                      <>
                        <p>Unlisted</p>
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
                offers.length > 0 ? (
                  <div className="table-wrapper">
                    <SmallTable
                      columns={offerColumns}
                      data={offers}
                      initialState={initialState}
                    />
                  </div>
                ) : (
                  <NoOffers>No Offers</NoOffers>
                )
              ) : null}
            </OfferBox>
          </div>
        </Container>
      </OuterContainer>
    </BaseContainer>
  );
}

const BaseContainer = styled.div`
  padding: 10px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ShortOption = styled.div`
  width: 100vw;
  padding-top: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecedef;
  display: flex;
  justify-content: center;
  align-items: center;
  a {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    font-weight: 500;

    :hover {
      color: #0e76fd;
    }
  }

  p {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    font-weight: 500;

    :hover {
      color: #0e76fd;
    }
  }

  svg {
    width: 22px;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  /* grid-template-columns: repeat(4, auto); */
  /* justify-items: start; */
`;

const OfferAndBuyNow = styled.div`
  display: flex;
`;

const MarketPriceDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  .price-header {
    font-size: 14px;
  }
  .price {
    font-size: 24px;
    font-weight: 500;
  }
`;

const NoOffers = styled.div`
  padding: 15px;
`;

const ExerciseTerms = styled.div`
  margin: 10px 20px;

  .math {
    padding-left: 13px;
  }
`;

const BuyDiv = styled.div`
  /* width: 50%; */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  button {
    /* width: 47%; */
  }
`;
const ApproveDiv = styled.div`
  width: 50%;

  button {
    width: 97%;
  }
`;

const StyledMyTextInputOld = styled.input`
  margin: 10px 0px;
  padding: 5px;
  border: 1px solid lightblue;
  border: ${(props) => (props.error ? '1px solid red' : '1px solid lightblue')};
  border-radius: 3px;
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
      font-weight: 600;
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
      /* margin-top: 5px; */
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
      font-weight: 600;
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
  gap: 40px;
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
  border: 1px solid #ecedef;
  border-radius: 6px;
  padding: 10px;
  width: 320px;

  p {
    font-weight: 600;
  }
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
  /* margin-right: 10px; */
  margin-left: 0;
  padding: 9px 25px;
  font-size: 100%;
  font-weight: 700;
  border-radius: 12px;
  min-width: 150px;
  border: none;
  outline: none;
  cursor: pointer;

  /* box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); */
  :hover {
    transform: scale(1.01) perspective(1px);
  }
`;

const InnerContainer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  /* border: 1px solid #ecedef; */
  border-radius: 6px;

  /* padding: 25px; */
  /* font-size: 120%; */
  /* min-width: 350px; */
  p {
    margin-top: 10px;
  }

  a {
    :hover {
      color: #0e76fd;
    }
  }

  form {
    width: 45%;
    min-width: 325px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;

  label {
    font-size: 16px;
    margin-left: 2px;
    margin-right: 15px;
    color: #737581;
    opacity: 75%;
  }

  p {
    margin: 10px;
    margin-left: 7px;
    margin-right: 15px;
  }
`;

const InputContainerOld = styled.div`
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

const StyledMyTextInput = styled.input`
  margin-top: 5px;
  margin-bottom: 10px;
  padding: 7px;
  border: 1px solid lightblue;
  border: ${(props) => (props.error ? '1px solid red' : '1px solid #ecedef')};
  border-radius: 3px;
  font-weight: 500;
  /* width: 250px; */
`;

const StyledSelect = styled.select`
  margin-top: 5px;
  margin-bottom: 10px;
  padding: 6px;
  padding-right: 10px;
  font-size: 15px;
  background-color: white;
  border: 1px solid #ecedef;
  border-radius: 3px;
  font-weight: 500;
`;
