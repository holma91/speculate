const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const WETH_ABI = require('../wethABI.json');
const { ADDRESS3, ADDRESS2, mumbai, rinkeby, fuji } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk3, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const BID = ethers.BigNumber.from(ethers.utils.parseEther('0.01'));

  const speculateExchange = factory.attach(fuji.speculateExchange);

  const weth = new ethers.Contract(fuji.wavax, WETH_ABI, wallet);
  let approveTx = await weth.approve(speculateExchange.address, BID);
  await approveTx.wait();
  console.log('approveTx:', approveTx.hash);

  const makerAsk = await speculateExchange.getMakerAsk(fuji.nftCollection, 2);
  const parsedMakerAsk = {
    isOrderAsk: makerAsk.isOrderAsk,
    signer: makerAsk.signer,
    collection: makerAsk.collection,
    price: makerAsk.price,
    tokenId: makerAsk.tokenId,
    amount: makerAsk.amount,
    strategy: makerAsk.strategy,
    currency: makerAsk.currency,
    startTime: makerAsk.startTime,
    endTime: makerAsk.endTime,
  };

  // need to have a collection field in here aswell
  const takerBid = {
    isOrderAsk: false,
    taker: ADDRESS3,
    price: BID,
    tokenId: 2,
  };

  // console.log(parsedMakerAsk);
  // console.log(takerBid);

  let tx = await speculateExchange.matchAskWithTakerBid(
    takerBid,
    parsedMakerAsk,
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
