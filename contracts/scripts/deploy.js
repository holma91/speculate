const ethers = require('ethers');
const CurrencyManager = require('../out/CurrencyManager.sol/CurrencyManager.json');
const ExecutionManager = require('../out/ExecutionManager.sol/ExecutionManager.json');
const RoyaltyFeeRegistry = require('../out/RoyaltyFeeRegistry.sol/RoyaltyFeeRegistry.json');
const RoyaltyFeeManager = require('../out/RoyaltyFeeManager.sol/RoyaltyFeeManager.json');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
require('dotenv').config();

const protocolFeeRecipient = '0xB06903728e09748E3d941b83f1657B147bA045d2';
const _royaltyFeeLimit = 9000;

const getFactories = (wallet) => {
  return [
    new ethers.ContractFactory(
      CurrencyManager.abi,
      CurrencyManager.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      ExecutionManager.abi,
      ExecutionManager.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      RoyaltyFeeRegistry.abi,
      RoyaltyFeeRegistry.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      RoyaltyFeeManager.abi,
      RoyaltyFeeManager.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      SpeculateExchange.abi,
      SpeculateExchange.bytecode,
      wallet
    ),
  ];
};

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);

  const [cmFactory, emFactory, rfrFactory, rfmFactory, seFactory] =
    getFactories(wallet);

  const cmContract = await cmFactory.deploy();
  await cmContract.deployed();
  console.log('CurrencyManager deployed at:', cmContract.address);

  const emContract = await emFactory.deploy();
  await emContract.deployed();
  console.log('ExecutionManager deployed at:', emContract.address);

  const rfrContract = await rfrFactory.deploy(_royaltyFeeLimit);
  await rfrContract.deployed();
  console.log('RoyaltyFeeRegistry deployed at:', rfrContract.address);

  const rfmContract = await rfmFactory.deploy(rfrContract.address);
  await rfmContract.deployed();
  console.log('RoyaltyFeeManager deployed at:', rfmContract.address);

  const seContract = await seFactory.deploy(
    cmContract.address,
    emContract.address,
    rfmContract.address,
    WETH_RINKEBY,
    protocolFeeRecipient
  );
  await seContract.deployed();
  console.log('SpeculateExchange deployed at:', seContract.address);
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
