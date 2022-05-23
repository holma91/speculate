const ethers = require('ethers');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const { fuji, mumbai, rinkeby } = require('../addresses');
require('dotenv').config();

const assets = ['ETH', 'BTC', 'ATOM', 'LINK', 'MATIC'];
const prices = [2000, 200, 211, 4322, 9888, 50000, 20000, 5, 9, 100];
const amounts = ['0.01', '0.02', '0.04', '0.025', '0.05'];
const timestamps = [1653384630, 1653384830, 1653284610, 1653384635, 1653384830];

const priceFeeds = {
  RINKEBY: {
    ETH: {
      USD: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    BTC: {
      USD: '0xECe365B379E1dD183B20fc5f022230C044d51404',
    },
    ATOM: {
      USD: '0x3539F2E214d8BC7E611056383323aC6D1b01943c',
    },
    LINK: {
      USD: '0xd8bd0a1cb028a31aa859a21a3758685a95de4623',
    },
    MATIC: {
      USD: '0x7794ee502922e2b723432DDD852B3C30A911F021',
    },
  },
  FUJI: {
    ETH: {
      USD: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
    },
    BTC: {
      USD: '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
    },
    AVAX: {
      USD: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
    },
    LINK: {
      USD: '0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470',
    },
  },
};

const main = async () => {
  provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
  const wallet = new ethers.Wallet(process.env.pk2, provider);
  const factory = new ethers.ContractFactory(
    OptionFactory.abi,
    OptionFactory.bytecode,
    wallet
  );

  const optionFactory = factory.attach(rinkeby.optionFactory);

  for (let i = 0; i < 30; i++) {
    let asset = Math.floor(Math.random() * assets.length);
    let option = {
      underlyingPriceFeed: priceFeeds.RINKEBY[asset].USD,
      underlyingAmount: ethers.utils.parseUnits(
        Math.floor(Math.random() * amounts.length)
      ),
      call: Math.random() > 0.35,
      strikePrice: ethers.utils.parseUnits(
        Math.floor(Math.random() * prices.length),
        8
      ),
      expiry: Math.floor(Math.random() * timestamps.length),
    };
    let mintedLongs = Math.floor(Math.random() * 5 + 1);
    let collateral = {
      priceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
      amount:
        Math.random() > 0.35
          ? option.underlyingAmount.mul(mintedLongs)
          : option.underlyingAmount.mul(mintedLongs).mul(1.5),
      mintedLongs,
    };

    let metadataURI = '';
    optionFactory.createOption(option, collateral, metadataURI, {
      value: collateral.amount,
    });

    break;
  }

  console.log('finished');
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