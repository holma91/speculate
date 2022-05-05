// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionFactory is ERC1155 {
    uint256 public currentOptionId;

    mapping(uint256 => Option) public optionById;
    mapping(uint256 => Collateral) public collateralById;

    struct Option {
        address underlyingPriceFeed;
        uint256 underlyingAmount;
        bool call;
        bool long;
        uint256 strikePrice;
        uint256 expiry;
    }

    struct Collateral {
        address priceFeed;
        uint256 amount;
        uint256 mintedLongs;
    }

    constructor() ERC1155("/path") {
        currentOptionId = 0;
    }

    function createOption(
        Option memory shortOption,
        Option memory longOption,
        Collateral memory collateral
    ) public returns (uint256) {
        collateralById[currentOptionId] = collateral;

        optionById[currentOptionId] = shortOption;
        _mint(msg.sender, currentOptionId, 1, ""); // short

        currentOptionId++;
        optionById[currentOptionId] = longOption;
        _mint(msg.sender, currentOptionId, collateral.mintedLongs, ""); // longs

        return currentOptionId++;
    }

    function canBeLiquidated(uint256 optionId) public view returns (bool) {
        Option memory option = optionById[optionId];
        require(!option.long, "liquidate: not a short");

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

        return riskUsd >= collateralUsd;
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
