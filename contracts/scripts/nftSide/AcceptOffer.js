const ethers = require('ethers');
const SpeculateExchange = require('../../out/SpeculateExchange.sol/SpeculateExchange.json');
const { ADDRESS3, ADDRESS2, mumbai, rinkeby, fuji } = require('../addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const takerAskPrice = ethers.BigNumber.from(ethers.utils.parseEther('0.07'));

  const speculateExchange = factory.attach(rinkeby.speculateExchange);

  const makerBid = await speculateExchange.getMakerBid(
    rinkeby.optionFactory,
    23,
    ADDRESS3
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
    underlyingPriceFeed: makerBid.underlyingPriceFeed,
    underlyingPriceTreshold: makerBid.underlyingPriceTreshold,
  };

  // need to have a collection field in here aswell
  const takerAsk = {
    isOrderAsk: true,
    taker: ADDRESS2,
    price: parsedMakerBid.price,
    tokenId: 23,
  };

  let tx = await speculateExchange.matchBidWithTakerAsk(
    takerAsk,
    parsedMakerBid,
    {
      gasLimit: 500000,
    }
  );
  await tx.wait();
  console.log(tx);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
