import React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import * as buffer from 'buffer/';
import styled from 'styled-components';
import { Canvg } from 'canvg';
import { ArrowRightIcon, ArrowNarrowRightIcon } from '@heroicons/react/solid';

import { generateMetadata, uploadToIpfs } from '../utils/ipfsHelper';
import { fuji } from '../utils/addresses';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import { optionTemplates } from '../data/optionTemplates';

const Buffer = buffer.Buffer;

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
      // gets back price with 8 decimals
      // scale the input by 10^8
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
  eth: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
  btc: 'https://prismic-io.s3.amazonaws.com/data-chain-link/19a58483-b100-4d09-ab0d-7d221a491090_BTC.svg',
  avax: 'https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format',
  link: 'https://data-chain-link.cdn.prismic.io/data-chain-link/ad14983c-eec5-448e-b04c-d1396e644596_LINK.svg',
  sol: 'https://images.prismic.io/data-chain-link/931ba23b-1755-46be-a466-73af2fcafaf1_ICON_SOL.png?auto=compress,format',
};

export default function Write() {
  const [template, setTemplate] = useState(optionTemplates[0]);
  const [assetPrice, setAssetPrice] = useState('');
  const [collateralPrice, setCollateralPrice] = useState('');

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      asset: template.asset,
      strikePrice: template.strikePrice,
      rightToBuy: template.rightToBuy,
      type: 'call',
      expiry: template.expiry,
      collateral: 1,
      premium: template.premium,
      numberOfOptions: 1,
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

  const svgToPngBuffer = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const v = Canvg.fromString(
      context,
      '<svg width="320" height="320" version="1.1" xmlns="http://www.w3.org/2000/svg" class="write__StyledSVG-sc-ez607g-5 eLMpVK"><image href="/BTC.svg" x="90" y="26" height="28px" width="28px"></image><text x="120" y="49" font-size="25" font-weight="300">ETH<!-- --> CALL<!-- --></text><line x1="20" y1="65" x2="300" y2="65" stroke="black" stroke-width="1.25"></line><text x="70" y="105" font-size="20" font-weight="300">Price Feed: <!-- -->ETH/USD<!-- --></text><text x="70" y="150" font-size="20" font-weight="300">Strike Price: <!-- -->$2000<!-- --></text><text x="70" y="195" font-size="20" font-weight="300">Amount: <!-- -->2 ETH<!-- --></text><text x="70" y="240" font-size="20" font-weight="300">Expiry: <!-- -->2023-01-01<!-- --></text><text x="70" y="285" font-size="20" font-weight="300">American Style</text></svg>'
    );
    await v.render();
    let png = canvas.toDataURL('image/png');
    png = png.replace(/^data:image\/png;base64,/, '');
    let buf = Buffer.from(png, 'base64');
    return buf;
  };

  const writeOption = async (values) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // create a png from the svg

        const image = await svgToPngBuffer();
        // console.log(image);

        // console.log(image.toString('base64'));

        const metadata = generateMetadata(values);
        // turn svg into a png somehow
        const options = metadata;
        const filename = `${values.asset}${values.type}.png`;

        let metadataURI = await uploadToIpfs(image, filename, options);

        console.log(metadataURI);
      } else {
        console.log('cannot find ethereum object!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAssetPrice = async () => {
    try {
      const network = 'FUJI';
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
      const network = 'FUJI';
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
      (assetPrice * formik.values.rightToBuy * formik.values.numberOfOptions)
    ).toFixed(4);
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
                <option value="avax">$AVAX</option>
                <option value="link">$LINK</option>
                <option value="sol">$SOL</option>
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
            <InputContainer>
              <label htmlFor="numberOfOptions">Number of options: </label>
              <StyledMyTextInput
                name="numberOfOptions"
                type="number"
                placeholder="1"
                {...formik.getFieldProps('numberOfOptions')}
              />
            </InputContainer>
          </form>
        </InnerContainer>
        <StyledArrowRightIcon></StyledArrowRightIcon>
        <NFTContainer>
          <StyledSVG
            width="320"
            height="320"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <image
              href={imageMapper[formik.values.asset]}
              x="90"
              y="26"
              height="28px"
              width="28px"
            />
            <text
              x={formik.values.asset === 'eth' ? '120' : '123'}
              y="49"
              fontSize="25"
              fontWeight="300"
            >
              {formik.values.asset.toUpperCase()} CALL
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
              Price Feed: {`${formik.values.asset.toUpperCase()}/USD`}
            </text>
            <text x="70" y="150" fontSize="20" fontWeight="300">
              Strike Price: {`$${formik.values.strikePrice}`}
            </text>
            <text x="70" y="195" fontSize="20" fontWeight="300">
              Amount: {`${formik.values.rightToBuy} ETH`}
            </text>
            <text x="70" y="240" fontSize="20" fontWeight="300">
              Expiry: {formik.values.expiry}
            </text>
            <text x="70" y="285" fontSize="20" fontWeight="300">
              American Style
            </text>
          </StyledSVG>
        </NFTContainer>
      </OuterContainer>

      <Summary>
        <InnerContainer>
          <form onSubmit={formik.handleSubmit}>
            {formik.values.asset !== 'eth' ? (
              <p>
                Current {formik.values.asset.toUpperCase()} Price = $
                {trimStr(assetPrice)}
              </p>
            ) : null}
            <p>Current ETH Price = ${trimStr(collateralPrice)}</p>
            <p>
              Current Risk = {formik.values.asset.toUpperCase()} Price x Amount
              x Sold Longs = $0
            </p>
            <p>
              Max Risk = {formik.values.asset.toUpperCase()} Price x Amount x
              Minted Longs = $
              {trimStr(
                (
                  assetPrice *
                  formik.values.rightToBuy *
                  formik.values.numberOfOptions
                ).toString()
              )}
            </p>
            <p>
              Collateral = ETH Price x Deposit = $
              {trimStr((collateralPrice * formik.values.collateral).toString())}
            </p>
            <p>
              Collateral-to-Risk Ratio = Collateral / Max Risk ={' '}
              {calculateCRRatio()}
            </p>
            <Button type="submit">Write Options</Button>
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
      <StyledImg ref={imgRef}></StyledImg>
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
  border-radius: 6px;
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
