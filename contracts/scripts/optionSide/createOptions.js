const ethers = require('ethers');
const OptionFactory = require('../../out/OptionFactory.sol/OptionFactory.json');
const { createSvg, uploadToIpfs, generateMetadata } = require('../ipfsHelper');
const { fuji, mumbai, rinkeby } = require('../addresses');
require('dotenv').config();

const assets = ['ETH', 'BTC', 'ATOM', 'LINK', 'MATIC'];
const prices = {
  ETH: [2000, 1900, 2100, 1500, 2050],
  BTC: [30000, 28000, 20000, 29000, 31000],
  LINK: [7, 6.7, 5.95, 6.5, 7.2],
  ATOM: [10, 10.7, 10.65, 9.5, 8.5],
  MATIC: [0.6, 0.7, 0.65, 0.63, 0.55],
};

const dates = [
  new Date('2023-01-01').getTime() / 1000,
  new Date('2024-01-01').getTime() / 1000,
  new Date('2022-05-26').getTime() / 1000,
  new Date('2022-05-27').getTime() / 1000,
  new Date('2022-05-28').getTime() / 1000,
  new Date('2022-05-29').getTime() / 1000,
  new Date('2022-05-30').getTime() / 1000,
  new Date('2022-06-01').getTime() / 1000,
];

const amounts = ['0.1', '0.02', '1', '0.25', '0.01'];

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
  const wallet = new ethers.Wallet(process.env.pk3, provider);
  const factory = new ethers.ContractFactory(
    OptionFactory.abi,
    OptionFactory.bytecode,
    wallet
  );

  const optionFactory = factory.attach(rinkeby.optionFactory);

  for (let i = 0; i < 20; i++) {
    let asset = assets[Math.floor(Math.random() * assets.length)];
    let option = {
      underlyingPriceFeed: priceFeeds.RINKEBY[asset].USD,
      underlyingAmount: ethers.utils.parseUnits(
        amounts[Math.floor(Math.random() * amounts.length)]
      ),
      call: true,
      strikePrice: ethers.utils.parseUnits(
        prices[asset][
          Math.floor(Math.random() * prices[asset].length)
        ].toString(),
        8
      ),
      expiry: dates[Math.floor(Math.random() * dates.length)],
      european: Math.random() > 0.5 ? true : false,
    };

    let collateral = {
      priceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
      amount:
        Math.random() > 0.35
          ? option.underlyingAmount
          : option.underlyingAmount.mul(2),
    };

    let svg = createSvg(option, asset);

    const options = generateMetadata(option, asset);
    options.image = svg;
    let metadataURI = await uploadToIpfs(options);
    console.log('metadataURI:', metadataURI);

    let tx = await optionFactory.createOption(option, collateral, metadataURI, {
      value: collateral.amount,
    });

    await tx.wait();
    console.log(tx.hash);
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
