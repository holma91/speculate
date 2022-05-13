import React from 'react';
import regeneratorRuntime from 'regenerator-runtime'; // because of "ReferenceError: regeneratorRuntime is not defined"
import styled from 'styled-components';
import BuyNFT from '../../components/BuyNFT';
import pairs from '../../data/pairs';
import Table, { SelectColumnFilter } from '../../components/Table';

export default function Options() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'pair',
        accessor: 'pair',
        // Cell: AvatarCell,
        addressAccessor: 'pairAddress',
      },
      {
        Header: 'liquidity',
        accessor: 'liquidityUsd',
      },
      {
        Header: 'dex',
        accessor: 'dex',
        Filter: SelectColumnFilter,
        filter: 'includes',
        startValueFilter: 'all dexes',
      },
      {
        Header: 'chain',
        accessor: 'chain',
        Filter: SelectColumnFilter,
        filter: 'includes',
        startValueFilter: 'all chains',
      },
      {
        Header: 'token0',
        accessor: 'token0Name',
      },
      {
        Header: 'token1',
        accessor: 'token1Name',
      },
      {
        Header: 'created at (utc)',
        accessor: 'createdAt',
        id: 'createdAt',
      },
      {
        Header: 'block explorer',
        accessor: 'blockExplorerUrl',
        isLink: true,
      },
      {
        Header: 'chart',
        accessor: 'dexscreenerUrl',
        isLink: true,
      },
    ],
    []
  );

  const initialState = {
    sortBy: [
      {
        id: 'createdAt',
        desc: true,
      },
    ],
    pageSize: 10,
  };

  return (
    <div className="col-span-4 m-5">
      sup
      <Table columns={columns} data={pairs} initialState={initialState} />
    </div>
  );
}
