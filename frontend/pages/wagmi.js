import { useRef, useState } from 'react';
import {
  useSendTransaction,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
} from 'wagmi';
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
  const tx = useSendTransaction({
    request: {
      to: 'backe.eth',
      value: ethers.BigNumber.from('10000000000000000'), // 0.01 ETH
    },
  });

  const wethContract = useContractWrite(
    {
      addressOrName: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      contractInterface: wethABI,
    },
    'deposit',
    {
      overrides: { value: ethers.BigNumber.from('100000000000000000') },
    }
  );

  const waitForTransaction = useWaitForTransaction({
    hash: wethContract.data?.hash,
  });

  const optionContract = useContractRead(
    {
      addressOrName: rinkeby.optionFactory,
      contractInterface: optionFactory.abi,
    },
    'getOptionById',
    {
      args: 1,
    }
  );

  console.log(optionContract.data);

  return (
    <div>
      {tx.isIdle && (
        <Button disabled={tx.isLoading} onClick={() => tx.sendTransaction()}>
          Send Transaction
        </Button>
      )}
      {tx.isLoading && <div>Check Wallet</div>}
      {tx.isSuccess && <div>Transaction: {JSON.stringify(tx.data)}</div>}
      {tx.isError && <div>Error sending transaction</div>}
      {wethContract.isLoading ? (
        <Button>loading...</Button>
      ) : waitForTransaction.isLoading ? (
        <Button>pending...</Button>
      ) : (
        <Button
          disabled={wethContract.isLoading}
          onClick={() =>
            wethContract.write({
              overrides: { value: ethers.BigNumber.from('5000000000000000') },
            })
          }
        >
          write
        </Button>
      )}
      <Button
        onClick={() =>
          optionContract.refetch({ args: Math.floor(Math.random() * 20) })
        }
      >
        getOption
      </Button>
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
