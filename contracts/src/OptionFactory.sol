// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionFactory is ERC1155URIStorage {
    uint256 public currentOptionId;

    mapping(uint256 => Option) public optionById;
    mapping(uint256 => Collateral) public collateralById;

    struct Option {
        address underlyingPriceFeed;
        uint256 underlyingAmount;
        bool call;
        uint256 strikePrice;
        uint256 expiry;
    }

    struct Collateral {
        address priceFeed;
        uint256 amount;
        uint256 mintedLongs;
    }

    constructor() ERC1155("") {
        currentOptionId = 0;
    }

    function createOption(Option memory option, Collateral memory collateral)
        public
        payable
        returns (uint256)
    {
        require(collateral.amount == msg.value, "wrong collateral amount");
        collateralById[currentOptionId] = collateral;

        optionById[currentOptionId] = option;
        _mint(msg.sender, currentOptionId, collateral.mintedLongs, ""); // longs
        // _setURI(currentOptionId, metadataURI);

        return currentOptionId++;
    }

    function exerciseOption(uint256 optionId, uint256 amount) public {
        // msg.sender needs to hold the corresponding nft
        uint256 balance = balanceOf(msg.sender, optionId);
        require(balance >= amount, "too small balance");

        Option memory option = getOptionById(optionId);

        // check expiry
        require(block.timestamp >= option.expiry, "not at expiry");

        // check price
        (, int256 currentPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();
        int256 totalValue = currentPrice * int256(amount);
        uint256 total = option.underlyingAmount * amount;

        // burn the exercised options
        _burn(msg.sender, optionId, amount);

        // settle in cash
        (bool sent, ) = msg.sender.call{value: total}("");
        require(sent, "failed ether transfer");
    }

    function getCollateralToRiskRatio(uint256 optionId)
        public
        view
        returns (int256)
    {
        Option memory option = optionById[optionId];
        Collateral memory collateral = collateralById[optionId];

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();
        (, int256 collateralPrice, , , ) = AggregatorV3Interface(
            collateral.priceFeed
        ).latestRoundData();

        int256 riskUsd = int256(option.underlyingAmount) *
            int256(collateral.mintedLongs) *
            underlyingPrice;
        int256 collateralUsd = int256(collateral.amount) * collateralPrice;

        return (collateralUsd * 10**3) / riskUsd;
    }

    function canBeLiquidated(uint256 optionId) public view returns (bool) {
        Option memory option = optionById[optionId];

        Collateral memory collateral = collateralById[optionId];
        require(
            option.underlyingPriceFeed != collateral.priceFeed,
            "liquidate: covered call cannot be liquidated"
        );

        int256 collateralToRiskRatio = getCollateralToRiskRatio(optionId);

        return collateralToRiskRatio < 1200;
    }

    function getCollateralById(uint256 optionId)
        public
        view
        returns (Collateral memory)
    {
        return collateralById[optionId];
    }

    function getOptionById(uint256 optionId)
        public
        view
        returns (Option memory)
    {
        return optionById[optionId];
    }
}
