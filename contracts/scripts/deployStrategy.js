const ethers = require('ethers');
const StrategyStandardSaleForFixedPrice = require('../out/StrategyStandardSaleForFixedPrice.sol/StrategyStandardSaleForFixedPrice.json');
require('dotenv').config();

const protocolFeeRecipient = '0xB06903728e09748E3d941b83f1657B147bA045d2';
const _protocolFee = 200;

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);

  const factory = new ethers.ContractFactory(
    StrategyStandardSaleForFixedPrice.abi,
    StrategyStandardSaleForFixedPrice.bytecode,
    wallet
  );

  const strategyStandardSaleForFixedPrice = await factory.deploy(_protocolFee);
  await strategyStandardSaleForFixedPrice.deployed();
  console.log(
    'strategyStandardSaleForFixedPrice deployed at:',
    strategyStandardSaleForFixedPrice.address
  );
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
