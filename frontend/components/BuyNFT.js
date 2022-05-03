import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SpeculateExchange from '../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import { fuji } from '../utils/addresses';

export default function BuyNFT() {
  const [exchangeContract, setExchangeContract] = useState(null);
  const [makerAsks, setMakerAsks] = useState([]);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const setUpExchange = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          fuji.speculateExchange,
          SpeculateExchange.abi,
          signer
        );
        setExchangeContract(contract);
        return contract;
      } else {
        console.log('ethereum object not found');
      }
    };

    const getMakerOrders = async (contract) => {
      const { ethereum } = window;
      if (ethereum) {
        const makerAsks = await contract.getMakerAsks();
        // key is collection + id (is a UID)
        const parsedMakerAsks = {};
        for (const makerAsk of makerAsks) {
          const parsedMakerAsk = {
            isOrderAsk: makerAsk.isOrderAsk,
            signer: makerAsk.signer.toLowerCase(),
            collection: makerAsk.collection.toLowerCase(),
            price: makerAsk.price,
            tokenId: makerAsk.tokenId,
            amount: makerAsk.amount,
            strategy: makerAsk.strategy,
            currency: makerAsk.currency,
            startTime: makerAsk.startTime,
            endTime: makerAsk.endTime,
          };
          if (parsedMakerAsk.signer !== ethereum.selectedAddress) {
            parsedMakerAsks[
              `${
                parsedMakerAsk.collection
              }:${parsedMakerAsk.tokenId.toString()}`
            ] = parsedMakerAsk;
          }
          console.log(parsedMakerAsks);
          setMakerAsks(parsedMakerAsks);
        }
      } else {
        console.log("can't find the ethereum object");
      }
    };

    const getNfts = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const chain = 'avalanche%20testnet';
        const url = `https://deep-index.moralis.io/api/v2/nft/${fuji.nftCollection}?chain=${chain}&format=decimal`;
        let response = await fetch(url, {
          headers: { 'X-API-Key': process.env.MORALIS_API_KEY },
        });

        response = await response.json();
        const allNfts = response.result.map((nft) => {
          return { ...nft, metadata: JSON.parse(nft.metadata) };
        });

        console.log(allNfts);

        setNfts(allNfts);
      } else {
        console.log('ethereum object not found');
      }
    };

    const setup = async () => {
      let speculateExchangeContract = await setUpExchange();
      await getMakerOrders(speculateExchangeContract);
      await getNfts();
    };

    setup();
  }, []);

  return (
    <Container>
      <h1>buy nfts</h1>
      <NFTContainer>
        {nfts.map((nft) => {
          return (
            <NFTCard key={Math.random() * 10}>
              {makerAsks[`${nft.token_address}:${nft.token_id}`] ? (
                <>
                  <img src={nft.metadata.image} alt={`ugly nft`} />
                  <ListButton>buy</ListButton>
                </>
              ) : null}
            </NFTCard>
          );
        })}
      </NFTContainer>
    </Container>
  );
}

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
  display: flex;
  flex-direction: column;

  img {
    width: 300px;
    height: 250px;
    /* border-radius: 10px; */
    object-fit: cover;
  }
`;

const ListButton = styled.button`
  background-color: #0f6cf7;
  opacity: 75%;
  color: white;
  padding: 8px 15px;
  font-size: 100%;
  /* border-radius: 3px; */
  min-width: 50px;
  border: none;
  outline: none;
  cursor: pointer;
  :hover {
    opacity: 100%;
  }
`;
