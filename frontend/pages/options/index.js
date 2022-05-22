import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
// WARNING: IF THE LINE BELOW IS REMOVED IT WONT COMPILE,
// because of "ReferenceError: regeneratorRuntime is not defined"
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import styled from 'styled-components';
import Table, {
  SelectColumnFilter,
  StatusPill,
  AvatarCell,
} from '../../components/Table';
import Position from '../../components/Position';

const getOptions = () => {
  const data = [
    {
      asset: 'eth',
      priceFeed: 'ETH/USD',
      type: 'call',
      strikePrice: '$2000',
      rightToBuy: 1,
      expiry: '2023-01-01',
      price: '1 ETH',
      bid: '0.5 ETH',
      numberOfOptions: 1,
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
    },
    {
      asset: 'btc',
      priceFeed: 'BTC/USD',
      type: 'call',
      strikePrice: '$30000',
      rightToBuy: 2,
      expiry: '2023-01-01',
      price: '1 ETH',
      bid: '0.55 ETH',
      numberOfOptions: 1,
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/19a58483-b100-4d09-ab0d-7d221a491090_BTC.svg',
    },
    {
      asset: 'avax',
      priceFeed: 'AVAX/USD',
      type: 'put',
      strikePrice: '$40',
      rightToBuy: 5,
      expiry: '2023-01-01',
      price: '0.25 ETH',
      bid: '0.05 ETH',
      numberOfOptions: 1,
      img: 'https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format',
    },
    {
      asset: 'link',
      priceFeed: 'LINK/USD',
      type: 'call',
      strikePrice: '$5',
      rightToBuy: 3,
      expiry: '2023-01-01',
      price: '0.15 ETH',
      bid: '0.053 ETH',
      numberOfOptions: 1,
      img: 'https://data-chain-link.cdn.prismic.io/data-chain-link/ad14983c-eec5-448e-b04c-d1396e644596_LINK.svg',
    },
  ];
  return [...data, ...data, ...data];
};

function Positions() {
  const router = useRouter();
  const [nfts, setNfts] = useState([]);
  const [view, setView] = useState('list-view');
  const [clickedPosition, setClickedPosition] = useState(null);

  const getNfts = async () => {
    const { ethereum } = window;
    if (ethereum) {
      // const chain = 'avalanche%20testnet';
      const chain = 'rinkeby';
      const url = `https://deep-index.moralis.io/api/v2/${ethereum.selectedAddress}/nft?chain=${chain}&format=decimal`;
      let response = await fetch(url, {
        headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
      });

      response = await response.json();
      const receivedNFTs = response.result;

      console.log(receivedNFTs);

      // setNfts(allNfts);
    } else {
      console.log('ethereum object not found');
    }
  };

  useEffect(() => {
    getNfts();
  }, []);

  const optionColumns = useMemo(
    () => [
      {
        Header: 'Asset',
        accessor: 'asset',
        Cell: AvatarCell,
        imgAccessor: 'img',
      },
      {
        Header: 'Type',
        accessor: 'type',
      },
      {
        Header: 'Strike Price',
        accessor: 'strikePrice',
      },
      {
        Header: 'Amount',
        accessor: 'rightToBuy',
      },
      {
        Header: 'Expiry',
        accessor: 'expiry',
      },
      {
        Header: 'Price',
        accessor: 'price',
      },
      {
        Header: 'Bid',
        accessor: 'bid',
      },
    ],
    []
  );

  const options = useMemo(() => getOptions(), []);

  const initialState = {
    sortBy: [
      {
        id: 'expiry',
        desc: true,
      },
    ],
    pageSize: 10,
  };

  const onClickedPosition = (position) => {
    console.log(position);
    const { pathname } = router;
    router.push(`/${pathname}/${position.asset}`);
  };

  return (
    <OuterContainer>
      <InnerContainer>
        <Header>
          <h2>Available Options</h2>
          <Menu>
            <ViewDiv
              onClick={() => setView('list-view')}
              clicked={view === 'list-view'}
            >
              <p>Normal View</p>
            </ViewDiv>
            <ViewDiv
              onClick={() => setView('nft-view')}
              clicked={view === 'nft-view'}
            >
              <p>NFT View</p>
            </ViewDiv>
          </Menu>
        </Header>
        {view === 'list-view' ? (
          <Table
            columns={optionColumns}
            data={options}
            initialState={initialState}
            onClickedPosition={onClickedPosition}
          />
        ) : (
          <p>nft view</p>
        )}
      </InnerContainer>
    </OuterContainer>
  );
}

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Menu = styled.div`
  margin: 10px 0;
  border: 1px solid rgb(229 231 235);
  display: flex;
  /* gap: 30px; */
`;

const ViewDiv = styled.div`
  padding: 15px 20px;
  height: 100%;
  border-bottom: ${(props) =>
    props.clicked ? '2px solid #0e76fd' : '2px solid white'};

  cursor: pointer;
  :hover {
    background-color: ${(props) => (props.clicked ? 'white' : '#fafafa')};
    border-bottom: ${(props) =>
      props.clicked ? '2px solid #0e76fd' : '2px solid #fafafa'};
  }
`;

const OuterContainer = styled.div`
  min-height: 100vh; // min-h-screen
  /* background-color: rgb(243 244 246); // bg-gray-100 */
  color: rgb(17 24 39); // text-gray-900
`;

const InnerContainer = styled.main`
  max-width: 70rem; // max-w-4xl
  margin: 0 auto; // mx-auto
  padding-left: 1rem; // px-4
  padding-right: 1rem; // px-4
  // sm:px-6
  // lg:px-8
  padding-top: 1rem; // pt-4

  h1 {
    font-size: 1.25rem; // text-xl
    line-height: 1.75rem; // text-xl
    font-weight: 600; // font-semibold
  }

  .mt-4 {
    margin-top: 1rem; // mt-4
  }
`;

export default Positions;
