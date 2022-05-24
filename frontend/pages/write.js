import React from 'react';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useFormik } from 'formik';
import {
  useSendTransaction,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  useAccount,
  useContractEvent,
} from 'wagmi';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import * as buffer from 'buffer/';
import styled from 'styled-components';
import { Canvg } from 'canvg';
import { ArrowRightIcon, ArrowNarrowRightIcon } from '@heroicons/react/solid';

import { generateMetadata, uploadToIpfs, createSvg } from '../utils/ipfsHelper';
import { fuji, rinkeby } from '../utils/addresses';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import { optionTemplates } from '../data/optionTemplates';

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
    name: 'getRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

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

const imageMapper = {
  eth: '/ETH.svg',
  btc: '/BTC.svg',
  avax: '/AVAX.svg',
  link: '/LINK.svg',
  sol: '/SOL.svg',
  matic: '/MATIC.svg',
  atom: '/ATOM.svg',
};

export default function Write() {
  const { data: activeAccount, isError, isLoading } = useAccount();
  const [template, setTemplate] = useState(optionTemplates[0]);
  const [assetPrice, setAssetPrice] = useState('');
  const [collateralPrice, setCollateralPrice] = useState('');
  const [assetDecimals, setAssetDecimals] = useState(0);

  const [createdOptionId, setCreatedOptionId] = useState(null);

  const createOptionFunc = useContractWrite(
    {
      addressOrName: rinkeby.optionFactory,
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

  const moralisMetadataSync = async (tokenId) => {
    await sleep(5000);
    const chain = 'rinkeby';
    const url = `https://deep-index.moralis.io/api/v2/nft/${
      rinkeby.optionFactory
    }/${tokenId.toString()}/metadata/resync?chain=${chain}&flag=metadata&mode=sync`;
    let response = await fetch(url, {
      headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
    });
    response = await response.json();
    console.log(response);
  };

  useContractEvent(
    {
      addressOrName: rinkeby.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'Transfer',
    ([from, to, tokenId]) => {
      console.log(tokenId.toString());
      setCreatedOptionId(tokenId.toString());
      moralisMetadataSync(tokenId);
    }
  );

  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      asset: template.asset,
      strikePrice: template.strikePrice,
      rightToBuy: template.rightToBuy,
      type: 'call',
      expiry: template.expiry,
      collateral: 1,
      premium: template.premium,
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
    if (activeAccount) {
      const option = {
        underlyingPriceFeed: priceFeeds.RINKEBY[values.asset.toUpperCase()].USD,
        underlyingAmount: ethers.utils.parseEther(values.rightToBuy.toString()),
        call: values.type === 'call',
        strikePrice: ethers.utils.parseUnits(
          values.strikePrice.toString(),
          assetDecimals
        ),
        expiry: 1000000,
      };
      const collateral = {
        priceFeed: priceFeeds.RINKEBY.ETH.USD,
        amount: ethers.utils.parseEther(values.collateral.toString()),
      };

      const generatedSvg = createSvg(option, values.asset, assetDecimals);
      const metadata = generateMetadata(values, generatedSvg);
      let metadataURI = await uploadToIpfs(metadata);

      // console.log(values);
      createOptionFunc.write({
        args: [option, collateral, metadataURI],
        overrides: {
          value: collateral.amount,
        },
      });
    } else {
      console.log('cannot your wallet!');
    }
  };

  const getAssetPrice = async () => {
    try {
      const network = 'RINKEBY';
      const priceFeedAddress =
        priceFeeds[network][formik.values.asset.toUpperCase()].USD;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

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
      const network = 'RINKEBY';
      const collateral = 'ETH'; // always ETH for the mvp
      const priceFeedAddress = priceFeeds[network][collateral].USD;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

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

  const calculateCRRatio = () => {
    return (
      (collateralPrice * formik.values.collateral) /
      (assetPrice * formik.values.rightToBuy)
    ).toFixed(2);
  };

  useEffect(() => {
    getAssetPrice();
  }, [formik.values.asset]);

  useEffect(() => {
    getCollateralPrice();
  }, []);

  return (
    <BaseContainer>
      <OuterContainer>
        <InnerContainer>
          <form>
            <InputContainer>
              <label htmlFor="asset">Asset: </label>
              <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
                <option value="eth">$ETH</option>
                <option value="btc">$BTC</option>
                <option value="atom">$ATOM</option>
                <option value="link">$LINK</option>
                <option value="matic">$MATIC</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <label htmlFor="type">Type: </label>
              <StyledSelect id="type" {...formik.getFieldProps('type')}>
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
              <label htmlFor="rightToBuy">Amount: </label>
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
              <label htmlFor="collateral">Your Collateral (ETH): </label>
              <StyledMyTextInput
                name="collateral"
                type="number"
                placeholder="1"
                {...formik.getFieldProps('collateral')}
                error={formik.touched.collateral && formik.errors.collateral}
              />
            </InputContainer>
            <InputContainer>
              <label htmlFor="premium">Premium (ETH): </label>
              <StyledMyTextInput
                name="premium"
                type="number"
                placeholder="1"
                {...formik.getFieldProps('premium')}
              />
            </InputContainer>
          </form>
        </InnerContainer>
        <StyledArrowRightIcon></StyledArrowRightIcon>
        <NFTContainer>
          <StyledSVG
            ref={svgRef}
            width="350"
            height="350"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="0" y="0" width="350" height="350" fill="white" />
            <text x="122" y="49" fontSize="25" fontWeight="200">
              {formik.values.asset.toUpperCase()} CALL
            </text>
            <line
              x1="40"
              y1="65"
              x2="310"
              y2="65"
              stroke="black"
              strokeWidth="1"
            />
            <text x="80" y="105" fontSize="20" fontWeight="200">
              Price Feed: {`${formik.values.asset.toUpperCase()}/USD`}
            </text>
            <text x="80" y="150" fontSize="20" fontWeight="200">
              Strike Price: {`$${formik.values.strikePrice}`}
            </text>
            <text x="80" y="195" fontSize="20" fontWeight="200">
              Amount:{' '}
              {`${
                formik.values.rightToBuy
              } ${formik.values.asset.toUpperCase()}`}
            </text>
            <text x="80" y="240" fontSize="20" fontWeight="200">
              Expiry: {formik.values.expiry}
            </text>
            <text x="80" y="285" fontSize="20" fontWeight="200">
              American Style
            </text>
          </StyledSVG>
        </NFTContainer>
      </OuterContainer>

      <Summary>
        <InnerContainer>
          {createdOptionId ? (
            <Link href={`/options/${createdOptionId}`}>
              <a>Newly Created Option</a>
            </Link>
          ) : null}
          <form onSubmit={formik.handleSubmit}>
            {formik.values.asset !== 'eth' ? (
              <p>
                Current {formik.values.asset.toUpperCase()} Price = $
                {trimStr(assetPrice)}
              </p>
            ) : null}
            <p>Current ETH Price = ${trimStr(collateralPrice)}</p>
            <p>
              Max Risk = {formik.values.asset.toUpperCase()} Price x Amount = $
              {trimStr((assetPrice * formik.values.rightToBuy).toString())}
            </p>
            <p>
              Collateral = ETH Price x Deposit = $
              {trimStr((collateralPrice * formik.values.collateral).toString())}
            </p>
            <p>
              Collateral-to-Risk Ratio = Collateral / Max Risk ={' '}
              {calculateCRRatio()}
            </p>
            <Button type="submit">Write Option</Button>
          </form>
        </InnerContainer>
      </Summary>
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
      <StyledCanvas ref={canvasRef}></StyledCanvas>
    </BaseContainer>
  );
}

const StyledCanvas = styled.canvas`
  display: none;
`;

const StyledImg = styled.img`
  /* display: none; */
`;

const BaseContainer = styled.div`
  padding: 10px 30px;
`;

const StyledArrowRightIcon = styled(ArrowNarrowRightIcon)`
  height: 90px;
`;

const Summary = styled.div`
  padding: 10px 30px;
  display: flex;
  justify-content: center;
`;

const TemplateContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Templates = styled.div`
  /* max-width: 1000px; */
  /* display: flex; */
  /* flex-direction: column; */
  /* justify-content: center; */
  /* justify-content: start; */
`;

const StyledSVG = styled.svg`
  border: 2px solid black;
  /* border-radius: 6px; */
`;

const NFTContainer = styled.div`
  /* height: 100%; */
  /* width: 100%; */
  /* margin-top: 70px; */
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
  /* box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32); */
  padding: 25px;
  font-size: 120%;
  /* min-width: 500px; */
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
  margin-top: 20px;
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

const StyledSelect = styled.select`
  margin: 10px 0px;
  padding: 3px;
  padding-right: 10px;
  font-size: 15px;
  background-color: white;
  border: 1px solid lightblue;
  border-radius: 3px;
`;
