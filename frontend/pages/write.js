import React from 'react';
import { useEffect } from 'react';
import { Formik, Form, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';

import { fuji } from '../utils/addresses';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';

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

const DisabledTextInput = ({ label, ...props }) => {
  const {
    values: { writerOdds },
    setFieldValue,
  } = useFormikContext();
  const [field, meta] = useField(props);

  useEffect(() => {
    setFieldValue(props.name, calculateOtherOdds(writerOdds));
  }, [writerOdds]);

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

const calculateOtherOdds = (x) => {
  return x === 1 ? 1 : x / (x - 1);
};

export default function Write() {
  // const woptionFactoryAddress = '0x97F8B3dDEF6C4bCB678dD85c1f04AD01A4506B9B';

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

  return (
    <OuterContainer>
      <InnerContainer>
        <Formik
          initialValues={{
            asset: 'eth',
            strikePrice: 2500,
            rightToBuy: 1,
            type: 'call',
            writerOdds: 2.0,
            buyerOdds: 2.0,
            expiry: '',
            collateral: 1,
            premium: 1,
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
    </OuterContainer>
  );
}

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  h3 {
    margin: 5px;
  }
  p {
    margin: 3px;
    font-size: 16px;
  }
`;

const OuterContainer = styled.div`
  padding-top: 30px;
  display: flex;
  justify-content: center;
  align-items: start;
  /* height: 100vh; */
  color: black;
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
  border: 1px solid #b9b9b9;
  padding: 25px;
  font-size: 120%;
`;

const Button = styled.button`
  background-color: #0f6cf7;
  opacity: 75%;
  color: white;
  margin-top: 20px;
  padding: 9px 25px;
  font-size: 100%;
  border-radius: 3px;
  width: 100%;
  border: none;
  outline: none;
  cursor: pointer;
  :hover {
    opacity: 100%;
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
