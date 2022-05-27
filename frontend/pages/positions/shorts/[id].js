import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  useAccount,
  useNetwork,
} from 'wagmi';
import { ethers } from 'ethers';
import styled from 'styled-components';
import {
  binance,
  binanceTest,
  zeroAddress,
  nativeTokenMapper,
} from '../../../utils/addresses';
import aggregatorV3Interface from '../../../../contracts/out/AggregatorV3Interface.sol/AggregatorV3Interface.json';
import SpeculateExchange from '../../../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import OptionFactory from '../../../../contracts/out/OptionFactory.sol/OptionFactory.json';
import wethABI from '../../../../contracts/wethABI.json';

import {
  aggregatorV3InterfaceABI,
  moralisMapping,
  priceFeeds,
} from '../../../utils/misc';

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

  if (j === 0) {
    return str + '.00';
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
  const [option, setOption] = useState(null);
  const [collateral, setCollateral] = useState(null);
  const [nft, setNft] = useState(null);
  const [asset, setAsset] = useState('');
  const [assetPrice, setAssetPrice] = useState(0);
  const [rawAssetPrice, setRawAssetPrice] = useState(null);
  const [isUserShort, setIsUserShort] = useState(false);
  const [rawCollateralPrice, setRawCollateralPrice] = useState(null);
  const [collateralizationRatio, setCollateralizationRatio] = useState(null);
  const router = useRouter();
  const { id } = router.query;

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
      const collateral = await contract.getCollateralById(id);

      const parsedOption = {
        underlyingPriceFeed: option.underlyingPriceFeed,
        underlyingAmount: option.underlyingAmount,
        call: option.call,
        strikePrice: option.strikePrice,
        expiry: option.expiry,
        european: option.european,
        seller: option.seller,
      };

      const parsedCollateral = {
        priceFeed: collateral.priceFeed,
        amount: collateral.amount,
      };

      if (
        parsedOption.seller.toLowerCase() ===
        activeAccount.address.toLowerCase()
      ) {
        setIsUserShort(true);
      }

      setOption(parsedOption);
      setCollateral(parsedCollateral);
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
      const asset = nft.metadata.attributes[0].value;
      setAsset(asset);

      if (activeAccount) {
        // always the native token as collateral for the mvp
        const chain = activeChain.name.toLowerCase();
        const priceFeedAddress = priceFeeds[chain][asset.toLowerCase()].usd;
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
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCollateralPrice = async () => {
    if (activeAccount && activeChain) {
      const collateral = activeChain.nativeCurrency.symbol.toLowerCase(); // always the native ting for the mvp
      const chain = activeChain.name.toLowerCase();
      const priceFeedAddress = priceFeeds[chain][collateral].usd;

      const provider = new ethers.providers.JsonRpcProvider(
        activeChain.rpcUrls.default
      );

      const priceFeedContract = new ethers.Contract(
        priceFeedAddress,
        aggregatorV3InterfaceABI,
        provider
      );

      const price = await priceFeedContract.latestRoundData();

      setRawCollateralPrice(price.answer);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  useEffect(() => {
    getAssetPrice();
  }, [nft]);

  useEffect(() => {
    getNft();
    getOption();
    getCollateralPrice();
  }, [id]);

  const getExpiryDate = () => {
    let d = new Date(parseInt(option.expiry.toString()) * 1000);

    let dd = String(d.getDate()).padStart(2, '0');
    let mm = String(d.getMonth() + 1).padStart(2, '0'); //January is 0!
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

  const getRisk = () => {
    const risk = rawAssetPrice.mul(option.underlyingAmount);
    return ethers.utils.formatUnits(risk, 18 + 8);
  };

  const getCollateral = () => {
    return ethers.utils.formatUnits(collateral.amount, 18);
  };

  const getCollateralizationRatio = () => {
    if (!rawAssetPrice || !rawCollateralPrice || !option) {
      return;
    }
    const risk = rawAssetPrice.mul(option.underlyingAmount);
    const collateralValue = rawCollateralPrice.mul(collateral.amount);

    // this is suboptimal
    let riskFloat = parseFloat(ethers.utils.formatUnits(risk, 18));
    let collateralFloat = parseFloat(
      ethers.utils.formatUnits(collateralValue, 18)
    );
    let ratio = riskFloat !== 0 ? collateralFloat / riskFloat : 0;
    console.log(typeof ratio);
    console.log(ratio);
    setCollateralizationRatio(ratio);
  };

  useEffect(() => {
    getCollateralizationRatio();
  }, [rawAssetPrice, rawCollateralPrice, option]);

  return (
    <BaseContainer>
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
            <p className="header">SHORT {asset} CALL</p>
            <Stats>
              {rawAssetPrice && option && collateral ? (
                <>
                  <MarketPriceDiv>
                    <p className="price-header">
                      {nft.metadata.attributes[0].value} Price:
                    </p>
                    <p className="price">${trimStr(assetPrice)}</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Risk:</p>
                    <p className="price">${trimStr(getRisk())}</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Collateral:</p>
                    <p className="price">{getCollateral()}ETH</p>
                  </MarketPriceDiv>
                  <MarketPriceDiv>
                    <p className="price-header">Obligation:</p>
                    <p className="price">
                      {getRightToBuy()}
                      {asset}
                    </p>
                  </MarketPriceDiv>
                </>
              ) : null}
            </Stats>
            {/* <Stats>
              <MarketPriceDiv className="ratio">
                <p className="price-header">Collateralization Ratio:</p>
                {collateralizationRatio ? (
                  <CollateralRatio ratio={collateralizationRatio}>
                    {trimStr(collateralizationRatio.toString())}
                  </CollateralRatio>
                ) : null}
              </MarketPriceDiv>
            </Stats> */}
            {isUserShort ? (
              <ButtonDiv>
                <Button ratio={collateralizationRatio} add={true}>
                  Add Collateral
                </Button>
                <Button ratio={collateralizationRatio} add={false} disabled>
                  Withdraw Collateral
                </Button>
              </ButtonDiv>
            ) : null}

            <PriceBox isClicked={showExerciseInfo}>
              <div
                onClick={() => setShowExerciseInfo(!showExerciseInfo)}
                className="time"
              >
                <p>Option information</p>
              </div>
              {showExerciseInfo ? (
                nft?.metadata && assetPrice && option ? (
                  <div className="exercising-info">
                    {rawAssetPrice && option ? (
                      <Stats>
                        <MarketPriceDiv>
                          <p className="price-header">Strike Price:</p>
                          <p className="price">
                            $
                            {trimStr(
                              ethers.utils
                                .formatUnits(option.strikePrice.toString(), 8)
                                .toString()
                            )}
                          </p>
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
                      </Stats>
                    ) : null}
                    <Stats>
                      <MarketPriceDiv className="last-stats">
                        <p className="price-header">Inherent Value:</p>
                        {rawAssetPrice && option ? (
                          <p className="price">{trimStr(getValue())}</p>
                        ) : null}
                      </MarketPriceDiv>
                    </Stats>
                  </div>
                ) : null
              ) : null}
            </PriceBox>
          </div>
        </Container>
      </OuterContainer>
    </BaseContainer>
  );
}

const CollateralRatio = styled.p`
  color: ${(props) =>
    props.ratio < 1 ? '#f8333c' : props.ratio < 1.2 ? '#FCAB10' : '#44AF69'};
  font-size: 24px;
  font-weight: 500;
`;

const BaseContainer = styled.div`
  padding: 10px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Stats = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;

  .last-stats {
    margin-top: 10px;
  }
  .ratio {
    margin-top: 5px;
    /* margin-bottom: 10px; */
  }
`;

const MarketPriceDiv = styled.div`
  margin-top: 10px;

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
    /* padding-left: 15px; */
    /* padding-bottom: 15px; */
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
      /* margin: 8px 0; */
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

const StyledImg = styled.img`
  border: 1px solid black;
  border-radius: 6px;
  width: 320px;
  height: 320px;
`;

const ButtonDiv = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 8px;
`;

const Button = styled.button`
  background-color: #0e76fd;
  color: white;
  /* margin-top: 10px; */
  margin-right: 10px;
  margin-left: 0;
  padding: 8px 22px;
  font-size: 90%;
  font-weight: 700;
  border-radius: 12px;
  /* width: 50%; */
  border: none;
  outline: none;
  cursor: ${(props) => (!props.add && props.ratio < 1.2 ? '' : 'pointer')};

  opacity: ${(props) => (!props.add && props.ratio < 1.2 ? '50%' : '100%')};

  /* box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); */
  :hover {
    transform: ${(props) =>
      !props.add && props.ratio < 1.2 ? '' : 'scale(1.01) perspective(1px)'};
  }
`;
