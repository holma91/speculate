const ethers = require('ethers');
const SpeculateExchange = require('../../out/SpeculateExchange.sol/SpeculateExchange.json');
const WETH_ABI = require('../../wethABI.json');
const {
  fuji,
  mumbai,
  rinkeby,
  ADDRESS3,
  ADDRESS2,
  ADDRESS4,
} = require('../addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk3, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const speculateExchange = factory.attach(rinkeby.speculateExchange);

  const BID = ethers.BigNumber.from(ethers.utils.parseEther('0.03'));

  const weth = new ethers.Contract(rinkeby.weth, WETH_ABI, wallet);
  let approveTx = await weth.approve(
    speculateExchange.address,
    ethers.utils.parseEther('5')
  );
  await approveTx.wait();
  console.log('approveTx:', approveTx.hash);

  const makerBid = {
    isOrderAsk: false,
    signer: ADDRESS3,
    collection: rinkeby.optionFactory,
    price: BID,
    tokenId: 23,
    amount: 1,
    strategy: rinkeby.strategy,
    currency: rinkeby.weth,
    startTime: 1651301377,
    endTime: 1660995560,
    underlyingPriceFeed: rinkeby.ethUsd,
    underlyingPriceTreshold: ethers.utils.parseUnits('1900', 8),
  };

  let tx = await speculateExchange.createMakerBid(makerBid, {
    gasLimit: 500000,
  });
  await tx.wait();
  console.log(tx.hash);
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
