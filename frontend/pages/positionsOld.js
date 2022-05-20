import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SpeculateExchange from '../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import { fuji } from '../utils/addresses';
import { NormalView, NFTView } from '../components/OptionViews';

export default function Positions() {
  const [exchangeContract, setExchangeContract] = useState(null);
  const [makerAsks, setMakerAsks] = useState([]);
  const [makerBids, setMakerBids] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [view, setView] = useState('list');

  useEffect(() => {
    const getNfts = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const chain = 'avalanche%20testnet';
        const url = `https://deep-index.moralis.io/api/v2/${ethereum.selectedAddress}/nft?chain=${chain}&format=decimal`;
        let response = await fetch(url, {
          headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
        });

        response = await response.json();
        const receivedNFTs = response.result;
        if (!receivedNFTs) return;
        const allNfts = receivedNFTs.map((nft) => {
          console.log(nft.contract_type);
          let listed = false;
          let listPrice = '';
          let bidded = false;
          let highestBid = '';
          if (
            makerAsks[nft.token_address] &&
            makerAsks[nft.token_address][nft.token_id]
          ) {
            listed = true;
            listPrice = ethers.utils.formatEther(
              makerAsks[nft.token_address][nft.token_id].price
            );
          }

          if (
            makerBids[nft.token_address] &&
            makerBids[nft.token_address][nft.token_id]
          ) {
            bidded = true;
            highestBid = ethers.utils.formatEther(
              makerBids[nft.token_address][nft.token_id].price
            );
          }

          return {
            ...nft,
            metadata: JSON.parse(nft.metadata),
            listed,
            listPrice,
            bidded,
            highestBid,
          };
        });

        console.log(allNfts);

        setNfts(allNfts);
      } else {
        console.log('ethereum object not found');
      }
    };
    getNfts();
  }, [makerAsks, makerBids]);

  useEffect(() => {
    let contract;
    const onMakerAsk = (
      maker,
      collection,
      tokenId,
      currency,
      strategy,
      amount,
      price
    ) => {
      console.log('MakerAsk received');
      collection = collection.toLowerCase();
      setMakerAsks((prevState) => ({
        ...prevState,
        [collection]: {
          ...prevState[collection],
          [tokenId]: {
            maker: maker.toLowerCase(),
            collection: collection,
            tokenId,
            currency: currency.toLowerCase(),
            strategy: strategy.toLowerCase(),
            amount,
            price,
          },
        },
      }));
    };
    const onMakerBid = (
      maker,
      collection,
      tokenId,
      currency,
      strategy,
      amount,
      price
    ) => {
      console.log('MakerBid received');
      collection = collection.toLowerCase();
      setMakerBids((prevState) => ({
        ...prevState,
        [collection]: {
          ...prevState[collection],
          [tokenId]: {
            maker: maker.toLowerCase(),
            collection: collection,
            tokenId,
            currency: currency.toLowerCase(),
            strategy: strategy.toLowerCase(),
            amount,
            price,
          },
        },
      }));
    };
    const onTakerAsk = (
      taker,
      maker,
      strategy,
      currency,
      collection,
      tokenId,
      amount,
      price
    ) => {
      console.log('TakerAsk received');
      collection = collection.toLowerCase();
      setMakerBids((prevState) => ({
        ...prevState,
        [collection]: {
          ...Object.fromEntries(
            Object.entries(prevState[collection]).filter(
              ([key, _]) => key !== tokenId
            )
          ),
        },
      }));
      setMakerAsks((prevState) => ({
        ...prevState,
        [collection]: {
          ...Object.fromEntries(
            Object.entries(prevState[collection]).filter(
              ([key, _]) => key !== tokenId
            )
          ),
        },
      }));
    };
    const onTakerBid = (
      taker,
      maker,
      strategy,
      currency,
      collection,
      tokenId,
      amount,
      price
    ) => {
      console.log('TakerBid received');
      collection = collection.toLowerCase();
      setMakerBids((prevState) => ({
        ...prevState,
        [collection]: {
          ...Object.fromEntries(
            Object.entries(prevState[collection]).filter(
              ([key, _]) => key !== tokenId
            )
          ),
        },
      }));
      setMakerAsks((prevState) => ({
        ...prevState,
        [collection]: {
          ...Object.fromEntries(
            Object.entries(prevState[collection]).filter(
              ([key, _]) => key !== tokenId
            )
          ),
        },
      }));
    };

    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      contract = new ethers.Contract(
        fuji.speculateExchange,
        SpeculateExchange.abi,
        signer
      );
      setExchangeContract(contract);
      contract.on('MakerAsk', onMakerAsk);
      contract.on('MakerBid', onMakerBid);
      contract.on('TakerAsk', onTakerAsk);
      contract.on('TakerBid', onTakerBid);
    } else {
      console.log('ethereum object not found');
    }

    return () => {
      if (contract) {
        contract.off('MakerAsk', onMakerAsk);
      }
    };
  }, []);

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

  const listOption = async (collectionAddress, collectionId) => {
    const { ethereum } = window;
    if (ethereum) {
      const makerAsk = {
        isOrderAsk: true,
        signer: ethereum.selectedAddress,
        collection: collectionAddress,
        price: ethers.BigNumber.from(ethers.utils.parseEther('0.01')),
        tokenId: collectionId,
        amount: 1,
        strategy: fuji.strategy,
        currency: fuji.wavax,
        startTime: 1651301377,
        endTime: 1660995560,
      };

      let tx = await exchangeContract.createMakerAsk(makerAsk, {
        gasLimit: 500000,
      });
      await tx.wait();
      console.log(tx);
    } else {
      console.log('ethereum object not found');
    }
  };

  const acceptOffer = async (collectionAddress, collectionId) => {
    const { ethereum } = window;
    if (ethereum) {
      const makerBid = await exchangeContract.getMakerBid(
        collectionAddress,
        collectionId
      );
      const parsedMakerBid = {
        isOrderAsk: makerBid.isOrderAsk,
        signer: makerBid.signer,
        collection: makerBid.collection,
        price: makerBid.price,
        tokenId: makerBid.tokenId,
        amount: makerBid.amount,
        strategy: makerBid.strategy,
        currency: makerBid.currency,
        startTime: makerBid.startTime,
        endTime: makerBid.endTime,
      };

      const takerAsk = {
        isOrderAsk: true,
        taker: ethereum.selectedAddress,
        price: makerBid.price,
        tokenId: makerBid.tokenId,
      };

      let tx = await exchangeContract.matchBidWithTakerAsk(
        takerAsk,
        parsedMakerBid,
        {
          gasLimit: 500000,
        }
      );
      await tx.wait();
      console.log(tx);
    } else {
      console.log('ethereum object not found');
    }
  };

  return (
    <Container>
      <h1>your positions</h1>
      <ViewMenu>
        <p onClick={() => setView('list')}>List View</p>
        <p onClick={() => setView('grid')}>Grid View</p>
      </ViewMenu>
      {view === 'list' ? (
        <NormalView
          nfts={nfts}
          listOption={listOption}
          acceptOffer={acceptOffer}
        />
      ) : (
        <NFTView
          nfts={nfts}
          listOption={listOption}
          acceptOffer={acceptOffer}
        />
      )}
    </Container>
  );
}

const ViewMenu = styled.div`
  display: flex;
  gap: 10px;

  p {
    font-size: 20px;
    margin-top: 0;

    :hover {
      color: #0f6cf7;
      cursor: pointer;
    }
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;
