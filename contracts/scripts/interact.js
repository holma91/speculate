const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const { SPECULATE_EXCHANGE, TRANSFER_SELECTOR_NFT } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const speculateExchange = factory.attach(SPECULATE_EXCHANGE);

  // let tx = await speculateExchange.updateTransferSelectorNFT(
  //   TRANSFER_SELECTOR_NFT
  // );
  let tx = await speculateExchange.getMakerOrder(2);
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
