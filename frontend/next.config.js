/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ALCHEMY_RINKEBY_RPC:
      'https://eth-rinkeby.alchemyapi.io/v2/yMdJ2lfGieVh__vNl2R15y9Y9Vgdsg3f',
    ALCHEMY_MUMBAI_RPC:
      'https://polygon-mumbai.g.alchemy.com/v2/i7Fu5aNLFGC4Ho0CwVobUDdbn-FBftay',
    MORALIS_API_KEY:
      'yX0WI4udu8OZHU9W6DNeOGeaTw40AKRYYIV8pY1cnCNIUpJTPJp39OyzxbCLRcXZ',
  },
};

module.exports = nextConfig;
