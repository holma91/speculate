const fs = require('fs');
const express = require('express');
const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const { fuji, rinkeby } = require('../scripts/addresses');
require('dotenv').config();
const cors = require('cors');
const app = express();
app.use(cors());
const port = 3001;

// set up contract
provider = new ethers.providers.JsonRpcProvider(process.env.rpc_rinkeby);
const wallet = new ethers.Wallet(process.env.pk2, provider);
const speculateExchange = new ethers.Contract(
  rinkeby.speculateExchange,
  SpeculateExchange.abi,
  wallet
);

let makerAsks = {};
let makerBids = {};

fs.readFile('./server/makerAsks.json', 'utf8', (_, storedMakerAsks) => {
  makerAsks = JSON.parse(storedMakerAsks);
});

fs.readFile('./server/makerBids.json', 'utf8', (_, storedMakerBids) => {
  makerBids = JSON.parse(storedMakerBids);
});

speculateExchange.on(
  'MakerAsk',
  async (maker, collection, tokenId, currency, strategy, amount, price) => {
    console.log('MakerAsk received');
    collection = collection.toLowerCase();
    if (!makerAsks[collection]) {
      makerAsks[collection] = {};
    }

    makerAsks[collection][tokenId] = {
      maker: maker.toLowerCase(),
      collection: collection.toLowerCase(),
      tokenId,
      currency: currency.toLowerCase(),
      strategy: strategy.toLowerCase(),
      amount,
      price,
    };

    fs.writeFile(
      './server/makerAsks.json',
      JSON.stringify(makerAsks),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'MakerBid',
  async (maker, collection, tokenId, currency, strategy, amount, price) => {
    console.log('MakerBid received');
    collection = collection.toLowerCase();
    if (!makerBids[collection]) {
      makerBids[collection] = {};
    }
    makerBids[collection][tokenId] = {
      maker: maker.toLowerCase(),
      collection: collection.toLowerCase(),
      tokenId,
      currency: currency.toLowerCase(),
      strategy: strategy.toLowerCase(),
      amount,
      price,
    };

    fs.writeFile(
      './server/makerBids.json',
      JSON.stringify(makerBids),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'TakerAsk',
  async (
    taker,
    maker,
    strategy,
    currency,
    collection,
    tokenId,
    amount,
    price
  ) => {
    console.log('TakerAsk received');
    collection = collection.toLowerCase();
    delete makerBids[collection][tokenId];
    delete makerAsks[collection][tokenId];
    fs.writeFile(
      './server/makerBids.json',
      JSON.stringify(makerBids),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'TakerBid',
  async (
    taker,
    maker,
    strategy,
    currency,
    collection,
    tokenId,
    amount,
    price
  ) => {
    console.log('TakerBid received');
    collection = collection.toLowerCase();
    delete makerAsks[collection][tokenId];
    delete makerBids[collection][tokenId];
    fs.writeFile(
      './server/makerAsks.json',
      JSON.stringify(makerAsks),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

app.get('/makerAsks', (_, res) => {
  res.json(makerAsks);
});

app.get('/makerAsks/:collection', (req, res) => {
  const { collection } = req.params;
  if (makerAsks[collection]) {
    res.json(makerAsks[collection]);
  } else {
    res.json({});
  }
});

app.get('/makerAsks/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (makerAsks[collection] && makerAsks[collection][id]) {
    res.json(makerAsks[collection][id]);
  } else {
    res.json({});
  }
});

app.get('/makerBids', (_, res) => {
  res.json(makerBids);
});

app.get('/makerBids/:collection', (req, res) => {
  const { collection } = req.params;
  if (makerBids[collection]) {
    res.json(makerBids[collection]);
  } else {
    res.json({});
  }
});

app.get('/makerBids/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (makerBids[collection] && makerBids[collection][id]) {
    res.json(makerBids[collection][id]);
  } else {
    res.json({});
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
