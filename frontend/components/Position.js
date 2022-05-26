import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { useNetwork, useAccount } from 'wagmi';
import { aggregatorV3InterfaceABI, priceFeeds } from '../utils/misc';

export default function Position({ clickedPosition }) {
  const { activeChain } = useNetwork();
  const { data: activeAccount, isError, isLoading } = useAccount();

  const [assetPrice, setAssetPrice] = useState(0);

  const {
    asset,
    expiry,
    assetImg,
    premium,
    priceFeed,
    rightToBuy,
    strikePrice,
    type,
    nftImg,
    createdBy,
    owner,
  } = clickedPosition;

  const styleAddress = (address) => {
    return (
      address.substring(0, 5) +
      '...' +
      address.substring(address.length - 3, address.length)
    );
  };

  const getAssetPrice = async () => {
    try {
      if (!asset) {
        return;
      }

      if (activeAccount && activeAccount) {
        const network = activeChain.name.toLowerCase();

        const priceFeedAddress = priceFeeds[network][asset.toLowerCase()].usd;
        const provider = new ethers.providers.Web3Provider(ethereum);

        const priceFeedContract = new ethers.Contract(
          priceFeedAddress,
          aggregatorV3Interface.abi,
          provider
        );

        const decimals = await priceFeedContract.decimals();
        const price = await priceFeedContract.latestRoundData();

        console.log(price);

        setAssetPrice(ethers.utils.formatUnits(price.answer, decimals));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAssetPrice();
  }, [asset]);

  return (
    <OuterContainer>
      <Container>
        <div className="left">
          <StyledImg src={`data:image/svg+xml;utf8,${nftImg}`} />
          <DescriptionBox>
            <p>Description</p>
            <p>Created by {styleAddress(createdBy)}</p>
          </DescriptionBox>
        </div>
        <div className="right">
          <p className="collection-header">ETH Options</p>
          <p className="header">ETH 2000 CALL</p>
          <p className="owned-by">Owned by {styleAddress(owner)}</p>
          {assetPrice > 0 ? `${asset} price: $${assetPrice}` : null}
          <PriceBox>
            <div className="time">
              <p>Sale ends May 23, 2022</p>
            </div>
            <div className="price">
              <span>Buy now price:</span>
              <p>1.47 ETH</p>
              <Button>Buy now</Button>
              <Button>Make offer</Button>
            </div>
          </PriceBox>
          <OfferBox>
            <div className="heading">
              <p>Offers</p>
            </div>
            {/* <SmallTable
              columns={offerColumns}
              data={offers}
              initialState={initialState}
            /> */}
          </OfferBox>
        </div>
      </Container>
    </OuterContainer>
  );
}

const OuterContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const PriceBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #ecedef;
  padding: 15px;
  border-radius: 6px;
  width: 100%;

  .time {
    padding-bottom: 5px;
    border-bottom: 1px solid #ecedef;
  }

  .price {
    span {
      font-size: 14px;
    }

    p {
      margin-top: 5px;
      font-size: 22px;
    }
  }
`;

const OfferBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #ecedef;
  padding: 15px;
  border-radius: 6px;
  width: 100%;

  .heading {
    padding-bottom: 5px;
    border-bottom: 1px solid #ecedef;
  }
`;

const Container = styled.div`
  margin: 20px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  /* align-items: center; */
  gap: 20px;
  max-width: 1200px;

  .left {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .collection-header {
      font-size: 16px;
    }

    .header {
      font-size: 30px;
    }

    .owned-by {
      font-size: 14px;
    }
  }
`;

const DescriptionBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid black;
  border-radius: 6px;
  padding: 10px;
  width: 320px;
`;

const StyledSVG = styled.svg`
  border: 1px solid black;
  border-radius: 6px;
`;

const StyledImg = styled.img`
  border: 1px solid black;
  border-radius: 6px;
  width: 320px;
  height: 320px;
`;

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
