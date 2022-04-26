/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ALCHEMY_RINKEBY_RPC:
      'https://eth-rinkeby.alchemyapi.io/v2/PvbcEssyq-I-uMgV3dzMU_dl_SPDjqIC',
  },
};

module.exports = nextConfig;
