const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const NFTCollection = require('../out/NFT.sol/NFT.json');
const WETH_ABI = require('../wethABI.json');
const { fuji, mumbai, rinkeby, ADDRESS3, ADDRESS2 } = require('./addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_fuji);
  const wallet = new ethers.Wallet(process.env.pk3, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const speculateExchange = factory.attach(fuji.speculateExchange);

  const BID = ethers.BigNumber.from(ethers.utils.parseEther('0.05'));

  const weth = new ethers.Contract(fuji.wavax, WETH_ABI, wallet);
  let approveTx = await weth.approve(
    speculateExchange.address,
    ethers.utils.parseEther('5')
  );
  await approveTx.wait();
  console.log('approveTx:', approveTx.hash);

  const makerBid = {
    isOrderAsk: false,
    signer: ADDRESS3,
    collection: fuji.nftCollection,
    price: BID,
    tokenId: 39,
    amount: 1,
    strategy: fuji.strategy,
    currency: fuji.wavax,
    startTime: 1651301377,
    endTime: 1660995560,
  };

  let tx = await speculateExchange.createMakerBid(makerBid, {
    gasLimit: 500000,
  });
  await tx.wait();
  console.log(tx);
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
