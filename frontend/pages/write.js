import React from 'react';
import { useState, useEffect } from 'react';
import { Formik, Form, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';

import { fuji } from '../utils/addresses';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import { optionTemplates } from '../data/optionTemplates';

const MyTextInput = ({ label, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <>
      <label htmlFor={props.id || props.name}>{label}</label>
      {meta.touched && meta.error ? (
        <StyledMyTextInput {...field} {...props} error />
      ) : (
        <StyledMyTextInput {...field} {...props} />
      )}
    </>
  );
};

const MySelect = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <div>
      <label htmlFor={props.id || props.name}>{label}</label>
      <select {...field} {...props} />
      {meta.touched && meta.error ? <div>{meta.error}</div> : null}
    </div>
  );
};

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
  },
};

export default function Write() {
  const [template, setTemplate] = useState(optionTemplates[0]);
  const writeOption = async (values) => {
    try {
      const { ethereum } = window;
      console.log(values);

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const optionFactory = new ethers.Contract(
          fuji.optionFactory,
          OptionFactory.abi,
          signer
        );

        console.log(optionFactory);

        const priceFeedAddress =
          priceFeeds.FUJI[values.asset.toUpperCase()].USD;

        const priceFeedDecimals = 8;

        const shortOption = {
          underlyingPriceFeed: priceFeedAddress,
          underlyingAmount: values.rightToBuy,
          call: values.type === 'call',
          long: false,
          strikePrice: ethers.utils.parseUnits(
            values.strikePrice.toString(),
            priceFeedDecimals
          ),
          expiry: new Date(values.expiry).getTime() / 1000,
        };

        const longOption = shortOption;
        longOption.long = true;

        const collateral = {
          priceFeed: priceFeedAddress,
          amount: ethers.utils.parseEther(values.collateral.toString()),
          mintedLongs: values.numberOfOptions,
        };

        console.log(shortOption);
        const startingCollateral = ethers.utils.parseEther(
          values.collateral.toString()
        );

        const tx = await optionFactory.createOption(
          shortOption,
          longOption,
          collateral,
          {
            value: startingCollateral,
            gasLimit: 3000000,
          }
        );
        await tx.wait();
        console.log(tx);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTemplateClick = async (optionTemplate) => {
    setTemplate(optionTemplate);
  };

  return (
    <OuterContainer>
      <InnerContainer>
        <Formik
          enableReinitialize={true}
          initialValues={{
            asset: template.asset,
            strikePrice: template.strikePrice,
            rightToBuy: template.rightToBuy,
            type: 'call',
            expiry: template.expiry,
            collateral: 1,
            premium: template.premium,
            numberOfOptions: 1,
          }}
          validationSchema={Yup.object({
            collateral: Yup.number()
              .min(0.000000001, 'Must deposit atleast 1 gwei')
              .required('Required'),
            strikePrice: Yup.number().required('Required'),
            expiry: Yup.date().required('Required'),
          })}
          onSubmit={(values) => {
            writeOption(values);
          }}
        >
          <Form>
            <InputContainer>
              <StyledSelect label="Asset:" name="asset">
                <option value="eth">$ETH</option>
                <option value="atom">$ATOM</option>
                <option value="btc">$BTC</option>
                <option value="link">$LINK</option>
                <option value="matic">$MATIC</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <StyledSelect label="Type:" name="type">
                <option value="call">CALL</option>
                <option value="put">PUT</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Strike Price:"
                name="strikePrice"
                type="number"
                placeholder="3500"
              />
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Right to buy (in Asset):"
                name="rightToBuy"
                type="number"
                placeholder="1"
              />
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Expiry Date:"
                name="expiry"
                type="date"
                placeholder=""
              />
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Your Collateral (ETH):"
                name="collateral"
                type="number"
                placeholder="1"
              />
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Premium (ETH):"
                name="premium"
                type="number"
                placeholder="1"
              />
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Number of options:"
                name="numberOfOptions"
                type="number"
                placeholder="1"
              />
            </InputContainer>
            <Button type="submit">Write Option</Button>
          </Form>
        </Formik>
      </InnerContainer>
      <Templates>
        <h3>Call Templates</h3>
        <OptionsHeader>
          <span>Asset</span>
          <span>Strike Price</span>
          <span>Right to buy</span>
          <span>Expiry</span>
          <span>Premium</span>
        </OptionsHeader>
        {optionTemplates.map((optionTemplate) => {
          return (
            <Option
              onClick={() => handleTemplateClick(optionTemplate)}
              key={optionTemplate.asset + optionTemplate.strikePrice}
            >
              <span>
                <img src={optionTemplate.img} />
                {optionTemplate.priceFeed}
              </span>
              <span>{optionTemplate.strikePrice}</span>
              <span>
                {optionTemplate.rightToBuy} {optionTemplate.asset.toUpperCase()}
              </span>
              <span>{optionTemplate.expiry}</span>
              <span>{optionTemplate.premium} ETH</span>
            </Option>
          );
        })}

        <h3>Put Templates</h3>
        <OptionsHeader>
          <span>Asset</span>
          <span>Strike Price</span>
          <span>Right to buy</span>
          <span>Expiry</span>
          <span>Premium</span>
        </OptionsHeader>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/931ba23b-1755-46be-a466-73af2fcafaf1_ICON_SOL.png?auto=compress,format" />
            SOL/USD
          </span>
          <span>$500</span>
          <span>1000 SOL</span>
          <span>2024-01-01</span>
          <span>1 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://data-chain-link.cdn.prismic.io/data-chain-link/ad14983c-eec5-448e-b04c-d1396e644596_LINK.svg" />
            LINK/USD
          </span>
          <span>$30</span>
          <span>100 LINK</span>
          <span>2023-01-01</span>
          <span>1 ETH</span>
        </Option>
        <Option>
          <span>
            <img src="https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format" />
            AVAX/USD
          </span>
          <span>$300</span>
          <span>10 AVAX</span>
          <span>2023-06-14</span>
          <span>0.2 ETH</span>
        </Option>
      </Templates>
    </OuterContainer>
  );
}

const Templates = styled.div`
  width: 90%;
  /* margin: 10px; */
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin-bottom: 20px;

  h3 {
    margin-bottom: 5px;
  }
`;

const OptionsHeader = styled.div`
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  justify-content: space-between;
  align-items: center;
  /* border: 1px solid #ecedef; */
  border-radius: 6px;
  cursor: pointer;
  /* box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32); */

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const Option = styled.div`
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ecedef;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32);

  img {
    width: 19px;
    height: 19px;
  }

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :hover {
    background: #fafafa;
  }
`;

const OuterContainer = styled.div`
  padding: 30px;
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  /* height: 100vh; */
  color: black;
  gap: 25px;

  @media screen and (max-width: 1100px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const StyledInput = styled.input`
  display: block;
  margin: 10px 0px;
  padding: 5px;
  border: 1px solid lightblue;
  border-radius: 3px;
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ecedef;
  border-radius: 6px;
  box-shadow: 0 8px 24px -16px rgba(12, 22, 44, 0.32);
  padding: 25px;
  font-size: 120%;
  min-width: 400px;
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

  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
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

const StyledSelect = styled(MySelect)`
  margin: 10px 0px;
  padding: 3px;
  padding-right: 10px;
  font-size: 15px;
  background-color: white;
  border: 1px solid lightblue;
  border-radius: 3px;
`;
