const ipfsClient = require('ipfs-http-client');
const { Canvg, presets } = require('canvg');
const { DOMParser } = require('@xmldom/xmldom');
const canvas = require('canvas');
const fetch = require('node-fetch');
const ethers = require('ethers');
require('dotenv').config();

const preset = presets.node({
  DOMParser,
  canvas,
  fetch,
});

const ipfsAddOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
};

const auth =
  'Basic ' +
  Buffer.from(
    process.env.ipfsProjectId + ':' + process.env.ipfsProjectSecret
  ).toString('base64');

function ensureIpfsUriPrefix(cidOrURI) {
  let uri = cidOrURI.toString();
  if (!uri.startsWith('ipfs://')) {
    uri = 'ipfs://' + cidOrURI;
  }
  // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
  if (uri.startsWith('ipfs://ipfs/')) {
    uri = uri.replace('ipfs://ipfs/', 'ipfs://');
  }
  return uri;
}

const makeNFTMetadata = async (assetURI, options) => {
  assetURI = ensureIpfsUriPrefix(assetURI);
  options.image = assetURI;
  return options;
};

const createSvg = (option, asset) => {
  return `<svg
      width="350"
      height="350"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="350" height="350" fill="white" />
      <text x="50%" y="49" font-size="24" font-weight="300" dominant-baseline="middle" text-anchor="middle">
      ${asset.toUpperCase()} CALL
      </text>
      <line x1="40" y1="73" x2="310" y2="73" stroke="black" stroke-width="1.5" dominant-baseline="middle" text-anchor="middle" />
      <text x="50%" y="110" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">
        Price Feed: ${asset.toUpperCase()}/USD
      </text>
      <text x="50%" y="155" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">
        Strike Price: $${ethers.utils.formatUnits(option.strikePrice, 8)}
      </text>
      <text x="50%" y="200" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">
        Amount: ${ethers.utils.formatEther(
          option.underlyingAmount
        )} ${asset.toUpperCase()}
      </text>
      <text x="50%" y="245" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">
        Expiry: ${option.expiry}
      </text>
      <text x="50%" y="290" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">
        ${option.european ? 'European' : 'American'} Style
      </text>
    </svg>`;
};

const uploadToIpfs = async (options) => {
  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  const { cid: metadataCid } = await ipfs.add(
    { path: '/nft/metadata.json', content: JSON.stringify(options) },
    ipfsAddOptions
  );

  const metadataURI = ensureIpfsUriPrefix(metadataCid) + '/metadata.json';

  return metadataURI;
};

const generateMetadata = (option, asset) => {
  option.type = option.call ? 'call' : 'put';
  return {
    description: `${option.type.toUpperCase()} option on ${asset.toUpperCase()}/USD`,
    name: `${option.type.toUpperCase()} ${asset.toUpperCase()}/USD`,
    attributes: [
      {
        trait_type: 'Asset',
        value: asset.toUpperCase(),
      },
      {
        trait_type: 'Strike Price',
        value: `$${option.strikePrice.toString()}`,
      },
      {
        trait_type: 'Right to buy',
        value: `${ethers.utils.formatEther(
          option.underlyingAmount.toString()
        )} ${asset.toUpperCase()}`,
      },
      {
        trait_type: 'Expiry',
        value: option.expiry,
      },
      {
        trait_type: 'Option Type',
        value: option.type.toUpperCase(),
      },
      {
        trait_type: 'Option Style',
        value: option.european ? 'European' : 'American',
      },
    ],
  };
};

module.exports = { generateMetadata, uploadToIpfs, createSvg };
