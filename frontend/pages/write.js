import React from 'react';
import { useEffect } from 'react';
import { Formik, Form, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { ethers } from 'ethers';
import styled from 'styled-components';

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
};

const calculateOtherOdds = (x) => {
  return x === 1 ? 1 : x / (x - 1);
};

export default function Write() {
  // const woptionFactoryAddress = '0x97F8B3dDEF6C4bCB678dD85c1f04AD01A4506B9B';

  const writeWoption = async (values) => {
    try {
      const { ethereum } = window;
      console.log(values);

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const woptionsFactory = new ethers.Contract(
          woptionFactoryAddress,
          woptionFactory.abi,
          signer
        );

        const priceFeedAddress =
          priceFeeds.RINKEBY[values.asset.toUpperCase()].USD;

        const priceFeed = new ethers.Contract(
          priceFeedAddress,
          AggregatorV3Interface.abi,
          signer
        );
        const priceFeedDecimals = await priceFeed.decimals();

        const woption = {
          priceFeedAddress,
          tokenizerAddress,
          strikePrice: ethers.utils.parseUnits(
            values.strikePrice.toString(),
            priceFeedDecimals
          ),
          expiry: new Date(values.expiry).getTime() / 1000,
          over: values.prediction === 'over',
          overOdds:
            values.prediction === 'over'
              ? ethers.utils.parseUnits(values.writerOdds.toString(), 6)
              : ethers.utils.parseUnits(values.buyerOdds.toString(), 6),
          underOdds:
            values.prediction === 'over'
              ? ethers.utils.parseUnits(values.buyerOdds.toString(), 6)
              : ethers.utils.parseUnits(values.writerOdds.toString(), 6),
        };

        console.log(woption);
        const dep = ethers.utils.parseEther(values.deposit.toString());

        const x = await woptionsFactory.createWoption(
          ...Object.values(woption),
          {
            value: dep,
            gasLimit: 3000000,
          }
        );
        console.log(x);
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
            prediction: 'over',
            writerOdds: 2.0,
            buyerOdds: 2.0,
            expiry: '',
            deposit: 1,
          }}
          validationSchema={Yup.object({
            writerOdds: Yup.number()
              .min(1, "Odds can't be below 1")
              .required('Required'),
            buyerOdds: Yup.number()
              .min(1, "Odds can't be below 1")
              .required('Required'),
            deposit: Yup.number()
              .min(0.000000001, 'Must deposit atleast 1 gwei')
              .required('Required'),
            strikePrice: Yup.number().required('Required'),
            expiry: Yup.date().required('Required'),
          })}
          onSubmit={(values) => {
            writeWoption(values);
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
              <MyTextInput
                label="Strike Price:"
                name="strikePrice"
                type="number"
                placeholder="3500"
              />
            </InputContainer>
            <InputContainer>
              <StyledSelect label="Prediction:" name="prediction">
                <option value="over">OVER</option>
                <option value="under">UNDER</option>
              </StyledSelect>
            </InputContainer>
            <InputContainer>
              <MyTextInput
                label="Writer Odds:"
                name="writerOdds"
                type="number"
                placeholder="2.00"
              />
            </InputContainer>
            <InputContainer>
              <DisabledTextInput
                label="Buyer Odds:"
                name="buyerOdds"
                type="number"
                placeholder="2.00"
                disabled
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
                label="Your Deposit:"
                name="deposit"
                type="number"
                placeholder="1"
              />
            </InputContainer>

            <Button type="submit">Write Woption</Button>
          </Form>
        </Formik>
      </InnerContainer>
    </OuterContainer>
  );
}

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
