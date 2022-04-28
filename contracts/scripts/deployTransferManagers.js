const ethers = require('ethers');
const TransferManagerERC721 = require('../out/TransferManagerERC721.sol/TransferManagerERC721.json');
const TransferManagerERC1155 = require('../out/TransferManagerERC1155.sol/TransferManagerERC1155.json');
const TransferSelectorNFT = require('../out/TransferSelectorNFT.sol/TransferSelectorNFT.json');
const { SPECULATE_EXCHANGE } = require('./addresses');
require('dotenv').config();

const getFactories = (wallet) => {
  return [
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
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);

  const [tmERC721Factory, tmERC1155Factory, tsFactory] = getFactories(wallet);

  const transferManagerERC721 = await tmERC721Factory.deploy(
    SPECULATE_EXCHANGE
  );
  await transferManagerERC721.deployed();
  console.log(
    'transferManagerERC721 deployed at:',
    transferManagerERC721.address
  );

  const transferManagerERC1155 = await tmERC1155Factory.deploy(
    SPECULATE_EXCHANGE
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
