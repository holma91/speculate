const ethers = require('ethers');
const SpeculateExchange = require('../../out/SpeculateExchange.sol/SpeculateExchange.json');
const { fuji, mumbai, rinkeby } = require('../addresses');
require('dotenv').config();

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.rpc_rinkeby
  );
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    SpeculateExchange.abi,
    SpeculateExchange.bytecode,
    wallet
  );

  const speculateExchange = factory.attach(rinkeby.speculateExchange);

  // let tx = await speculateExchange.updateTransferSelectorNFT(
  //   rinkeby.transferSelectorNFT
  // );
  // await tx.wait();
  // console.log(tx.hash);
  // const makerAsk = await speculateExchange.getMakerAsk(fuji.nftCollection, 25);
  // console.log(makerAsk);
  let code = await provider.getCode('backe.eth');
  console.log(code);
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
