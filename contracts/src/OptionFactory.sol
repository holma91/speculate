// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionFactory is ERC721URIStorage {
    uint256 public currentOptionId;

    mapping(uint256 => Option) public optionById;
    mapping(uint256 => Collateral) public collateralById;

    struct Option {
        address underlyingPriceFeed;
        uint256 underlyingAmount;
        bool call;
        uint256 strikePrice;
        uint256 expiry;
        bool european;
        address seller;
    }

    struct Collateral {
        address priceFeed;
        uint256 amount;
    }

    constructor() ERC721("najm", "smbl") {
        currentOptionId = 0;
    }

    function createOption(
        Option memory option,
        Collateral memory collateral,
        string memory metadataURI
    ) public payable returns (uint256) {
        require(collateral.amount == msg.value, "wrong collateral amount");
        require(option.seller == msg.sender, "seller must be sender");
        collateralById[currentOptionId] = collateral;

        int256 simulatedIntrinsicValue = getSimulatedIntrinsicValue(option);
        int256 collateralValue = getCollateralValue(currentOptionId);

        require(
            collateralValue >= simulatedIntrinsicValue,
            "base collateral not enough"
        );

        optionById[currentOptionId] = option;
        _safeMint(msg.sender, currentOptionId);
        _setTokenURI(currentOptionId, metadataURI);

        return currentOptionId++;
    }

    // simulate a price increase
    function getSimulatedIntrinsicValue(Option memory option)
        public
        view
        returns (int256)
    {
        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        int256 simulatedPrice = underlyingPrice * (1.25 * 10**3);

        int256 value = (simulatedPrice * int256(option.underlyingAmount)) /
            10**3;

        int256 valueAtStrikePrice = int256(option.strikePrice) *
            int256(option.underlyingAmount);

        int256 intrinsicValue = value - valueAtStrikePrice;

        return intrinsicValue;
    }

    function addCollateral(uint256 optionId) public payable {
        Collateral storage collateral = collateralById[optionId];
        collateral.amount += msg.value;
    }

    function withdrawCollateral(uint256 optionId, uint256 amount) public {
        Collateral storage collateral = collateralById[optionId];
        require(
            amount <= collateral.amount,
            "cannot withdraw more than what you have"
        );
        collateral.amount -= amount;

        require(
            canBeLiquidated(optionId) == false,
            "can't withdraw below liq limit"
        );

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "failed ether transfer");
    }

    function getPayout(uint256 optionId) public view returns (uint256) {
        require(ownerOf(optionId) == msg.sender, "only owner can exercise");

        Option memory option = getOptionById(optionId);
        Collateral storage collateral = collateralById[optionId];

        if (option.european) {
            require(block.timestamp >= option.expiry, "not at expiry");
        }

        int256 intrinsicValue = getIntrinsicValue(optionId);
        require(intrinsicValue > 0, "option is OTM");
        int256 collateralValue = getCollateralValue(optionId);
        require(collateralValue > 0, "Zero collateral");

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        int256 payout = (intrinsicValue * 10**18) / (underlyingPrice * 10**18);

        return uint256(payout);
    }

    function exerciseOption(uint256 optionId) public {
        require(ownerOf(optionId) == msg.sender, "only owner can exercise");

        Option memory option = getOptionById(optionId);
        Collateral storage collateral = collateralById[optionId];

        if (option.european) {
            require(block.timestamp >= option.expiry, "not at expiry");
        }

        int256 intrinsicValue = getIntrinsicValue(optionId);
        require(intrinsicValue > 0, "option is OTM");
        int256 collateralValue = getCollateralValue(optionId);
        require(collateralValue > 0, "Zero collateral");

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        int256 payout = (intrinsicValue * 10**18) / (underlyingPrice * 10**18);
        require(payout > 0, "negative payout");

        // burn the nft representing the exercised option
        _burn(optionId);

        collateral.amount -= uint256(payout);

        // settle in cash
        (bool sent, ) = msg.sender.call{value: uint256(payout)}("");
        require(sent, "failed ether transfer");
    }

    function getCollateralValue(uint256 optionId) public view returns (int256) {
        Collateral memory collateral = collateralById[optionId];
        (, int256 collateralPrice, , , ) = AggregatorV3Interface(
            collateral.priceFeed
        ).latestRoundData();

        int256 collateralValue = collateralPrice * int256(collateral.amount);
        return collateralValue;
    }

    function getIntrinsicValue(uint256 optionId) public view returns (int256) {
        Option memory option = optionById[optionId];

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        int256 value = underlyingPrice * int256(option.underlyingAmount);
        int256 valueAtStrikePrice = int256(option.strikePrice) *
            int256(option.underlyingAmount);

        int256 intrinsicValue = value - valueAtStrikePrice;

        return intrinsicValue;
    }

    function getUnderlyingValue(uint256 optionId) public view returns (int256) {
        Option memory option = optionById[optionId];

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        int256 value = underlyingPrice * int256(option.underlyingAmount);

        return value;
    }

    function canBeLiquidated(uint256 optionId) public view returns (bool) {
        int256 intrinsicValue = getIntrinsicValue(optionId);
        if (intrinsicValue <= 0) return false;

        int256 collateralValue = getCollateralValue(optionId);
        require(collateralValue > 0, "must always exist collateral");

        int256 ratio = (collateralValue * 1_000) / intrinsicValue;

        return ratio < 1200;
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
