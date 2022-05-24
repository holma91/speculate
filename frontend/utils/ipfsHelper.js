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
      <text x="122" y="49" fontSize="25" fontWeight="200">
      ${asset.toUpperCase()} CALL
      </text>
      <line x1="40" y1="65" x2="310" y2="65" stroke="black" strokeWidth="1" />
      <text x="80" y="105" fontSize="20" fontWeight="200">
        Price Feed: ${asset.toUpperCase()}/USD
      </text>
      <text x="80" y="150" fontSize="20" fontWeight="200">
        Strike Price: $${ethers.utils.formatUnits(
          option.strikePrice,
          assetDecimals
        )}
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
