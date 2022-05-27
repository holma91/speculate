const fs = require('fs');
const express = require('express');
const ethers = require('ethers');
const SpeculateExchange = require('../out/SpeculateExchange.sol/SpeculateExchange.json');
const { fuji, rinkeby, binanceTest } = require('../scripts/addresses');
require('dotenv').config();
const cors = require('cors');
const app = express();
app.use(cors());
const port = 3002;

// set up contract
provider = new ethers.providers.JsonRpcProvider(process.env.rpc_binancetest);
const wallet = new ethers.Wallet(process.env.pk2, provider);
const speculateExchange = new ethers.Contract(
  binanceTest.speculateExchange,
  SpeculateExchange.abi,
  wallet
);

let makerAsks = {};
let makerBids = {};

fs.readFile('./serverTest/makerAsks.json', 'utf8', (_, storedMakerAsks) => {
  makerAsks = JSON.parse(storedMakerAsks);
});

fs.readFile('./serverTest/makerBids.json', 'utf8', (_, storedMakerBids) => {
  makerBids = JSON.parse(storedMakerBids);
});

speculateExchange.on(
  'MakerAsk',
  async (
    signer,
    collection,
    tokenId,
    isOrderAsk,
    currency,
    amount,
    price,
    startTime,
    endTime,
    underlyingPriceFeed,
    underlyingPriceTreshold
  ) => {
    console.log('MakerAsk received');
    collection = collection.toLowerCase();
    if (!makerAsks[collection]) {
      makerAsks[collection] = {};
    }

    makerAsks[collection][tokenId] = {
      signer: signer.toLowerCase(),
      collection: collection.toLowerCase(),
      tokenId: tokenId.toString(),
      isOrderAsk: isOrderAsk,
      currency: currency.toLowerCase(),
      amount: amount.toString(),
      price: price.toString(),
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      underlyingPriceFeed: underlyingPriceFeed.toLowerCase(),
      underlyingPriceTreshold: underlyingPriceTreshold.toString(),
    };

    fs.writeFile(
      './serverTest/makerAsks.json',
      JSON.stringify(makerAsks),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'MakerBid',
  async (
    signer,
    collection,
    tokenId,
    isOrderAsk,
    currency,
    amount,
    price,
    startTime,
    endTime,
    underlyingPriceFeed,
    underlyingPriceTreshold
  ) => {
    console.log('MakerBid received');
    collection = collection.toLowerCase();
    if (!makerBids[collection]) {
      makerBids[collection] = {};
    }

    if (!makerBids[collection][tokenId]) {
      makerBids[collection][tokenId] = [
        {
          signer: signer.toLowerCase(),
          collection: collection.toLowerCase(),
          tokenId: tokenId.toString(),
          isOrderAsk: isOrderAsk,
          currency: currency.toLowerCase(),
          amount: amount.toString(),
          price: price.toString(),
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          underlyingPriceFeed: underlyingPriceFeed.toLowerCase(),
          underlyingPriceTreshold: underlyingPriceTreshold.toString(),
        },
      ];
    } else {
      // remove the last bid by this address
      makerBids[collection][tokenId] = makerBids[collection][tokenId].filter(
        (bid) => bid.signer !== signer.toLowerCase()
      );
      // add new bid
      makerBids[collection][tokenId].push({
        signer: signer.toLowerCase(),
        collection: collection.toLowerCase(),
        tokenId: tokenId.toString(),
        isOrderAsk: isOrderAsk,
        currency: currency.toLowerCase(),
        amount: amount.toString(),
        price: price.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        underlyingPriceFeed: underlyingPriceFeed.toLowerCase(),
        underlyingPriceTreshold: underlyingPriceTreshold.toString(),
      });
    }

    fs.writeFile(
      './serverTest/makerBids.json',
      JSON.stringify(makerBids),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'TakerAsk',
  async (taker, maker, tokenId, currency, collection, amount, price) => {
    console.log('TakerAsk received');
    collection = collection.toLowerCase();
    delete makerBids[collection][tokenId];
    delete makerAsks[collection][tokenId];
    fs.writeFile(
      './serverTest/makerBids.json',
      JSON.stringify(makerBids),
      (err, _) => {
        if (err) console.log(err);
      }
    );
  }
);

speculateExchange.on(
  'TakerBid',
  async (taker, maker, tokenId, currency, collection, amount, price) => {
    console.log('TakerBid received');
    collection = collection.toLowerCase();
    delete makerAsks[collection][tokenId];
    delete makerBids[collection][tokenId];
    fs.writeFile(
      './serverTest/makerAsks.json',
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
    res.json([]);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
