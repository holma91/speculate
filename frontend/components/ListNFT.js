import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

export default function ListNFT() {
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const getNfts = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const web3 = createAlchemyWeb3(process.env.ALCHEMY_RINKEBY_RPC);

        // The wallet address we want to query for NFTs:
        const ownerAddr = ethereum.selectedAddress;
        const fetchedNfts = await web3.alchemy.getNfts({
          owner: ownerAddr,
        });

        console.log(fetchedNfts.ownedNfts);

        setNfts(fetchedNfts.ownedNfts);
      } else {
        console.log('ethereum object not found');
      }
    };

    getNfts();
  }, []);

  return (
    <Container>
      <h1>your nfts</h1>
      <NFTContainer>
        {nfts.map((nft) => {
          return (
            <NFTCard key={Math.random() * 10}>
              <img src={nft.metadata.image} alt={`ugly nft`} />
              <ListButton>List</ListButton>
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
