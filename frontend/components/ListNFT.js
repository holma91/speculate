import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import SpeculateExchange from '../../contracts/out/SpeculateExchange.sol/SpeculateExchange.json';
import { fuji } from '../utils/addresses';

export default function ListNFT() {
  const [exchangeContract, setExchangeContract] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [makerAsks, setMakerAsks] = useState([]);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    // this useEffect should listen to address changes
    const { ethereum } = window;
    if (ethereum) {
      setCurrentAddress(ethereum.selectedAddress);
    } else {
      console.log('ethereum object not found');
    }
  });

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
        parsedMakerAsks[
          `${parsedMakerAsk.signer}:${
            parsedMakerAsk.collection
          }:${parsedMakerAsk.tokenId.toString()}`
        ] = parsedMakerAsk;
        console.log(parsedMakerAsks);
        setMakerAsks(parsedMakerAsks);
      }
    };

    const getNfts = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const chain = 'avalanche%20testnet';
        const url = `https://deep-index.moralis.io/api/v2/${ethereum.selectedAddress}/nft?chain=${chain}&format=decimal`;
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
  }, [currentAddress]);

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
              {makerAsks[
                `${nft.owner_of}:${nft.token_address}:${nft.token_id}`
              ] ? (
                <>
                  <ListedImage src={nft.metadata.image} alt={`ugly nft`} />
                  <ListedButton>Listed</ListedButton>
                </>
              ) : (
                <>
                  <ListImage src={nft.metadata.image} alt={`ugly nft`} />
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
`;

const ListImage = styled.img`
  width: 300px;
  height: 250px;
  object-fit: cover;
`;

const ListedImage = styled.img`
  opacity: 50%;
  width: 300px;
  height: 250px;
  object-fit: cover;
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

const ListedButton = styled.button`
  background-color: #0f6cf7;
  opacity: 50%;
  color: white;
  padding: 8px 15px;
  font-size: 100%;
  /* border-radius: 3px; */
  min-width: 50px;
  border: none;
  outline: none;
`;
