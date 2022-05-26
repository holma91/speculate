export const priceFeeds = {
  'binance testnet': {
    bnb: {
      usd: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
    },
    eth: {
      usd: '0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7',
    },
    btc: {
      usd: '0x5741306c21795FdCBb9b265Ea0255F499DFe515C',
    },
    link: {
      usd: '0x351Ff08FF5077d6E8704A4763836Fe187f074380',
    },
    matic: {
      usd: '0x957Eb0316f02ba4a9De3D308742eefd44a3c1719',
    },
    dot: {
      usd: '0xEA8731FD0685DB8AeAde9EcAE90C4fdf1d8164ed',
    },
  },
  binance: {
    bnb: {
      usd: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
    },
    link: {
      usd: '0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8',
    },
    matic: {
      usd: '0x7CA57b0cA6367191c94C8914d7Df09A57655905f',
    },
    eth: {
      usd: '0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7',
    },
    dot: {
      usd: '0xC333eb0086309a16aa7c8308DfD32c8BBA0a2592',
    },
  },
  rinkeby: {
    eth: {
      usd: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    btc: {
      usd: '0xECe365B379E1dD183B20fc5f022230C044d51404',
    },
    atom: {
      usd: '0x3539F2E214d8BC7E611056383323aC6D1b01943c',
    },
    link: {
      usd: '0xd8bd0a1cb028a31aa859a21a3758685a95de4623',
    },
    matic: {
      usd: '0x7794ee502922e2b723432DDD852B3C30A911F021',
    },
  },
  fuji: {
    eth: {
      usd: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
    },
    btc: {
      usd: '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
    },
    avax: {
      usd: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
    },
    link: {
      usd: '0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470',
    },
  },
};

export const moralisMapping = {
  rinkeby: 'rinkeby',
  bsc: 'bsc',
  'binance testnet': 'bsc%20testnet',
};

export const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
    name: 'getRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];
