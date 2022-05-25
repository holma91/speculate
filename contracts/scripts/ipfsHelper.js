// import * as fs from 'fs';
// import * as path from 'path';
const fs = require('fs');
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
      <text x="122" y="49" fontSize="25" fontWeight="200">
      ${asset.toUpperCase()} CALL
      </text>
      <line x1="40" y1="65" x2="310" y2="65" stroke="black" strokeWidth="1" />
      <text x="80" y="105" fontSize="20" fontWeight="200">
        Price Feed: ${asset.toUpperCase()}/USD
      </text>
      <text x="80" y="150" fontSize="20" fontWeight="200">
        Strike Price: $${ethers.utils.formatUnits(option.strikePrice, 8)}
      </text>
      <text x="80" y="195" fontSize="20" fontWeight="200">
        Amount: ${ethers.utils.formatEther(
          option.underlyingAmount
        )} ${asset.toUpperCase()}
      </text>
      <text x="80" y="240" fontSize="20" fontWeight="200">
        Expiry: ${option.expiry}
      </text>
      <text x="80" y="285" fontSize="20" fontWeight="200">
        American Style
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
        value: 'American',
      },
    ],
  };
};

module.exports = { generateMetadata, uploadToIpfs, createSvg };
