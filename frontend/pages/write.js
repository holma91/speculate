import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import {
  useContractWrite,
  useWaitForTransaction,
  useAccount,
  useContractEvent,
  useNetwork,
} from 'wagmi';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';
import {
  ArrowNarrowRightIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/solid';
import Table from '../components/Table';

import { generateMetadata, uploadToIpfs, createSvg } from '../utils/ipfsHelper';
import { rinkeby, binance, zeroAddress } from '../utils/addresses';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import { optionTemplates } from '../data/optionTemplates';
import { priceFeeds, aggregatorV3InterfaceABI } from '../utils/misc';

export default function Write() {
  const { activeChain } = useNetwork();
  const { data: activeAccount, isError, isLoading } = useAccount();
  const [template, setTemplate] = useState(optionTemplates[0]);
  const [assetPrice, setAssetPrice] = useState('');
  const [collateralPrice, setCollateralPrice] = useState('');
  const [assetDecimals, setAssetDecimals] = useState(0);

  const [createdOptionId, setCreatedOptionId] = useState(null);
  const [cRatio, setCRatio] = useState(0.0);
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  const createOptionFunc = useContractWrite(
    {
      addressOrName: binance.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'createOption'
  );

  const waitForCreateOptionFunc = useWaitForTransaction({
    hash: createOptionFunc.data?.hash,
    onSuccess(data) {
      console.log(data);
    },
  });

  useContractEvent(
    {
      addressOrName: binance.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'Transfer',
    ([from, to, tokenId]) => {
      setCreatedOptionId(tokenId.toString());
    }
  );

  const formik = useFormik({
    initialValues: {
      type: 'cryptocurrencies',
      asset: 'bnb',
      strikePrice: template.strikePrice,
      rightToBuy: template.rightToBuy,
      optionType: 'call',
      expiry: template.expiry,
      collateral: 1,
      optionStyle: 'european',
    },

    validationSchema: Yup.object({
      collateral: Yup.number()
        .min(0.000000001, 'Must deposit atleast 1 gwei')
        .required('Required'),
      strikePrice: Yup.number().required('Required'),
      expiry: Yup.date().required('Required'),
    }),

    onSubmit: (values) => {
      writeOption(values);
    },
  });

  const writeOption = async (values) => {
    if (activeAccount && activeChain) {
      const chain = activeChain.name.toLowerCase();
      const nativeSymbol = activeChain.nativeCurrency.symbol.toLowerCase();
      const assetSymbol = values.asset.toLowerCase();

      const assetPriceFeed = priceFeeds[chain][assetSymbol].usd;
      const collateralPriceFeed = priceFeeds[chain][nativeSymbol].usd;
      const option = {
        underlyingPriceFeed: assetPriceFeed,
        underlyingAmount: ethers.utils.parseEther(values.rightToBuy.toString()),
        call: values.type === 'call',
        strikePrice: ethers.utils.parseUnits(
          values.strikePrice.toString(),
          assetDecimals
        ),
        expiry: new Date(values.expiry).getTime() / 1000,
        european: values.style === 'european',
        seller: activeAccount.address,
      };
      const collateral = {
        priceFeed: collateralPriceFeed,
        amount: ethers.utils.parseEther(values.collateral.toString()),
      };

      const generatedSvg = createSvg(option, assetSymbol, assetDecimals);
      const metadata = generateMetadata(values, generatedSvg);
      let metadataURI = await uploadToIpfs(metadata);

      createOptionFunc.write({
        args: [option, collateral, metadataURI],
        overrides: {
          value: collateral.amount,
        },
      });
    } else {
      console.log('connect your wallet!');
    }
  };

  const getAssetPrice = async () => {
    try {
      if (activeAccount && activeChain) {
        const chain = activeChain.name.toLowerCase();

        const priceFeedAddress =
          priceFeeds[chain][formik.values.asset.toLowerCase()].usd;
        const provider = new ethers.providers.JsonRpcProvider(
          activeChain.rpcUrls.default
        );

        const priceFeedContract = new ethers.Contract(
          priceFeedAddress,
          aggregatorV3InterfaceABI,
          provider
        );

        const decimals = await priceFeedContract.decimals();
        const price = await priceFeedContract.latestRoundData();

        setAssetDecimals(decimals);
        setAssetPrice(ethers.utils.formatUnits(price.answer, decimals));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCollateralPrice = async () => {
    try {
      if (activeAccount && activeChain) {
        // collateral is always the native token for the mvp
        const collateral = activeChain.nativeCurrency.symbol.toLowerCase();
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

        const decimals = await priceFeedContract.decimals();
        const price = await priceFeedContract.latestRoundData();

        setCollateralPrice(ethers.utils.formatUnits(price.answer, decimals));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

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

  const calculateCRatio = () => {
    const ratio = (
      (collateralPrice * formik.values.collateral) /
      (assetPrice * formik.values.rightToBuy)
    ).toFixed(2);

    setCRatio(ratio);
  };

  useEffect(() => {
    calculateCRatio();
  }, [
    assetPrice,
    collateralPrice,
    formik.values.collateral,
    formik.values.rightToBuy,
  ]);

  useEffect(() => {
    getAssetPrice();
  }, [formik.values.asset]);

  useEffect(() => {
    getCollateralPrice();
  }, []);

  return (
    <BaseContainer>
      {createdOptionId ? (
        <NewOption>
          <Link href={`/options/${createdOptionId}`}>
            <a target="_blank">
              View Newly Created Option <ExternalLinkIcon></ExternalLinkIcon>
            </a>
          </Link>
        </NewOption>
      ) : null}
      <OuterContainer>
        <InnerContainer>
          <form>
            <InputContainerHalf>
              <InnerContainerHalf>
                <label htmlFor="type">Type: </label>
                <StyledSelect id="type" {...formik.getFieldProps('type')}>
                  <option value="cryptocurrencies">Cryptocurrencies</option>
                  <option value="equities">Equities</option>
                  <option value="fiat">Fiat</option>
                  <option value="commodities">Commodities</option>
                </StyledSelect>
              </InnerContainerHalf>
              <InnerContainerHalf>
                <label htmlFor="asset">Asset: </label>
                {formik.values.type === 'cryptocurrencies' ? (
                  <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
                    <option value="bnb">$BNB</option>
                    <option value="eth">$ETH</option>
                    <option value="btc">$BTC</option>
                    <option value="link">$LINK</option>
                    <option value="matic">$MATIC</option>
                    <option value="dot">$DOT</option>
                  </StyledSelect>
                ) : formik.values.type === 'equities' ? (
                  <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
                    <option value="tsla">$TSLA</option>
                    <option value="amzn">$AMZN</option>
                    <option value="nflx">$NFLX</option>
                    <option value="fb">$FB</option>
                    <option value="gme">$GME</option>
                    <option value="aapl">$AAPL</option>
                  </StyledSelect>
                ) : formik.values.type === 'fiat' ? (
                  <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
                    <option value="eur">$EUR</option>
                    <option value="gbp">$GBP</option>
                    <option value="chf">$CHF</option>
                    <option value="cad">$CAD</option>
                    <option value="aur">$AUR</option>
                  </StyledSelect>
                ) : (
                  <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
                    <option value="xau">$XAU</option>
                    <option value="xag">$XAG</option>
                    <option value="wti">$WTI</option>
                  </StyledSelect>
                )}
              </InnerContainerHalf>
            </InputContainerHalf>
            <InputContainer>
              <label htmlFor="optionType">Option type: </label>
              <StyledSelect
                id="optionType"
                {...formik.getFieldProps('optionType')}
              >
                <option value="call">CALL</option>
                <option value="put">PUT</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <label htmlFor="strikePrice">Strike Price: </label>
              <StyledMyTextInput
                name="strikePrice"
                type="number"
                placeholder="3500"
                {...formik.getFieldProps('strikePrice')}
              />
            </InputContainer>
            <InputContainer>
              <label htmlFor="rightToBuy">
                Right to buy ({formik.values.asset.toUpperCase()}):{' '}
              </label>
              <StyledMyTextInput
                name="rightToBuy"
                type="number"
                placeholder="1"
                {...formik.getFieldProps('rightToBuy')}
              />
            </InputContainer>
            <InputContainer>
              <label htmlFor="expiry">Expiry Date: </label>
              <StyledMyTextInput
                name="expiry"
                type="date"
                placeholder=""
                {...formik.getFieldProps('expiry')}
              />
            </InputContainer>
            <InputContainer>
              <label htmlFor="optionStyle">Option style: </label>
              <StyledSelect
                id="optionStyle"
                {...formik.getFieldProps('optionStyle')}
              >
                <option value="european">European</option>
                <option value="american">American</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <div>
                {!isSSR && activeChain ? (
                  <label htmlFor="collateral">
                    Your Collateral (
                    {activeChain.nativeCurrency.name.toUpperCase()})
                  </label>
                ) : (
                  <label htmlFor="collateral">Your Collateral (): </label>
                )}
              </div>
              <StyledMyTextInput
                name="collateral"
                type="number"
                placeholder="1"
                {...formik.getFieldProps('collateral')}
                error={formik.touched.collateral && formik.errors.collateral}
              />
            </InputContainer>
          </form>
        </InnerContainer>
        <StyledArrowRightIcon></StyledArrowRightIcon>
        <NFTContainer>
          <Summary>
            <InnerContainer>
              <Stats>
                {formik.values.asset !== 'bnb' ? (
                  <MarketPriceDiv>
                    <p className="price-header">
                      {formik.values.asset.toUpperCase()} Price:
                    </p>
                    <a
                      className="inner-price"
                      href="https://data.chain.link"
                      target="_blank"
                    >
                      <StyledShieldCheckIcon></StyledShieldCheckIcon>
                      <p className="price">${trimStr(assetPrice)}</p>
                    </a>
                  </MarketPriceDiv>
                ) : null}
                <MarketPriceDiv>
                  {!isSSR && activeChain ? (
                    <p className="price-header">
                      {activeChain.nativeCurrency.name.toUpperCase()} Price:
                    </p>
                  ) : null}
                  <a
                    className="inner-price"
                    href="https://data.chain.link"
                    target="_blank"
                  >
                    <StyledShieldCheckIcon></StyledShieldCheckIcon>
                    <p className="price">${trimStr(collateralPrice)}</p>
                  </a>
                </MarketPriceDiv>
              </Stats>
              <Stats>
                <MarketPriceDiv>
                  <p className="price-header">Risk:</p>
                  <p className="price">
                    $
                    {trimStr(
                      (assetPrice * formik.values.rightToBuy).toString()
                    )}{' '}
                  </p>
                </MarketPriceDiv>
              </Stats>
              <Stats>
                <MarketPriceDiv>
                  <p className="price-header">Collateral:</p>
                  <p className="price">
                    {trimStr(
                      (collateralPrice * formik.values.collateral).toString()
                    )}
                  </p>
                </MarketPriceDiv>
              </Stats>
              <Stats className="last-one">
                <CRatioDiv ratio={cRatio}>
                  <p className="price-header">Collateral-to-Risk Ratio:</p>
                  <p className="price">{cRatio}</p>
                </CRatioDiv>
              </Stats>
              <form onSubmit={formik.handleSubmit}>
                {createOptionFunc.isLoading ? (
                  <Button type="button">Loading...</Button>
                ) : waitForCreateOptionFunc.isLoading ? (
                  <Button type="button">Pending...</Button>
                ) : (
                  <Button type="submit">Write Option</Button>
                )}
              </form>
            </InnerContainer>
          </Summary>
        </NFTContainer>
      </OuterContainer>

      {/* <TemplateContainer>
        <Templates>
          <p>Templates</p>
          <Table
            columns={shortColumns}
            data={shorts}
            initialState={initialState}
          />
        </Templates>
      </TemplateContainer> */}
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

const StyledArrowRightIcon = styled(ArrowNarrowRightIcon)`
  height: 90px;
`;

const Summary = styled.div`
  padding: 10px 10px;
  display: flex;
  justify-content: center;
`;

const NewOption = styled.div`
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

  svg {
    width: 22px;
  }
`;

const TemplateContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Templates = styled.div`
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-content: start;
`;

const NFTContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const OuterContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  /* height: 100vh; */
  color: black;
  gap: 35px;

  padding: 10px 0;

  /* @media screen and (max-width: 1100px) {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  } */
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ecedef;
  border-radius: 6px;

  padding: 25px;
  font-size: 120%;
  min-width: 350px;
  p {
    margin-top: 10px;
  }

  a {
    :hover {
      color: #0e76fd;
    }
  }
`;

const Button = styled.button`
  background-color: #0e76fd;
  color: white;
  /* margin-top: 20px; */
  padding: 9px 25px;
  font-size: 100%;
  font-weight: 700;
  border-radius: 12px;
  width: 100%;
  border: none;
  outline: none;
  cursor: pointer;

  /* box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); */
  :hover {
    transform: scale(1.01) perspective(1px);
  }
`;

const Stats = styled.div`
  margin-bottom: 10px;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  /* grid-template-columns: repeat(4, auto); */
  /* justify-items: start; */

  .last-one {
    margin-bottom: 0;
  }
`;

const MarketPriceDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  .price-header {
    font-size: 14px;
  }

  .inner-price {
    display: flex;
    gap: 2px;
    align-items: center;
    cursor: pointer;
  }

  .price {
    font-size: 24px;
    font-weight: 500;
  }
  p {
    margin: 0;
  }
`;

const CRatioDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  .price-header {
    font-size: 14px;
  }

  .inner-price {
    display: flex;
    gap: 2px;
    align-items: center;
    cursor: pointer;
  }

  .price {
    font-size: 24px;
    font-weight: 500;
    /* color: ${(props) => (props.ratio >= 1 ? 'green' : 'red')}; */
    color: ${(props) =>
      props.ratio < 1 ? '#f8333c' : props.ratio < 1.2 ? '#FCAB10' : '#44AF69'};
  }
  p {
    margin: 0;
  }
`;

const StyledShieldCheckIcon = styled(ShieldCheckIcon)`
  height: 20px;
  width: 20px;
`;

const StyledMyTextInput = styled.input`
  margin-top: 5px;
  margin-bottom: 10px;
  padding: 7px;
  border: 1px solid lightblue;
  border: ${(props) => (props.error ? '1px solid red' : '1px solid #ecedef')};
  border-radius: 3px;
  font-weight: 500;
`;

const InputContainerHalf = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const InnerContainerHalf = styled.div`
  display: flex;
  flex-direction: column;

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
