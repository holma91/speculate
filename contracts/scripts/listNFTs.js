const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const MyEpicGameABI = require('../myEpicGameABI.json');
const {
  ADDRESS2,
  WETH_RINKEBY,
  SPECULATE_EXCHANGE,
  STRATEGY,
  TRANSFER_MANAGER_ERC721,
} = require('./addresses');
require('dotenv').config();

const collectionAddress = '0x6a7091978AbDeCDFA06ff14bAAbf323873DFEd96';

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const collection = new ethers.Contract(
    collectionAddress,
    MyEpicGameABI,
    wallet
  );

  let approval_tx = await collection.setApprovalForAll(
    SPECULATE_EXCHANGE,
    true
  );
  await approval_tx.wait();
  console.log('approval tx:', approval_tx);

  let approval_tx2 = await collection.setApprovalForAll(
    TRANSFER_MANAGER_ERC721,
    true
  );
  await approval_tx2.wait();
  console.log('approval tx 2:', approval_tx);

  const speculateExchange = factory.attach(SPECULATE_EXCHANGE);

  const makerAsk = {
    isOrderAsk: true,
    signer: ADDRESS2,
    collection: collectionAddress,
    price: ethers.BigNumber.from(ethers.utils.parseEther('0.01')),
    tokenId: 9,
    amount: 1,
    strategy: STRATEGY,
    currency: WETH_RINKEBY,
    startTime: 1650995560,
    endTime: 1660995560,
  };

  let tx = await speculateExchange.createMakerAsk(makerAsk, {
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
