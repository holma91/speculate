const ethers = require('ethers');
const NFT = require('../out/NFT.sol/NFT.json');
const NFT2 = require('../out/NFT2.sol/NFT2.json');
const { fuji, mumbai, rinkeby } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(NFT.abi, NFT.bytecode, wallet);

  const nftContract = factory.attach(fuji.nftCollection);

  const uri = await nftContract.tokenURI(1);
  console.log(uri);
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
