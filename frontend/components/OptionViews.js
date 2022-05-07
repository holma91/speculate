import styled from 'styled-components';
import { fakeShortOptions, fakeLongOptions } from '../data/fakeOptions';

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 130px);
  gap: 10px;

  padding: 5px;
`;

const Column = styled.div``;

const Option = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: repeat(8, 130px);
  gap: 10px;

  border: 1px solid #b9b9b9;
  border-radius: 3px;
  padding: 8px 10px;

  :hover {
    background: #f6f4f4;
    cursor: pointer;
  }
`;

const OptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    font-weight: 700;
    /* margin: 5px; */
  }
`;

function NormalView({ nfts, listOption, acceptOffer }) {
  return (
    <OptionContainer>
      <p>Shorts</p>
      <Columns>
        <Column>type</Column>
        <Column>underlying</Column>
        <Column>shares</Column>
        <Column>strike price</Column>
        <Column>amount sold</Column>
        <Column>collateral</Column>
        <Column>health ratio</Column>
        <Column>expiry</Column>
      </Columns>
      {fakeShortOptions.map((option) => {
        return (
          <Option key={Math.floor(Math.random() * 1000)}>
            <Column>{option.type}</Column>
            <Column>{option.underlying}</Column>
            <Column>{option.underlyingShares}</Column>
            <Column>${option.strikePrice}</Column>
            <Column>{option.soldAmount}</Column>
            <Column>{option.collateralAsset}</Column>
            <Column>{option.collateralizationRatio}</Column>
            <Column>{option.expiry}</Column>
          </Option>
        );
      })}
      <p>Longs</p>
      <Columns>
        <Column>type</Column>
        <Column>underlying</Column>
        <Column>shares</Column>
        <Column>strike price</Column>
        <Column>bought amount</Column>
        <Column>expiry</Column>
      </Columns>
      {fakeLongOptions.map((option) => {
        return (
          <Option key={Math.floor(Math.random() * 1000)}>
            <Column>{option.type}</Column>
            <Column>{option.underlying}</Column>
            <Column>{option.underlyingShares}</Column>
            <Column>${option.strikePrice}</Column>
            <Column>{option.boughtAmount}</Column>
            <Column>{option.expiry}</Column>
          </Option>
        );
      })}
    </OptionContainer>
  );
}

function NFTView({ nfts, listOption, acceptOffer }) {
  return (
    <NFTContainer>
      {nfts.map((nft) => {
        return nft.metadata && nft.metadata.image ? (
          <NFTCard key={Math.random() * 10}>
            <ListImage src={nft.metadata.image} alt={`ugly nft`} />
            <Price>{nft.listed ? nft.listPrice : 'unlisted'}</Price>
            <Offer>
              <p>{nft.bidded ? nft.highestBid : 'no offer'}</p>
              <p
                className="accept"
                onClick={() => acceptOffer(nft.token_address, nft.token_id)}
              >
                {nft.bidded && 'Accept Offer'}
              </p>
            </Offer>
            <ListButton
              onClick={() => listOption(nft.token_address, nft.token_id)}
            >
              {nft.listed ? 'Re-List' : 'List'}
            </ListButton>
          </NFTCard>
        ) : null;
      })}
    </NFTContainer>
  );
}

const NFTContainer = styled.div`
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

const Price = styled.div`
  padding: 10px;
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

export { NormalView, NFTView };
