const ethers = require('ethers');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const {
  fuji,
  mumbai,
  rinkeby,
  priceFeed,
  priceFeeds,
  ADDRESS2,
  ADDRESS7,
  binanceTest,
} = require('../addresses');
const { createSvg, uploadToIpfs, generateMetadata } = require('../ipfsHelper');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_binancetest);
  const wallet = new ethers.Wallet(process.env.pk7, provider);
  const factory = new ethers.ContractFactory(
    OptionFactory.abi,
    OptionFactory.bytecode,
    wallet
  );

  const optionFactory = factory.attach(binanceTest.optionFactory);

  let tx = await optionFactory.exerciseOption(1);
  await tx.wait();
  console.log('option exercised:', tx.hash);
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
