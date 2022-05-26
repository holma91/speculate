import { useState, useEffect, useMemo } from 'react';
import {
  useAccount,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  useNetwork,
} from 'wagmi';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
// WARNING: IF THE LINE BELOW IS REMOVED IT WONT COMPILE,
// because of "ReferenceError: regeneratorRuntime is not defined"
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import styled from 'styled-components';
import Table, {
  SelectColumnFilter,
  StatusPill,
  AvatarCell,
} from '../components/Table';
import { rinkeby, binanceTest, zeroAddress } from '../utils/addresses';
import { NormalView, NFTView } from '../components/OptionViews';
import SpeculateExchange from '../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import OptionFactory from '../../contracts/out/OptionFactory.sol/OptionFactory.json';
import { moralisMapping } from '../utils/misc';

const getShorts = () => {
  const data = [
    {
      asset: 'eth',
      priceFeed: 'ETH/USD',
      type: 'call',
      strikePrice: '$2000',
      rightToBuy: 1,
      expiry: '2023-01-01',
      premium: '1 ETH',
      collateral: 1,
      numberOfOptions: 1,
      filled: '80%',
      CL: 'COVERED',
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/7e81db43-5e57-406d-91d9-6f2df24901ca_ETH.svg',
    },
    {
      asset: 'btc',
      priceFeed: 'BTC/USD',
      type: 'call',
      strikePrice: '$30000',
      rightToBuy: 2,
      expiry: '2023-01-01',
      premium: '1 ETH',
      collateral: 1,
      numberOfOptions: 1,
      filled: '100%',
      CL: '190%',
      img: 'https://prismic-io.s3.amazonaws.com/data-chain-link/19a58483-b100-4d09-ab0d-7d221a491090_BTC.svg',
    },
    {
      asset: 'avax',
      priceFeed: 'AVAX/USD',
      type: 'put',
      strikePrice: '$40',
      rightToBuy: 5,
      expiry: '2023-01-01',
      premium: '0.25 ETH',
      collateral: 1,
      numberOfOptions: 1,
      filled: '30%',
      CL: '150%',
      img: 'https://images.prismic.io/data-chain-link/63137341-c4d1-4825-b284-b8a5a8436d15_ICON_AVAX.png?auto=compress,format',
    },
    {
      asset: 'link',
      priceFeed: 'LINK/USD',
      type: 'call',
      strikePrice: '$5',
      rightToBuy: 3,
      expiry: '2023-01-01',
      premium: '0.15 ETH',
      collateral: 1,
      numberOfOptions: 1,
      filled: '25%',
      CL: '120%',
      img: 'https://data-chain-link.cdn.prismic.io/data-chain-link/ad14983c-eec5-448e-b04c-d1396e644596_LINK.svg',
    },
  ];
  return [...data, ...data, ...data];
};

export default function Positions({ allPositions }) {
  const { activeChain } = useNetwork();
  const { data: activeAccount, isError, isLoading } = useAccount();
  const router = useRouter();
  const [makerAsks, setMakerAsks] = useState([]);
  const [makerBids, setMakerBids] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [view, setView] = useState('longs');
  const [clickedPosition, setClickedPosition] = useState(null);
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  const isApprovedForAllFunc = useContractRead(
    {
      addressOrName: rinkeby.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'isApprovedForAll',
    {
      args: [
        activeAccount ? activeAccount.address : zeroAddress,
        rinkeby.transferManagerERC721,
      ],
    }
  );

  const setApprovalFunc = useContractWrite(
    {
      addressOrName: rinkeby.optionFactory,
      contractInterface: OptionFactory.abi,
    },
    'setApprovalForAll'
  );

  const waitForSetApprovalFunc = useWaitForTransaction({
    hash: setApprovalFunc.data?.hash,
    onSuccess(data) {
      // necessary to make approve button disappear after approval
      isApprovedForAllFunc.refetch();
    },
  });

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

    if (activeAccount && activeChain) {
      const chain = moralisMapping[activeChain.name.toLowerCase()];
      let url = '';
      if (!allPositions) {
        url = `https://deep-index.moralis.io/api/v2/${activeAccount.address}/nft/${rinkeby.optionFactory}?chain=${chain}&format=decimal`;
      } else {
        url = `https://deep-index.moralis.io/api/v2/nft/${rinkeby.optionFactory}?chain=${chain}&format=decimal`;
      }

      let response = await fetch(url, {
        headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
      });

      response = await response.json();
      const receivedNFTs = response.result;

      if (!receivedNFTs) return;

      for (const nft of receivedNFTs) {
        if (!nft.token_uri) {
          console.log("moralis can't find token_uri! for", nft);
          // set dummy metadata?
          continue;
        }
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

      setNfts(filteredNFTs);
    } else {
      console.log('connect with your wallet!');
    }
  };

  useEffect(() => {
    getNfts();
  }, [makerAsks, makerBids]);

  useEffect(() => {
    const setUpMakerOrders = async () => {
      const responseMakerAsks = await fetch('http://localhost:3001/makerAsks/');
      const responseMakerBids = await fetch('http://localhost:3001/makerBids/');
      let makerAsks = await responseMakerAsks.json();
      let makerBids = await responseMakerBids.json();

      setMakerAsks(makerAsks);
      setMakerBids(makerBids);
    };
    setUpMakerOrders();
  }, []);

  const longColumns = useMemo(
    () => [
      {
        Header: 'Asset',
        accessor: 'asset',
        Cell: AvatarCell,
        imgAccessor: 'assetImg',
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
  const shortColumns = useMemo(
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
        // Cell: StatusPill,
      },
      {
        Header: 'Expiry',
        accessor: 'expiry',
      },
      {
        Header: 'Premium',
        accessor: 'premium',
        // Filter: SelectColumnFilter, // new
        // filter: 'includes', // new
      },
      {
        Header: 'Filled',
        accessor: 'filled',
        // Filter: SelectColumnFilter, // new
        // filter: 'includes', // new
      },
      {
        Header: 'CL',
        accessor: 'CL',
      },
    ],
    []
  );

  const longs = useMemo(() => getLongs(), [nfts]);
  const shorts = useMemo(() => getShorts(), []);

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
    router.push(`options/${position.id}`);
  };

  const acceptOffer = async (collectionAddress, collectionId) => {
    if (activeAccount) {
      console.log('hey');
    } else {
      console.log('ethereum object not found');
    }
  };

  return (
    <OuterContainer>
      <InnerContainer>
        <Header>
          <p>backe.eth</p>
          <p>0x30...4d02</p>
          <div>
            {isApprovedForAllFunc && !isApprovedForAllFunc.data && !isSSR ? (
              <>
                {setApprovalFunc.isLoading ? (
                  <Button type="button">Loading...</Button>
                ) : waitForSetApprovalFunc.isLoading ? (
                  <Button type="button">Pending...</Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() =>
                      setApprovalFunc.write({
                        args: [rinkeby.transferManagerERC721, true],
                      })
                    }
                  >
                    Approve NFT spending
                  </Button>
                )}
              </>
            ) : null}
          </div>
          <Menu>
            <ViewDiv
              onClick={() => setView('longs')}
              clicked={view === 'longs'}
            >
              <p>longs</p>
            </ViewDiv>
            <ViewDiv
              onClick={() => setView('shorts')}
              clicked={view === 'shorts'}
            >
              <p>shorts</p>
            </ViewDiv>
            <ViewDiv
              onClick={() => setView('longs-nft')}
              clicked={view === 'longs-nft'}
            >
              <p>longs as NFTs</p>
            </ViewDiv>
            <ViewDiv>
              <p>shorts as NFTs</p>
            </ViewDiv>
          </Menu>
        </Header>
        {view === 'longs' ? (
          <Table
            columns={longColumns}
            data={longs}
            initialState={initialState}
            clickedPosition={clickedPosition}
            onClickedPosition={onClickedPosition}
          />
        ) : view === 'shorts' ? (
          <Table
            columns={shortColumns}
            data={shorts}
            initialState={initialState}
            clickedPosition={clickedPosition}
            onClickedPosition={onClickedPosition}
          />
        ) : (
          <NFTView
            nfts={nfts}
            listOption={() => {
              console.log('list!');
            }}
            acceptOffer={acceptOffer}
          />
        )}
      </InnerContainer>
    </OuterContainer>
  );
}

const Button = styled.button`
  background-color: #0e76fd;
  color: white;
  margin-top: 10px;
  margin-right: 10px;
  margin-left: 0;
  padding: 9px 25px;
  font-size: 100%;
  font-weight: 700;
  border-radius: 12px;
  /* width: 50%; */
  border: none;
  outline: none;
  cursor: pointer;

  /* box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); */
  :hover {
    transform: scale(1.01) perspective(1px);
  }
`;

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
  max-width: 75rem; // max-w-4xl
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
