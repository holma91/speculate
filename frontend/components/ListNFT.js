import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SpeculateExchange from '../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import { fuji } from '../utils/addresses';

export default function ListNFT() {
  const [exchangeContract, setExchangeContract] = useState(null);
  const [makerAsks, setMakerAsks] = useState([]);
  const [makerBids, setMakerBids] = useState([]);
  const [nfts, setNfts] = useState([]);

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
        const allNfts = receivedNFTs.map((nft) => {
          let listed = false;
          let listPrice = '';
          let bidded = false;
          let highestBid = 'no offer';
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

  const listNFT = async (collectionAddress, collectionId) => {
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

  return (
    <Container>
      <h1>your nfts</h1>
      <NFTContainer>
        {nfts.map((nft) => {
          return nft.metadata && nft.metadata.image ? (
            <NFTCard key={Math.random() * 10}>
              {nft.listed ? (
                <>
                  <ListImage src={nft.metadata.image} alt={`ugly nft`} />
                  <Price>{nft.listPrice}</Price>
                  <Offer>
                    <p>{nft.highestBid}</p>
                    <p className="accept">Accept Offer</p>
                  </Offer>
                  <ListButton
                    onClick={() => listNFT(nft.token_address, nft.token_id)}
                  >
                    Re-List
                  </ListButton>
                </>
              ) : (
                <>
                  <ListImage src={nft.metadata.image} alt={`ugly nft`} />
                  <Price>unlisted</Price>
                  <Offer>
                    <p>{nft.highestBid}</p>
                    <p className="accept">Accept Offer</p>
                  </Offer>
                  <ListButton
                    onClick={() => listNFT(nft.token_address, nft.token_id)}
                  >
                    List
                  </ListButton>
                </>
              )}
            </NFTCard>
          ) : null;
        })}
      </NFTContainer>
    </Container>
  );
}

const Price = styled.div`
  padding: 10px;
  /* padding: 5px; */
  border-bottom: 1px solid #b9b9b9;
`;

const Offer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px;
  p {
    margin: 0;
  }

  .accept:hover {
    color: #16b857;
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const NFTContainer = styled.div`
  /* width: 100%; */
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const NFTCard = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 1px solid #b9b9b9;

  .accept {
    opacity: 0;
  }

  :hover {
    /* border: 1px solid black; */
    background: #f6f4f4;
    .accept {
      opacity: 100%;
    }
  }
`;

const ListImage = styled.img`
  width: 275px;
  height: 275px;
  object-fit: cover;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px; ;
`;

const ListButton = styled.button`
  margin: 7.5px;
  background-color: #0f6cf7;
  opacity: 75%;
  color: white;
  padding: 8px 15px;
  font-size: 100%;
  border-radius: 5px;

  min-width: 50px;
  border: none;
  outline: none;
  cursor: pointer;
  :hover {
    opacity: 100%;
  }
`;
