/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ALCHEMY_RINKEBY_RPC:
      'https://eth-rinkeby.alchemyapi.io/v2/IjdF6gQ3nU7X35kJ38hM5CIvIlbrvFz8',
    ALCHEMY_MUMBAI_RPC:
      'https://polygon-mumbai.g.alchemy.com/v2/i7Fu5aNLFGC4Ho0CwVobUDdbn-FBftay',
    MORALIS_API_KEY:
      'yX0WI4udu8OZHU9W6DNeOGeaTw40AKRYYIV8pY1cnCNIUpJTPJp39OyzxbCLRcXZ',
    ALCHEMY_ID: 'yMdJ2lfGieVh__vNl2R15y9Y9Vgdsg3f', // RINKEBY
    ipfsProjectId: '28pSgJCPBGqrTcdPWVB0B1Yd6nC',
    ipfsProjectSecret: '494c0284b39b11e5280a09bb7c0dae33',
  },
};

module.exports = nextConfig;
