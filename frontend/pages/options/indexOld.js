import { useState, useEffect, useMemo } from 'react';
import {
  useAccount,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
} from 'wagmi';
import { useRouter } from 'next/router';
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
import { rinkeby } from '../../utils/addresses';

function Positions() {
  const { data: activeAccount, isError, isLoading } = useAccount();
  const router = useRouter();
  const [nfts, setNfts] = useState([]);
  const [view, setView] = useState('list-view');
  const [clickedPosition, setClickedPosition] = useState(null);

  const getLongs = () => {
    let processedNfts = nfts.map((nft) => {
      return {
        asset: nft.metadata.attributes[0].value,
        assetImg: `${nft.metadata.attributes[0].value}.svg`,
        strikePrice: nft.metadata.attributes[1].value,
        rightToBuy: nft.metadata.attributes[2].value,
        expiry: nft.metadata.attributes[3].value,
        type: nft.metadata.attributes[4].value,
        id: nft.token_id,
        nftImg: nft.metadata.image,
        createdBy: nft.token_address,
        owner: nft.owner_of,
        price: nft.listed ? nft.listPrice : 'unlisted',
        bid: nft.bidded ? nft.highestBid : 'no bid',
      };
    });
    return processedNfts;
  };

  const getOptions = () => {
    let processedNfts = nfts.map((nft) => {
      return {
        asset: nft.metadata.attributes[0].value,
        img: `${nft.metadata.attributes[0].value}.svg`,
        strikePrice: nft.metadata.attributes[1].value,
        rightToBuy: nft.metadata.attributes[2].value,
        expiry: nft.metadata.attributes[3].value,
        type: nft.metadata.attributes[4].value,
        id: nft.token_id,
      };
    });
    return processedNfts;
  };

  const getNfts = async () => {
    const extraRequest = async (url) => {
      try {
        let response = await fetch(url);
        let metadata = await response.json();
        return metadata;
      } catch (e) {
        console.log(e);
      }
    };

    if (activeAccount) {
      const chain = 'rinkeby';
      const url = `https://deep-index.moralis.io/api/v2/nft/${rinkeby.optionFactory}?chain=${chain}&format=decimal`;
      let response = await fetch(url, {
        headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
      });

      response = await response.json();
      const receivedNFTs = response.result;

      if (!receivedNFTs) return;

      for (const nft of receivedNFTs) {
        if (!nft.metadata) {
          const re = /\/ipfs\/.+metadata.json$/;
          const ipfsString = nft.token_uri.match(re)[0];

          const ipfsUrl = `https://minty.infura-ipfs.io${ipfsString}`;

          let metadata = await extraRequest(ipfsUrl);
          nft.metadata = metadata;
        } else {
          nft.metadata = JSON.parse(nft.metadata);
        }
      }

      let filteredNFTs = receivedNFTs.map((nft) => {
        let listed = false;
        let listPrice = '';
        let bidded = false;
        let highestBid = '';

        if (
          makerAsks[nft.token_address] &&
          makerAsks[nft.token_address][nft.token_id]
        ) {
          // makerAsk exists, nft is listed
          listed = true;
          listPrice = ethers.utils.formatEther(
            makerAsks[nft.token_address][nft.token_id].price
          );
        }

        if (
          makerBids[nft.token_address] &&
          makerBids[nft.token_address][nft.token_id]
        ) {
          // makerBid exists, nft have offer(s)
          bidded = true;
          let max = ethers.BigNumber.from(0);
          for (const bid of makerBids[nft.token_address][nft.token_id]) {
            let cur = ethers.BigNumber.from(bid.price);
            if (cur.gt(max)) {
              max = cur;
            }
          }
          highestBid = ethers.utils.formatEther(max.toString());
        }

        return {
          ...nft,
          listed,
          listPrice,
          bidded,
          highestBid,
        };
      });

      console.log(filteredNFTs);

      setNfts(filteredNFTs);
    } else {
      console.log('connect with your wallet!');
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

  const options = useMemo(() => getOptions(), [nfts]);

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
    router.push(`${pathname}/${position.id}`);
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
