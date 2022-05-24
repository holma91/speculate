const ethers = require('ethers');
const SpeculateExchange = require('../../out/SpeculateExchange.sol/SpeculateExchange.json');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const { fuji, mumbai, rinkeby, ADDRESS3, ADDRESS2 } = require('../addresses');
require('dotenv').config();

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const collection = new ethers.Contract(
    rinkeby.optionFactory,
    OptionFactory.abi,
    wallet
  );

  let approval_tx1 = await collection.setApprovalForAll(
    rinkeby.speculateExchange,
    true
  );
  await approval_tx1.wait();
  console.log('approval tx1:', approval_tx1.hash);

  let approval_tx2 = await collection.setApprovalForAll(
    rinkeby.transferManagerERC721,
    true
  );
  await approval_tx2.wait();
  console.log('approval tx 2:', approval_tx2.hash);

  const speculateExchange = factory.attach(rinkeby.speculateExchange);

  const makerAsk = {
    isOrderAsk: true,
    signer: ADDRESS2,
    collection: rinkeby.optionFactory,
    price: ethers.BigNumber.from(ethers.utils.parseEther('0.07')),
    tokenId: 2,
    amount: 1,
    strategy: rinkeby.strategy,
    currency: rinkeby.weth,
    startTime: 1651301377,
    endTime: 1660995560,
  };

  let tx = await speculateExchange.createMakerAsk(makerAsk, {
    gasLimit: 500000,
  });
  await tx.wait();
  console.log(tx.hash);
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
