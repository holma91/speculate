const ethers = require('ethers');
const NFT = require('../out/NFT.sol/NFT.json');
const { fuji, mumbai, rinkeby, ADDRESS3, ADDRESS2 } = require('./addresses');
require('dotenv').config();

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const nftContract = new ethers.Contract(fuji.nftCollection, NFT.abi, wallet);

  for (let i = 0; i < 20; i++) {
    let tx = await nftContract.mintTo(ADDRESS2, {
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
