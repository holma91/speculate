import React from 'react';
import { useFormik } from 'formik';
import styled from 'styled-components';

import { Formik, Form, useField, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { optionTemplates } from '../data/optionTemplates';

const Write = () => {
  const [template, setTemplate] = React.useState(optionTemplates[0]);
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

  const writeOption = async (values) => {
    console.log(values);
  };

  console.log(formik);
  return (
    <Container>
      <form onSubmit={formik.handleSubmit}>
        <InputContainer>
          <label htmlFor="asset">Asset: </label>
          <StyledSelect id="asset" {...formik.getFieldProps('asset')}>
            <option value="eth">$ETH</option>
            <option value="atom">$ATOM</option>
            <option value="btc">$BTC</option>
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
          <label htmlFor="rightToBuy">Strike Price: </label>
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

        <Button type="submit">Write Option</Button>
      </form>
      <div>asset: {formik.values.asset}</div>
    </Container>
  );
};

export default Write;

const Container = styled.div`
  margin: 20px;
  form {
    display: flex;
    flex-direction: column;
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
