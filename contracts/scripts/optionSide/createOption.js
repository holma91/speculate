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

  const asset = 'BNB';
  const priceFeed = priceFeeds['binance testnet'].bnb.usd;

  const option = {
    underlyingPriceFeed: priceFeed,
    underlyingAmount: ethers.utils.parseUnits('0.001'),
    call: true,
    strikePrice: ethers.BigNumber.from('15000000000'),
    expiry: new Date('2022-05-29').getTime() / 1000,
    european: false,
    seller: ADDRESS7,
  };

  const collateral = {
    priceFeed: option.underlyingPriceFeed,
    amount: ethers.utils.parseUnits('0.001'),
  };

  let svg = createSvg(option, asset);

  const options = generateMetadata(option, asset);
  options.image = svg;
  let metadataURI = await uploadToIpfs(options);

  console.log('metadataURI:', metadataURI);

  let tx = await optionFactory.createOption(option, collateral, metadataURI, {
    value: collateral.amount,
  });
  await tx.wait();
  console.log('option created:', tx.hash);
  // const retrievedOption = await optionFactory.getOptionById(0);
  // const retrievedCollateral = await optionFactory.getCollateralById(0);
  // console.log(retrievedOption);
  // console.log(retrievedCollateral);
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
