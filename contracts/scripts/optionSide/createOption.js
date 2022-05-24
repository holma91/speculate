const ethers = require('ethers');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const { fuji, mumbai, rinkeby } = require('../addresses');
const { createSvg, uploadToIpfs, generateMetadata } = require('../ipfsHelper');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    OptionFactory.abi,
    OptionFactory.bytecode,
    wallet
  );

  const optionFactory = factory.attach(rinkeby.optionFactory);

  const asset = 'ETH';

  const option = {
    underlyingPriceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    underlyingAmount: ethers.utils.parseUnits('0.01'),
    call: true,
    strikePrice: 2200,
    expiry: 1000000,
  };
  const collateral = {
    priceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    amount: ethers.utils.parseUnits('0.01'),
  };

  let svg = createSvg(option, asset);

  const options = generateMetadata(option, asset);
  options.image = svg;
  let metadataURI = await uploadToIpfs(options);

  console.log('metadataURI:', metadataURI);

  console.log(collateral.amount);

  let tx = await optionFactory.createOption(option, collateral, metadataURI, {
    value: collateral.amount,
  });
  await tx.wait();
  console.log('option created:', tx.hash);
  const retrievedOption = await optionFactory.getOptionById(0);
  const retrievedCollateral = await optionFactory.getCollateralById(0);
  console.log(retrievedOption);
  console.log(retrievedCollateral);
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
