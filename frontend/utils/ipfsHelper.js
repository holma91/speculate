// import * as fs from 'fs';
// import * as path from 'path';
import * as ipfsClient from 'ipfs-http-client';

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

const uploadToIpfs = async (image, basename, options) => {
  // const content = await fs.readFile(filename);
  const ipfsPath = '/nft/' + basename;

  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  // console.log('image:', image);

  // let baffa = (...image);

  const { cid: assetCid } = await ipfs.add(
    { path: ipfsPath, content: image },
    ipfsAddOptions
  );

  // make the NFT metadata JSON
  const assetURI = ensureIpfsUriPrefix(assetCid) + '/' + basename;
  const metadata = await makeNFTMetadata(assetURI, options);

  const { cid: metadataCid } = await ipfs.add(
    { path: '/nft/metadata.json', content: JSON.stringify(metadata) },
    ipfsAddOptions
  );

  const metadataURI = ensureIpfsUriPrefix(metadataCid) + '/metadata.json';

  return metadataURI;
};

const generateMetadata = (values) => {
  return {
    description: `${values.type.toUpperCase()} option on ${values.asset.toUpperCase()}/USD`,
    name: `${values.type.toUpperCase()} ${values.asset.toUpperCase()}/USD`,
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

export { generateMetadata, uploadToIpfs };
