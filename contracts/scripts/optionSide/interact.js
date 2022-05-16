const ethers = require('ethers');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const { fuji, mumbai, rinkeby } = require('../addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    OptionFactory.abi,
    OptionFactory.bytecode,
    wallet
  );

  const optionFactory = factory.attach(fuji.optionFactory);

  const shortOption = await optionFactory.getOptionById(0);
  const longOption = await optionFactory.getOptionById(1);
  const collateral = await optionFactory.getCollateralById(0);
  console.log(shortOption);
  console.log(longOption);
  console.log(collateral);
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