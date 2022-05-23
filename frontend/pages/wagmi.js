import { useRef, useState } from 'react';
import { useSendTransaction, useContractWrite, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { rinkeby } from '../utils/addresses';
import optionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import wethABI from '../../contracts/wethABI.json';

export function readContract() {
  const { data, isError, isLoading } = useContractRead(
    {
      addressOrName: rinkeby.optionFactory,
      contractInterface: optionFactory.abi,
    },
    'getOptionById',
    {
      args: 1,
    }
  );
}

export default function WriteContract() {
  const { txData, isIdle, isErrorTx, isLoadingTx, isSuccess, sendTransaction } =
    useSendTransaction({
      request: {
        to: 'backe.eth',
        value: ethers.BigNumber.from('1000000000000000000'), // 1 ETH
      },
    });

  const { cwData, isErrorCw, isLoadingCw, write } = useContractWrite(
    {
      addressOrName: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      contractInterface: wethABI,
    },
    'deposit',
    {
      overrides: { value: ethers.BigNumber.from('1000000000000000000') },
    }
  );

  return (
    <div>
      {isIdle && (
        <Button disabled={isLoadingTx} onClick={() => sendTransaction()}>
          Send Transaction
        </Button>
      )}
      {isLoadingTx && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(txData)}</div>}
      {isErrorTx && <div>Error sending transaction</div>}
      <button disabled={isLoadingCw} onClick={() => write()}>
        write
      </button>
    </div>
  );
}

export function SendTx() {
  const { data, isIdle, isError, isLoading, isSuccess, sendTransaction } =
    useSendTransaction({
      request: {
        to: 'backe.eth',
        value: ethers.BigNumber.from('1000000000000000000'), // 1 ETH
      },
    });

  return (
    <div>
      {isIdle && (
        <Button disabled={isLoading} onClick={() => sendTransaction()}>
          Send Transaction
        </Button>
      )}
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
      {isError && <div>Error sending transaction</div>}
    </div>
  );
}

const Button = styled.button`
  margin: 20px;
  background-color: #0e76fd;
  color: white;
  padding: 10px 20px;
  font-size: 100%;
  font-weight: 700;
  border-radius: 12px;
  min-width: 100px;
  border: none;
  outline: none;
  cursor: pointer;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  :hover {
    transform: scale(1.03) perspective(1px);
  }
`;
