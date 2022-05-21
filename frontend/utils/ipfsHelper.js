const fs = require('fs/promises');
const path = require('path');
const ipfsClient = require('ipfs-http-client');
require('dotenv').config();

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

const uploadToIpfs = async (filename, options) => {
  const content = await fs.readFile(filename);

  const basename = path.basename(filename);
  const ipfsPath = '/nft/' + basename;

  const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });

  const { cid: assetCid } = await ipfs.add(
    { path: ipfsPath, content },
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

module.exports = uploadToIpfs;
