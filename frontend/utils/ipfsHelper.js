// import * as fs from 'fs';
// import * as path from 'path';
import * as ipfsClient from 'ipfs-http-client';
import { ethers } from 'ethers';

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

  if (uri.startsWith('ipfs://ipfs/')) {
    uri = uri.replace('ipfs://ipfs/', 'ipfs://');
  }
  return uri;
}

const uploadToIpfs = async (metadata) => {
  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  const { cid: metadataCid } = await ipfs.add(
    { path: '/nft/metadata.json', content: JSON.stringify(metadata) },
    ipfsAddOptions
  );

  const metadataURI = ensureIpfsUriPrefix(metadataCid) + '/metadata.json';

  return metadataURI;
};

const createSvg = (option, asset, assetDecimals) => {
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
        Strike Price: $${ethers.utils.formatUnits(
          option.strikePrice,
          assetDecimals
        )}
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

const generateMetadata = (values, svg) => {
  return {
    description: `${values.type.toUpperCase()} option on ${values.asset.toUpperCase()}/USD`,
    name: `${values.type.toUpperCase()} ${values.asset.toUpperCase()}/USD`,
    image: svg,
    attributes: [
      {
        trait_type: 'Asset',
        value: values.asset.toUpperCase(),
      },
      {
        trait_type: 'Strike Price',
        value: `$${values.strikePrice.toString()}`,
      },
      {
        trait_type: 'Right to buy',
        value: `${values.rightToBuy.toString()} ${values.asset.toUpperCase()}`,
      },
      {
        trait_type: 'Expiry',
        value: values.expiry,
      },
      {
        trait_type: 'Option Type',
        value: values.type.toUpperCase(),
      },
      {
        trait_type: 'Option Style',
        value: 'American',
      },
    ],
  };
};

export { generateMetadata, uploadToIpfs, createSvg };
