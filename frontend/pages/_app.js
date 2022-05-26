import '../styles/globals.css';
import Layout from '../components/Layout';

import '@rainbow-me/rainbowkit/styles.css';
import {
  apiProvider,
  getDefaultWallets,
  RainbowKitProvider,
  configureChains,
} from '@rainbow-me/rainbowkit';
import { chain, createClient, WagmiProvider } from 'wagmi';

const avalancheChain = {
  id: 43_114,
  name: 'Avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: 'https://api.avax.network/ext/bc/C/rpc',
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    snowtrace: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
  testnet: false,
};

const binanceSmartChain = {
  id: 56,
  name: 'Binance Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: 'https://rpc.ankr.com/bsc',
    fallback: 'https://bsc-dataseed1.binance.org',
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com/' },
  },
  testnet: false,
  iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=022',
};

const binanceSmartChainTestnet = {
  id: 97,
  name: 'Binance Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: 'https://data-seed-prebsc-2-s3.binance.org:8545',
    fallback: 'https://data-seed-prebsc-2-s3.binance.org:8545',
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com/' },
  },
  testnet: true,
  iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png?v=022',
};

chain.rinkeby.nativeCurrency.symbol = 'ETH';

const { chains, provider } = configureChains(
  [
    // chain.mainnet,
    chain.rinkeby,
    // chain.polygon,
    // chain.optimism,
    // chain.arbitrum,
    // avalancheChain,
    binanceSmartChain,
    binanceSmartChainTestnet,
  ],
  [apiProvider.alchemy(process.env.ALCHEMY_ID), apiProvider.fallback()]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider chains={chains} showRecentTransactions={true}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

export default MyApp;
