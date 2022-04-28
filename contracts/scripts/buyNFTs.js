const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const WETH_ABI = require('../wethABI.json');
const {
  ADDRESS3,
  WETH_RINKEBY,
  SPECULATE_EXCHANGE,
  TRANSFER_MANAGER_ERC721,
} = require('./addresses');
require('dotenv').config();

const collectionAddress = '0x6a7091978AbDeCDFA06ff14bAAbf323873DFEd96';

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk3, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const BID = ethers.BigNumber.from(ethers.utils.parseEther('0.01'));

  const speculateExchange = factory.attach(SPECULATE_EXCHANGE);

  const weth = new ethers.Contract(WETH_RINKEBY, WETH_ABI, wallet);
  let approveTx = await weth.approve(speculateExchange.address, BID);
  await approveTx.wait();
  console.log('approvedTx:', approveTx);

  const makerAsk = await speculateExchange.getMakerOrder(3);

  // need to have a collection field in here aswell
  const takerBid = {
    isOrderAsk: false,
    taker: ADDRESS3,
    price: BID,
    tokenId: 9,
  };

  // ERROR WHEN TRANSFERING THE NFT

  let tx = await speculateExchange.matchAskWithTakerBid(takerBid, makerAsk, {
    gasLimit: 300000,
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
