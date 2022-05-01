const ethers = require('ethers');
const CurrencyManager = require('../out/CurrencyManager.sol/CurrencyManager.json');
const ExecutionManager = require('../out/ExecutionManager.sol/ExecutionManager.json');
const RoyaltyFeeRegistry = require('../out/RoyaltyFeeRegistry.sol/RoyaltyFeeRegistry.json');
const RoyaltyFeeManager = require('../out/RoyaltyFeeManager.sol/RoyaltyFeeManager.json');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const StrategyStandardSaleForFixedPrice = require('../out/StrategyStandardSaleForFixedPrice.sol/StrategyStandardSaleForFixedPrice.json');
const TransferManagerERC721 = require('../out/TransferManagerERC721.sol/TransferManagerERC721.json');
const TransferManagerERC1155 = require('../out/TransferManagerERC1155.sol/TransferManagerERC1155.json');
const TransferSelectorNFT = require('../out/TransferSelectorNFT.sol/TransferSelectorNFT.json');
const { fuji, mumbai, rinkeby } = require('./addresses');
require('dotenv').config();

const protocolFeeRecipient = '0xB06903728e09748E3d941b83f1657B147bA045d2';
const _protocolFee = 200;
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
    new ethers.ContractFactory(
      StrategyStandardSaleForFixedPrice.abi,
      StrategyStandardSaleForFixedPrice.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      TransferManagerERC721.abi,
      TransferManagerERC721.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      TransferManagerERC1155.abi,
      TransferManagerERC1155.bytecode,
      wallet
    ),
    new ethers.ContractFactory(
      TransferSelectorNFT.abi,
      TransferSelectorNFT.bytecode,
      wallet
    ),
  ];
};

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);

  const [
    cmFactory,
    emFactory,
    rfrFactory,
    rfmFactory,
    seFactory,
    strategyFactory,
    tmERC721Factory,
    tmERC1155Factory,
    tsFactory,
  ] = getFactories(wallet);

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
    fuji.wavax,
    protocolFeeRecipient
  );
  await seContract.deployed();
  console.log('SpeculateExchange deployed at:', seContract.address);

  const strategyStandardSaleForFixedPrice = await strategyFactory.deploy(
    _protocolFee
  );
  await strategyStandardSaleForFixedPrice.deployed();
  console.log(
    'strategyStandardSaleForFixedPrice deployed at:',
    strategyStandardSaleForFixedPrice.address
  );

  let addCurrencyTx = await cmContract.addCurrency(fuji.wavax);
  await addCurrencyTx.wait();
  console.log('addCurrency tx:', addCurrencyTx);

  const transferManagerERC721 = await tmERC721Factory.deploy(
    seContract.address
  );
  await transferManagerERC721.deployed();
  console.log(
    'transferManagerERC721 deployed at:',
    transferManagerERC721.address
  );

  const transferManagerERC1155 = await tmERC1155Factory.deploy(
    seContract.address
  );
  await transferManagerERC1155.deployed();
  console.log(
    'transferManagerERC1155 deployed at:',
    transferManagerERC1155.address
  );

  const transferSelectorNFT = await tsFactory.deploy(
    transferManagerERC721.address,
    transferManagerERC1155.address
  );
  console.log('transferSelectorNFT deployed at:', transferSelectorNFT.address);

  let tx = await seContract.updateTransferSelectorNFT(
    transferSelectorNFT.address
  );
  await tx.wait();
  console.log('transferSelector updated tx:', tx.hash);
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
