# Tokenized Options (Chainlink Hackathon Spring 2022 Submission)
### OBS
There are definitely bugs in the contracts, use carefully (lol)

## Summary

A platform/exchange where users can both be market makers (by writing and selling the options) and takers by buying options. It's not only limited to cryptocurrencies, it works just aswell with equities and fiat. Everything that's necessary to make this work is chainlink price feeds and basic math. The caveat is that the collateral needs to be in cryptocurrency, it can of course not be in say, apple stock. Every option that gets created gets a corresponding NFT that is traded freely. If you sell your NFT, you also sell your right to exercise the option. So the NFT isn't just connected to the option, it is the actual option.

## How it's built

The "backend" is basically divided into 2 parts, the exchange (SpeculateExchange.sol) and the option factory (OptionFactory.sol). There is also a minimalistic node server running that just index some events that are emitted from the exchange contract. The frontend is a next.js app.

## The Exchange

Inspired by the LooksRare NFT marketplace. Major differences are that their marketplace have a off-chain matching system while I do everything on-chain and that I allow users to place limit orders (by utilizing chainlink price feeds). The exchange currently only accepts trading in the wrapped native token, which in my case is WBNB. It's however easy to add more currencies, and it would probably be optimal.

## The Option Factory

Where the options are created. When a option is created a corresponding NFT gets minted, and when a option gets exercised the same NFT gets burned. Every NFT is stored "on" IPFS and pinned by infura. The Option Factory also keeps track of the collateral and thereby the health factor for a options seller. It doesn't yet but it should also handle liquidations when it's implemented.

## Technologies used

- chainlink price feeds
- binance smart chain
- ipfs for nft storage
- moralis web3 API for nft information
