const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const { fuji, mumbai, rinkeby } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const speculateExchange = factory.attach(fuji.speculateExchange);

  // let tx = await speculateExchange.updateTransferSelectorNFT(
  //   fuji.transferSelectorNFT
  // );
  // await tx.wait();
  // console.log(tx.hash);
  const makerAsks = await speculateExchange.getMakerAsks();
  console.log(makerAsks);
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
