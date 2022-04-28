const ethers = require('ethers');
const NFT = require('../out/NFT.sol/NFT.json');
const { NFT_CONTRACT_MUMBAI, ADDRESS2 } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_mumbai);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(NFT.abi, NFT.bytecode, wallet);

  const nft = factory.attach(NFT_CONTRACT_MUMBAI);

  for (let i = 0; i < 25; i++) {
    let tx = await nft.mintTo(ADDRESS2, {
      gasLimit: 300000,
      value: ethers.utils.parseEther('0.01'),
    });
    await tx.wait();
    console.log(tx.hash);
  }
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
