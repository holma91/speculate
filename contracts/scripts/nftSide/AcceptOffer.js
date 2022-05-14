const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const WETH_ABI = require('../wethABI.json');
const { ADDRESS3, ADDRESS2, mumbai, rinkeby, fuji } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const takerAskPrice = ethers.BigNumber.from(ethers.utils.parseEther('0.004'));

  const speculateExchange = factory.attach(fuji.speculateExchange);

  const makerBid = await speculateExchange.getMakerBid(fuji.nftCollection, 45);
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

  // need to have a collection field in here aswell
  const takerAsk = {
    isOrderAsk: true,
    taker: ADDRESS2,
    price: takerAskPrice,
    tokenId: 45,
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
