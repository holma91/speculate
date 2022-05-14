const ethers = require('ethers');
const NFT = require('../out/NFT.sol/NFT.json');
const NFT2 = require('../out/NFT2.sol/NFT2.json');
const { fuji, mumbai, rinkeby, ADDRESS3, ADDRESS2 } = require('./addresses');
require('dotenv').config();

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.rpc_rinkeby
  );
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(NFT.abi, NFT.bytecode, wallet);

  // const nftContract = await factory.deploy();
  const nftContract = await factory.deploy('nejm', 'smbl');
  await nftContract.deployed();

  let tx = await nftContract.mintTo(ADDRESS2, {
    gasLimit: 300000,
  });
  await tx.wait();
  console.log(tx.hash);

  for (let i = 0; i < 5; i++) {}
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
