// import * as fs from 'fs';
// import * as path from 'path';
const fs = require('fs');
const ipfsClient = require('ipfs-http-client');
const { Canvg, presets } = require('canvg');
const { DOMParser } = require('xmldom');
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
      width="320"
      height="320"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="${asset.toUpperCase() === 'ETH' ? '120' : '123'}"
        y="49"
        fontSize="25"
        fontWeight="300"
      >
      ${asset.toUpperCase()} CALL
      </text>
      <line
        x1="20"
        y1="65"
        x2="300"
        y2="65"
        stroke="black"
        strokeWidth="1.25"
      />
      <text x="70" y="105" fontSize="20" fontWeight="300">
        Price Feed: ${asset.toUpperCase()}/USD
      </text>
      <text x="70" y="150" fontSize="20" fontWeight="300">
        Strike Price: $${option.strikePrice}
      </text>
      <text x="70" y="195" fontSize="20" fontWeight="300">
        Amount: ${ethers.utils.formatEther(
          option.underlyingAmount
        )} ${asset.toUpperCase()}
      </text>
      <text x="70" y="240" fontSize="20" fontWeight="300">
        Expiry: ${option.expiry}
      </text>
      <text x="70" y="285" fontSize="20" fontWeight="300">
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
